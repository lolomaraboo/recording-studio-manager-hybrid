import SwiftUI
import RSMCore

/// M3 — sessions grouped by day, with creation (client, room, booking type,
/// times) and cancellation. Offline-first like everything else.
/// Limitation (documented): a session can only reference clients/rooms that
/// already have a server id (serial FK) — i.e. synced at least once.
/// Single sheet destination — stacking multiple `.sheet` modifiers on one view
/// is unreliable on macOS (only one wins, dismiss gets swallowed). One enum =
/// one `.sheet`.
enum SessionSheet: Identifiable {
    case create
    case staff(StudioSession)
    case detail(StudioSession)

    var id: String {
        switch self {
        case .create: return "create"
        case .staff(let s): return "staff-\(s.id)"
        case .detail(let s): return "detail-\(s.id)"
        }
    }
}

struct SessionsView: View {
    @Environment(AppModel.self) private var model
    @State private var sheet: SessionSheet?

    private var sessions: [StudioSession] {
        _ = model.dataVersion
        return model.store.studioSessions()
    }

    private var groupedByDay: [(day: String, items: [StudioSession])] {
        let calendar = Calendar.current
        let formatter = DateFormatter()
        formatter.locale = Locale(identifier: "fr_FR")
        formatter.dateFormat = "EEEE d MMMM yyyy"

        var groups: [Date: [StudioSession]] = [:]
        var undated: [StudioSession] = []
        for session in sessions {
            if let start = session.startTime {
                let day = calendar.startOfDay(for: start)
                groups[day, default: []].append(session)
            } else {
                undated.append(session)
            }
        }
        var result = groups.keys.sorted(by: >).map { day in
            (day: formatter.string(from: day).capitalized,
             items: groups[day]!.sorted { ($0.startTime ?? .distantPast) < ($1.startTime ?? .distantPast) })
        }
        if !undated.isEmpty { result.append((day: "Sans date", items: undated)) }
        return result
    }

    var body: some View {
        Group {
            if sessions.isEmpty {
                ContentUnavailableView(
                    "Aucune session",
                    systemImage: "calendar.badge.exclamationmark",
                    description: Text("Crée une session avec le bouton +.")
                )
            } else {
                List {
                    ForEach(groupedByDay, id: \.day) { group in
                        Section(group.day) {
                            ForEach(group.items) { session in
                                SessionRow(session: session)
                                    .contentShape(Rectangle())
                                    .onTapGesture { sheet = .detail(session) }
                                    .contextMenu {
                                        if session.int("id") != nil {
                                            Button("Staff…") { sheet = .staff(session) }
                                        }
                                        if session.status != "cancelled" {
                                            Button("Annuler la session") {
                                                try? model.store.localUpdate(table: "sessions", uuid: session.id, changes: ["status": "cancelled"])
                                                Task { await model.syncNow() }
                                            }
                                        }
                                        Button("Supprimer", role: .destructive) {
                                            try? model.store.localDelete(table: "sessions", uuid: session.id)
                                            Task { await model.syncNow() }
                                        }
                                    }
                            }
                        }
                    }
                }
            }
        }
        .navigationTitle("Sessions")
        .toolbar {
            ToolbarItem {
                Button { sheet = .create } label: {
                    Label("Nouvelle session", systemImage: "calendar.badge.plus")
                }
            }
        }
        .modalCard(item: $sheet) { which in
            switch which {
            case .create:
                SessionCreateSheet { payload in
                    _ = try? model.store.localInsert(table: "sessions", payload: payload)
                    Task { await model.syncNow() }
                }
            case .staff(let session):
                SessionStaffSheet(session: session, onClose: { sheet = nil })
            case .detail(let session):
                SessionDetailSheet(session: session, onAssignStaff: {
                    sheet = .staff(session)
                }, onClose: { sheet = nil })
            }
        }
    }
}

// MARK: - Session detail: the session's graph (client, project, room, staff, gear)

