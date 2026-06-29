import Foundation
import Contacts
import EventKit

/// Read-only bridges to the native macOS apps (Contacts, Calendar, Reminders).
/// Each call requests the relevant permission the first time (usage strings are
/// declared in the bundle Info.plist by make-app.sh).

struct MacContact: Identifiable, Sendable, Hashable {
    let id: String
    let name: String
    let organization: String?
    let email: String?
    let phone: String?
}

struct MacEvent: Identifiable, Sendable {
    let id: String
    let title: String
    let start: Date
    let end: Date
    let calendar: String
}

struct MacReminder: Identifiable, Sendable {
    let id: String
    let title: String
    let due: Date?
}

struct VoiceMemo: Identifiable, Sendable {
    let id: String
    let name: String
    let url: URL
    let date: Date
}

struct NoteRecording: Identifiable, Sendable {
    let id: String        // Notes note id
    let title: String
    let attachment: String
    let date: String
}

/// Runs AppleScript (Apple Events) — used to read call recordings from the Notes
/// app. Requires NSAppleEventsUsageDescription + the user granting automation of
/// Notes on first use. Runs on the main actor (NSAppleScript is not thread-safe).
enum AppleScriptBridge {
    @MainActor
    static func run(_ source: String) -> String? {
        var error: NSDictionary?
        guard let script = NSAppleScript(source: source) else { return nil }
        let result = script.executeAndReturnError(&error)
        if error != nil { return nil }
        return result.stringValue
    }
}

enum SystemImport {
    // MARK: Notes (call recordings)

    /// Lists Notes that contain an audio attachment (e.g. iOS call recordings
    /// synced into Notes).
    static func noteRecordings() async -> [NoteRecording] {
        let script = """
        tell application "Notes"
            set out to ""
            repeat with n in notes
                repeat with a in attachments of n
                    set anm to name of a
                    if anm ends with ".m4a" or anm ends with ".mp3" or anm ends with ".wav" or anm ends with ".caf" then
                        set out to out & (id of n) & tab & (name of n) & tab & anm & tab & ((creation date of n) as string) & linefeed
                    end if
                end repeat
            end repeat
            return out
        end tell
        """
        let raw = await AppleScriptBridge.run(script) ?? ""
        return raw.split(separator: "\n").compactMap { line in
            let parts = line.components(separatedBy: "\t")
            guard parts.count >= 3, !parts[0].isEmpty else { return nil }
            return NoteRecording(id: parts[0], title: parts[1], attachment: parts[2],
                                 date: parts.count > 3 ? parts[3] : "")
        }
    }

    /// Exports a note's first audio attachment to a temp file and returns its URL.
    /// Notes' `save` needs a full destination FILE path (a directory fails), so we
    /// build one from a sanitized name keeping the original extension.
    static func exportNoteAudio(noteId: String, fileName: String) async -> URL? {
        let dir = FileManager.default.temporaryDirectory
            .appendingPathComponent("rsm-note-\(UUID().uuidString)")
        try? FileManager.default.createDirectory(at: dir, withIntermediateDirectories: true)
        let ext = (fileName as NSString).pathExtension.isEmpty ? "m4a" : (fileName as NSString).pathExtension
        let dest = dir.appendingPathComponent("recording.\(ext)")
        let script = """
        tell application "Notes"
            set n to note id "\(noteId)"
            save attachment 1 of n in POSIX file "\(dest.path)"
        end tell
        """
        _ = await AppleScriptBridge.run(script)
        return FileManager.default.fileExists(atPath: dest.path) ? dest : nil
    }

    // MARK: Voice Memos (Dictaphone)

    /// Lists recordings from the macOS Voice Memos (Dictaphone) app. They live in
    /// the user's group container and are readable directly by this app.
    static func voiceMemos() -> [VoiceMemo] {
        let fm = FileManager.default
        let home = fm.homeDirectoryForCurrentUser
        let candidates = [
            home.appendingPathComponent("Library/Group Containers/group.com.apple.VoiceMemos.shared/Recordings"),
            home.appendingPathComponent("Library/Application Support/com.apple.voicememos/Recordings"),
        ]
        let exts: Set<String> = ["m4a", "wav", "mp3", "caf", "aac"]
        for dir in candidates {
            guard let items = try? fm.contentsOfDirectory(
                at: dir, includingPropertiesForKeys: [.contentModificationDateKey], options: [.skipsHiddenFiles]
            ) else { continue }
            let memos = items
                .filter { exts.contains($0.pathExtension.lowercased()) }
                .map { url -> VoiceMemo in
                    let date = (try? url.resourceValues(forKeys: [.contentModificationDateKey]).contentModificationDate) ?? .distantPast
                    return VoiceMemo(id: url.path, name: url.deletingPathExtension().lastPathComponent, url: url, date: date)
                }
                .sorted { $0.date > $1.date }
            if !memos.isEmpty { return memos }
        }
        return []
    }

    // MARK: Contacts

    static func contacts() async -> [MacContact] {
        await withCheckedContinuation { (cont: CheckedContinuation<[MacContact], Never>) in
            let store = CNContactStore()
            store.requestAccess(for: .contacts) { granted, _ in
                guard granted else { cont.resume(returning: []); return }
                let keys = [
                    CNContactGivenNameKey, CNContactFamilyNameKey,
                    CNContactOrganizationNameKey, CNContactEmailAddressesKey,
                    CNContactPhoneNumbersKey,
                ] as [CNKeyDescriptor]
                let request = CNContactFetchRequest(keysToFetch: keys)
                var out: [MacContact] = []
                do {
                    try store.enumerateContacts(with: request) { c, _ in
                        let name = [c.givenName, c.familyName].filter { !$0.isEmpty }.joined(separator: " ")
                        let org = c.organizationName.isEmpty ? nil : c.organizationName
                        let email = c.emailAddresses.first.map { $0.value as String }
                        let phone = c.phoneNumbers.first?.value.stringValue
                        let display = !name.isEmpty ? name : (org ?? email ?? "Contact")
                        out.append(MacContact(id: c.identifier, name: display, organization: org, email: email, phone: phone))
                    }
                } catch { /* ignore — return what we have */ }
                cont.resume(returning: out.sorted { $0.name.localizedCaseInsensitiveCompare($1.name) == .orderedAscending })
            }
        }
    }

    // MARK: Calendar

    static func events(days: Int = 14) async -> [MacEvent] {
        let store = EKEventStore()
        guard await requestCalendar(store) else { return [] }
        let start = Date()
        guard let end = Calendar.current.date(byAdding: .day, value: days, to: start) else { return [] }
        let pred = store.predicateForEvents(withStart: start, end: end, calendars: nil)
        return store.events(matching: pred)
            .map {
                MacEvent(id: $0.eventIdentifier ?? UUID().uuidString,
                         title: $0.title ?? "(sans titre)",
                         start: $0.startDate, end: $0.endDate,
                         calendar: $0.calendar.title)
            }
            .sorted { $0.start < $1.start }
    }

    // MARK: Reminders

    static func reminders() async -> [MacReminder] {
        let store = EKEventStore()
        guard await requestReminders(store) else { return [] }
        let pred = store.predicateForReminders(in: nil)
        let items: [EKReminder] = await withCheckedContinuation { cont in
            store.fetchReminders(matching: pred) { cont.resume(returning: $0 ?? []) }
        }
        return items
            .filter { !$0.isCompleted }
            .map { MacReminder(id: $0.calendarItemIdentifier, title: $0.title ?? "(sans titre)", due: $0.dueDateComponents?.date) }
            .sorted { ($0.due ?? .distantFuture) < ($1.due ?? .distantFuture) }
    }

    // MARK: Permissions

    private static func requestCalendar(_ store: EKEventStore) async -> Bool {
        if #available(macOS 14.0, *) {
            return (try? await store.requestFullAccessToEvents()) ?? false
        } else {
            return await withCheckedContinuation { cont in
                store.requestAccess(to: .event) { ok, _ in cont.resume(returning: ok) }
            }
        }
    }

    private static func requestReminders(_ store: EKEventStore) async -> Bool {
        if #available(macOS 14.0, *) {
            return (try? await store.requestFullAccessToReminders()) ?? false
        } else {
            return await withCheckedContinuation { cont in
                store.requestAccess(to: .reminder) { ok, _ in cont.resume(returning: ok) }
            }
        }
    }
}