struct SessionDetailSheet: View {
    @Environment(AppModel.self) private var model
    let session: StudioSession
    let onAssignStaff: () -> Void
    /// Explicit close — `@Environment(\.dismiss)` is unreliable for sheets
    /// nested in a NavigationSplitView detail column + inspector. The parent
    /// owns the `sheet` state and clears it here.
    let onClose: () -> Void

    private var members: [Member] { model.store.cachedMembers() }

    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            HStack {
                VStack(alignment: .leading, spacing: 2) {
                    Text(session.title).font(.title3).bold()
                    if let start = session.startTime, let end = session.endTime {
                        Text("\(start.formatted(date: .complete, time: .shortened)) → \(end.formatted(date: .omitted, time: .shortened))")
                            .font(.caption).foregroundStyle(.secondary)
                    }
                }
                Spacer()
            }
            .padding()

            ScrollView {
                VStack(alignment: .leading, spacing: 12) {
                    GroupBox("Liens") {
                        VStack(alignment: .leading, spacing: 8) {
                            if let client = session.clientId.flatMap({ model.store.clientsByServerId()[$0] }) {
                                EntityLink(icon: "person.crop.circle", label: "Client : \(client.displayName)") {
                                    onClose()
                                    model.open(.clients, entity: client.id)
                                }
                            }
                            if let projectId = session.int("project_id"),
                               let project = model.store.projects().first(where: { $0.serverId == projectId }) {
                                EntityLink(icon: "music.note.list", label: "Projet : \(project.name)") {
                                    onClose()
                                    model.open(.projects, entity: project.id)
                                }
                            }
                            if let room = session.roomId.flatMap({ model.store.roomsByServerId()[$0] }) {
                                EntityLink(icon: "door.left.hand.open", label: "Salle : \(room.name) (voir le calendrier)") {
                                    onClose()
                                    model.open(.calendar)
                                }
                            }
                        }
                        .frame(maxWidth: .infinity, alignment: .leading)
                    }

                    if let serverId = session.int("id") {
                        let staff = model.store.sessionStaff(sessionServerId: serverId)
                        GroupBox("Staff (\(staff.count))") {
                            VStack(alignment: .leading, spacing: 6) {
                                ForEach(staff) { entry in
                                    HStack {
                                        Image(systemName: "person.fill").foregroundStyle(.tint)
                                        Text(members.first { $0.id == entry.userId }?.name ?? "Utilisateur \(entry.userId.map(String.init) ?? "?")")
                                        Text(entry.role).font(.caption).foregroundStyle(.secondary)
                                        Spacer()
                                    }
                                }
                                Button("Gérer le staff…") { onAssignStaff() }
                                    .buttonStyle(.borderless).font(.caption)
                            }
                            .frame(maxWidth: .infinity, alignment: .leading)
                        }

                        RelatedSection("Matériel réservé", items: model.store.equipment(sessionServerId: serverId)) { item in
                            RelatedRowContent(icon: "hifispeaker", title: item.name,
                                              subtitle: [item.brand, item.model].compactMap { $0 }.joined(separator: " "))
                        } onTap: { _ in
                            onClose()
                            model.open(.equipment)
                        }
                    }

                    if let notes = session.string("notes"), !notes.isEmpty {
                        GroupBox("Notes") {
                            Text(notes).frame(maxWidth: .infinity, alignment: .leading)
                        }
                    }
                }
                .padding(.horizontal)
            }

            HStack {
                Spacer()
                Button("Fermer") { onClose() }.keyboardShortcut(.escape)
            }
            .padding()
        }
        .frame(width: 460, height: 480)
    }
}

// MARK: - Staff assignment (P3 — GAP-1)

struct SessionStaffSheet: View {
    @Environment(AppModel.self) private var model
    let session: StudioSession
    let onClose: () -> Void

    @State private var selectedMemberId: Int?
    @State private var role = "engineer"

    private var members: [Member] { model.store.cachedMembers() }
    private var assigned: [SessionStaffEntry] {
        _ = model.dataVersion
        guard let serverId = session.int("id") else { return [] }
        return model.store.sessionStaff(sessionServerId: serverId)
    }

    private func memberName(_ userId: Int?) -> String {
        members.first(where: { $0.id == userId })?.name ?? "Utilisateur \(userId.map(String.init) ?? "?")"
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            Text("Staff — \(session.title)").font(.title3).bold().padding()
            Form {
                Section("Assignés") {
                    if assigned.isEmpty {
                        Text("Personne pour l'instant.").foregroundStyle(.secondary)
                    }
                    ForEach(assigned) { entry in
                        HStack {
                            Image(systemName: "person.fill").foregroundStyle(.tint)
                            Text(memberName(entry.userId))
                            Spacer()
                            Text(roleLabel(entry.role)).font(.caption).foregroundStyle(.secondary)
                            Button(role: .destructive) {
                                try? model.store.localDelete(table: "session_staff", uuid: entry.id)
                                Task { await model.syncNow() }
                            } label: { Image(systemName: "minus.circle") }
                            .buttonStyle(.plain)
                        }
                    }
                }
                Section("Ajouter") {
                    Picker("Membre", selection: $selectedMemberId) {
                        Text("Choisir…").tag(nil as Int?)
                        ForEach(members) { member in
                            Text(member.name).tag(member.id as Int?)
                        }
                    }
                    Picker("Rôle", selection: $role) {
                        Text("Ingé son").tag("engineer")
                        Text("Assistant").tag("assistant")
                        Text("Producteur").tag("producer")
                        Text("Autre").tag("other")
                    }
                    Button("Assigner") {
                        guard let userId = selectedMemberId, let sessionId = session.int("id") else { return }
                        _ = try? model.store.localInsert(table: "session_staff", payload: [
                            "session_id": sessionId, "user_id": userId, "role": role, "status": "assigned",
                        ])
                        selectedMemberId = nil
                        Task { await model.syncNow() }
                    }
                    .disabled(selectedMemberId == nil)
                }
            }
            .formStyle(.grouped)

            HStack {
                Spacer()
                Button("Fermer") { onClose() }.keyboardShortcut(.escape)
            }
            .padding()
        }
        .frame(width: 420, height: 420)
    }

    private func roleLabel(_ role: String) -> String {
        switch role {
        case "assistant": "Assistant"
        case "producer": "Producteur"
        case "other": "Autre"
        default: "Ingé son"
        }
    }
}

struct SessionRow: View {
    @Environment(AppModel.self) private var model
    let session: StudioSession

    var body: some View {
        let clientName = session.clientId.flatMap { model.store.clientsByServerId()[$0]?.name }
        let roomName = session.roomId.flatMap { model.store.roomsByServerId()[$0]?.name }

        HStack {
            statusBadge(session.status)
            VStack(alignment: .leading, spacing: 2) {
                Text(session.title).fontWeight(.medium)
                    .strikethrough(session.status == "cancelled")
                HStack(spacing: 6) {
                    if let start = session.startTime, let end = session.endTime {
                        Text("\(start.formatted(date: .omitted, time: .shortened)) – \(end.formatted(date: .omitted, time: .shortened))")
                    }
                    if let clientName { Text("· \(clientName)") }
                    if let roomName { Text("· \(roomName)") }
                }
                .font(.caption).foregroundStyle(.secondary)
            }
            Spacer()
            Text(bookingLabel(session.bookingType))
                .font(.caption2)
                .padding(.horizontal, 6).padding(.vertical, 2)
                .background(.quaternary, in: Capsule())
        }
        .padding(.vertical, 2)
    }

    private func statusBadge(_ status: String) -> some View {
        let (icon, color): (String, Color) = switch status {
        case "completed": ("checkmark.circle.fill", .green)
        case "in_progress": ("record.circle", .red)
        case "cancelled": ("xmark.circle", .secondary)
        case "conflict": ("exclamationmark.triangle.fill", .orange)
        default: ("clock", .blue)
        }
        return Image(systemName: icon).foregroundStyle(color)
    }

    private func bookingLabel(_ type: String) -> String {
        switch type {
        case "daily": "Journée"
        case "lockout": "Lockout"
        case "dry_hire": "Location sèche"
        default: "Horaire"
        }
    }
}

// MARK: - Create sheet

struct SessionCreateSheet: View {
    @Environment(AppModel.self) private var model
    let onCreate: ([String: Any]) -> Void

    @State private var title = ""
    @State private var clientServerId: Int?
    @State private var roomServerId: Int?
    @State private var kind = "studio"
    @State private var location = ""
    @State private var bookingType = "hourly"
    @State private var start = Calendar.current.date(bySettingHour: 14, minute: 0, second: 0, of: Date()) ?? Date()
    @State private var durationHours = 3.0
    @State private var notes = ""

    private var clients: [Client] { model.store.clients().filter { $0.serverId != nil } }
    private var rooms: [Room] { model.store.roomsList().filter { $0.serverId != nil } }

    private static let isoFormatter: ISO8601DateFormatter = {
        let f = ISO8601DateFormatter()
        f.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        return f
    }()

    var body: some View {
        StudioFormSheet(
            title: "Nouvelle session", confirmLabel: "Créer",
            confirmDisabled: title.trimmingCharacters(in: .whitespaces).isEmpty,
            height: 560,
            onConfirm: {
                let end: Date = bookingType == "hourly"
                    ? start.addingTimeInterval(durationHours * 3600)
                    : Calendar.current.date(bySettingHour: 23, minute: 59, second: 0, of: start) ?? start
                var payload: [String: Any] = [
                    "title": title,
                    "kind": kind,
                    "booking_type": bookingType,
                    "start_time": Self.isoFormatter.string(from: start),
                    "end_time": Self.isoFormatter.string(from: end),
                    "status": "scheduled",
                    "client_id": clientServerId.map { $0 as Any } ?? NSNull(),
                    "room_id": roomServerId.map { $0 as Any } ?? NSNull(),
                ]
                if !location.isEmpty { payload["location"] = location }
                if !notes.isEmpty { payload["notes"] = notes }
                onCreate(payload)
            }
        ) {
            TextField("Titre", text: $title, prompt: Text("Enregistrement voix — EP"))
            Picker("Type de session", selection: $kind) {
                Text("Studio").tag("studio")
                Text("Sur place / mobile").tag("location")
                Text("À distance").tag("remote")
                Text("Visite / RDV").tag("visit")
                Text("Mixage").tag("mixing")
                Text("Mastering").tag("mastering")
            }
            Picker("Client (optionnel)", selection: $clientServerId) {
                Text("Aucun").tag(nil as Int?)
                ForEach(clients) { client in
                    Text(client.displayName).tag(client.serverId)
                }
            }
            if kind == "studio" {
                Picker("Salle", selection: $roomServerId) {
                    Text("Aucune").tag(nil as Int?)
                    ForEach(rooms) { room in
                        Text(room.name).tag(room.serverId)
                    }
                }
            } else {
                TextField("Lieu", text: $location, prompt: Text("Adresse, ville, ou « à distance »"))
            }
            Picker("Tarification", selection: $bookingType) {
                Text("Horaire").tag("hourly")
                Text("Journée").tag("daily")
                Text("Lockout").tag("lockout")
                Text("Location sèche").tag("dry_hire")
            }
            DatePicker("Début", selection: $start)
            if bookingType == "hourly" {
                Stepper(value: $durationHours, in: 0.5...24, step: 0.5) {
                    Text("Durée : \(durationHours.formatted()) h")
                }
            }
            TextField("Notes", text: $notes, axis: .vertical).lineLimit(2...4)
        }
    }
}
