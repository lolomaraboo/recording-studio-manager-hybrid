/**
 * Typed read models over the generic JSON row cache (snake_case server keys).
 * Each entity wraps the raw dictionary; computed properties expose the fields
 * the UI needs. Writing goes through LocalStore.localInsert/Update/Delete with
 * snake_case payloads (the sync API contract).
 */
import Foundation

/// Robust parser for the date strings the sync API returns. PostgreSQL
/// timestamps come back in several shapes: ISO8601 with/without fractional
/// seconds, or "YYYY-MM-DD HH:MM:SS(.ffffff)" with a space instead of a T.
public enum RSMDate {
    private static let iso: ISO8601DateFormatter = {
        let f = ISO8601DateFormatter()
        f.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        return f
    }()
    private static let isoPlain = ISO8601DateFormatter()
    private static let pgFormats: [DateFormatter] = {
        ["yyyy-MM-dd HH:mm:ss.SSSSSS", "yyyy-MM-dd HH:mm:ss.SSS",
         "yyyy-MM-dd HH:mm:ss", "yyyy-MM-dd'T'HH:mm:ss"].map { fmt in
            let df = DateFormatter()
            df.locale = Locale(identifier: "en_US_POSIX")
            df.timeZone = TimeZone(identifier: "UTC")
            df.dateFormat = fmt
            return df
        }
    }()

    public static func parse(_ s: String?) -> Date? {
        guard let s, !s.isEmpty else { return nil }
        if let d = iso.date(from: s) ?? isoPlain.date(from: s) { return d }
        for df in pgFormats { if let d = df.date(from: s) { return d } }
        return nil
    }
}

public protocol RowBacked: Identifiable, Sendable {
    var raw: [String: Any] { get }
    init(raw: [String: Any])
}

public extension RowBacked {
    var id: String { (raw["sync_uuid"] as? String) ?? UUID().uuidString }
    func string(_ key: String) -> String? { raw[key] as? String }
    func int(_ key: String) -> Int? { raw[key] as? Int }
    func bool(_ key: String) -> Bool {
        if let b = raw[key] as? Bool { return b }
        if let i = raw[key] as? Int { return i != 0 }
        return false
    }
    func double(_ key: String) -> Double? {
        if let d = raw[key] as? Double { return d }
        if let i = raw[key] as? Int { return Double(i) }
        if let s = raw[key] as? String { return Double(s) }
        return nil
    }
    /// Reads a JSON array of strings whether the column is real JSON/JSONB
    /// (decoded to an array by the sync layer) or a TEXT column holding a
    /// stringified JSON array (legacy `musicians.instruments/genres`).
    func stringArray(_ key: String) -> [String] {
        if let arr = raw[key] as? [String] { return arr }
        if let arr = raw[key] as? [Any] { return arr.compactMap { $0 as? String } }
        if let s = raw[key] as? String, !s.isEmpty,
           let data = s.data(using: .utf8),
           let arr = (try? JSONSerialization.jsonObject(with: data)) as? [Any] {
            return arr.compactMap { $0 as? String }
        }
        return []
    }
}

// MARK: - Client

public struct Client: RowBacked {
    public let raw: [String: Any]
    public init(raw: [String: Any]) { self.raw = raw }

    public var name: String { string("name") ?? "Sans nom" }
    public var artistName: String? { string("artist_name") }
    public var email: String? { string("email") }
    public var phone: String? { string("phone") }
    public var type: String { string("type") ?? "individual" }
    public var city: String? { string("city") }
    public var country: String? { string("country") }
    public var notes: String? { string("notes") }
    public var isVip: Bool { bool("is_vip") }
    public var isActive: Bool { bool("is_active") }
    public var isCompany: Bool { type == "company" }

    // Artist profile
    public var biography: String? { string("biography") }
    public var genres: [String] { stringArray("genres") }
    public var instruments: [String] { stringArray("instruments") }
    public var avatarUrl: String? { string("avatar_url") }
    public var logoUrl: String? { string("logo_url") }
    public var imageUrl: String? { logoUrl ?? avatarUrl }

    // Streaming & web links (label, url) — only the ones that are filled
    public var streamingLinks: [(label: String, url: String)] {
        let defs: [(String, String)] = [
            ("Spotify", "spotify_url"), ("Apple Music", "apple_music_url"),
            ("YouTube", "youtube_url"), ("SoundCloud", "soundcloud_url"),
            ("Bandcamp", "bandcamp_url"), ("Deezer", "deezer_url"),
            ("Tidal", "tidal_url"), ("Amazon Music", "amazon_music_url"),
            ("Audiomack", "audiomack_url"), ("Beatport", "beatport_url"),
            ("Autres", "other_platforms_url"),
        ]
        return defs.compactMap { (label, key) in
            guard let u = string(key), !u.isEmpty else { return nil }
            return (label, u)
        }
    }

    // Music industry
    public var recordLabel: String? { string("record_label") }
    public var distributor: String? { string("distributor") }
    public var managerContact: String? { string("manager_contact") }
    public var publisher: String? { string("publisher") }
    public var performanceRightsSociety: String? { string("performance_rights_society") }
    public var yearsActive: String? { string("years_active") }
    public var notableWorks: String? { string("notable_works") }
    public var awardsRecognition: String? { string("awards_recognition") }

    // Extended contact / identity
    public var address: String? { string("address") }
    public var street: String? { string("street") }
    public var postalCode: String? { string("postal_code") }
    public var region: String? { string("region") }
    public var birthday: String? { string("birthday") }
    public var gender: String? { string("gender") }
    public var firstName: String? { string("first_name") }
    public var middleName: String? { string("middle_name") }
    public var lastName: String? { string("last_name") }
    public var prefix: String? { string("prefix") }
    public var suffix: String? { string("suffix") }

    // Commercial / portal
    public var defaultDepositPercent: Double? { double("default_deposit_percent") }
    public var portalAccess: Bool { bool("portal_access") }

    /// Custom fields (jsonb array of {label, type, value}). Exposed as simple
    /// (label, value) pairs for the macOS editor.
    public var customFields: [(label: String, value: String)] {
        let arr = (raw["custom_fields"] as? [Any]) ?? []
        return arr.compactMap { item in
            guard let d = item as? [String: Any] else { return nil }
            let label = (d["label"] as? String) ?? ""
            let value: String
            if let s = d["value"] as? String { value = s }
            else if let n = d["value"] as? Int { value = String(n) }
            else if let n = d["value"] as? Double { value = String(n) }
            else if let b = d["value"] as? Bool { value = b ? "Oui" : "Non" }
            else { value = "" }
            guard !label.isEmpty || !value.isEmpty else { return nil }
            return (label, value)
        }
    }

    public var displayName: String {
        if let artist = artistName, !artist.isEmpty { return "\(name) (\(artist))" }
        return name
    }
}

// MARK: - Room

public struct Room: RowBacked {
    public let raw: [String: Any]
    public init(raw: [String: Any]) { self.raw = raw }

    public var name: String { string("name") ?? "Salle" }
}

// MARK: - Session

public struct StudioSession: RowBacked {
    public let raw: [String: Any]
    public init(raw: [String: Any]) { self.raw = raw }

    public var title: String { string("title") ?? "Session" }
    public var status: String { string("status") ?? "scheduled" }
    public var bookingType: String { string("booking_type") ?? "hourly" }
    public var kind: String { string("kind") ?? "studio" }   // studio | location | remote | visit | mixing | mastering
    public var location: String? { string("location") }


    public var startTime: Date? { RSMDate.parse(string("start_time")) }
    public var endTime: Date? { RSMDate.parse(string("end_time")) }
}

public extension StudioSession {
    var serverId: Int? { int("id") }
    var clientId: Int? { int("client_id") }
    var roomId: Int? { int("room_id") }
    var seriesId: String? { string("series_id") }
}

public extension Room {
    var serverId: Int? { int("id") }
}

public extension Client {
    var serverId: Int? { int("id") }
}

// MARK: - Project / Track (M4)

public struct Project: RowBacked {
    public let raw: [String: Any]
    public init(raw: [String: Any]) { self.raw = raw }

    public var serverId: Int? { int("id") }
    public var name: String { string("name") ?? "Projet" }
    public var artistName: String? { string("artist_name") }
    public var type: String { string("type") ?? "album" }
    public var status: String { string("status") ?? "pre_production" }
    public var clientId: Int? { int("client_id") }
    public var includedRevisions: Int { int("included_revisions") ?? 2 }

    // Details
    public var description: String? { string("description") }
    public var genre: String? { string("genre") }
    public var notes: String? { string("notes") }
    public var technicalNotes: String? { string("technical_notes") }

    // Dates
    public var startDate: Date? { RSMDate.parse(string("start_date")) }
    public var targetDeliveryDate: Date? { RSMDate.parse(string("target_delivery_date")) }
    public var actualDeliveryDate: Date? { RSMDate.parse(string("actual_delivery_date")) }
    public var endDate: Date? { RSMDate.parse(string("end_date")) }

    // Money
    public var budget: String? { string("budget") }
    public var totalCost: String? { string("total_cost") }

    // Release / catalog
    public var label: String? { string("label") }
    public var catalogNumber: String? { string("catalog_number") }
    public var coverArtUrl: String? { string("cover_art_url") }
    public var spotifyUrl: String? { string("spotify_url") }
    public var appleMusicUrl: String? { string("apple_music_url") }

    // Storage
    public var storageLocation: String? { string("storage_location") }
    public var storageSize: Int? { int("storage_size") }
    public var trackCount: Int? { int("track_count") }
}

public struct Track: RowBacked {
    public let raw: [String: Any]
    public init(raw: [String: Any]) { self.raw = raw }

    public var title: String { string("title") ?? "Track" }
    public var status: String { string("status") ?? "recording" }
    public var trackNumber: Int? { int("track_number") }
    public var projectId: Int? { int("project_id") }
    public var bpm: Int? { int("bpm") }
    public var key: String? { string("key") }
}

// MARK: - Invoice (M4)

public struct Invoice: RowBacked {
    public let raw: [String: Any]
    public init(raw: [String: Any]) { self.raw = raw }

    public var serverId: Int? { int("id") }
    public var number: String { string("invoice_number") ?? "—" }
    public var status: String { string("status") ?? "draft" }
    public var clientId: Int? { int("client_id") }
    public var subtotal: String { string("subtotal") ?? "0" }
    public var taxAmount: String { string("tax_amount") ?? "0" }
    public var total: String { string("total") ?? "0" }
    public var issueDate: String? { string("issue_date") }
    public var dueDate: String? { string("due_date") }
    public var notes: String? { string("notes") }
}

public struct InvoiceItem: RowBacked {
    public let raw: [String: Any]
    public init(raw: [String: Any]) { self.raw = raw }

    public var invoiceId: Int? { int("invoice_id") }
    public var description: String { string("description") ?? "" }
    public var quantity: String { string("quantity") ?? "1" }
    public var unitPrice: String { string("unit_price") ?? "0" }
    public var amount: String { string("amount") ?? "0" }
}

// MARK: - Quote (Q2)

public struct Quote: RowBacked {
    public let raw: [String: Any]
    public init(raw: [String: Any]) { self.raw = raw }

    public var serverId: Int? { int("id") }
    public var number: String { string("quote_number") ?? "—" }
    public var status: String { string("status") ?? "draft" }
    public var clientId: Int? { int("client_id") }
    public var subtotal: String { string("subtotal") ?? "0" }
    public var taxAmount: String { string("tax_amount") ?? "0" }
    public var total: String { string("total") ?? "0" }
    public var validityDays: Int { int("validity_days") ?? 30 }
    public var notes: String? { string("notes") }
    public var convertedToProjectId: Int? { int("converted_to_project_id") }
}

public struct QuoteItem: RowBacked {
    public let raw: [String: Any]
    public init(raw: [String: Any]) { self.raw = raw }

    public var quoteId: Int? { int("quote_id") }
    public var description: String { string("description") ?? "" }
    public var quantity: String { string("quantity") ?? "1" }
    public var unitPrice: String { string("unit_price") ?? "0" }
    public var amount: String { string("amount") ?? "0" }
    public var displayOrder: Int { int("display_order") ?? 0 }
}

// MARK: - Equipment & Talent (Q2)

public struct EquipmentItem: RowBacked {
    public let raw: [String: Any]
    public init(raw: [String: Any]) { self.raw = raw }

    public var name: String { string("name") ?? "Matériel" }
    public var brand: String? { string("brand") }
    public var model: String? { string("model") }
    public var category: String? { string("category") }
    public var status: String { string("status") ?? "operational" }
    public var condition: String? { string("condition") }
    public var location: String? { string("location") }
    public var serialNumber: String? { string("serial_number") }
    public var isAvailable: Bool { bool("is_available") }
    public var notes: String? { string("notes") }
}

public struct Talent: RowBacked {
    public let raw: [String: Any]
    public init(raw: [String: Any]) { self.raw = raw }

    public var name: String { string("name") ?? "Talent" }
    public var stageName: String? { string("stage_name") }
    public var email: String? { string("email") }
    public var phone: String? { string("phone") }
    public var talentType: String { string("talent_type") ?? "musician" }
    public var primaryInstrument: String? { string("primary_instrument") }
    public var hourlyRate: String? { string("hourly_rate") }
    public var isActive: Bool { bool("is_active") }

    // Profile
    public var bio: String? { string("bio") }
    public var website: String? { string("website") }
    public var spotifyUrl: String? { string("spotify_url") }
    public var notes: String? { string("notes") }
    public var imageUrl: String? { string("image_url") ?? string("photo_url") }
    public var instruments: [String] { stringArray("instruments") }
    public var genres: [String] { stringArray("genres") }

    public var displayName: String {
        if let stage = stageName, !stage.isEmpty { return "\(name) (\(stage))" }
        return name
    }
}

// MARK: - Notifications (S1)

public struct NotificationItem: RowBacked {
    public let raw: [String: Any]
    public init(raw: [String: Any]) { self.raw = raw }

    public var title: String { string("title") ?? "Notification" }
    public var message: String? { string("message") }
    public var type: String { string("type") ?? "info" }
    public var priority: String { string("priority") ?? "normal" }
    public var isRead: Bool { bool("is_read") }
    public var createdAt: String? { string("created_at") }
    public var clientId: Int? { int("client_id") }
    public var projectId: Int? { int("project_id") }
    public var sessionId: Int? { int("session_id") }
    public var invoiceId: Int? { int("invoice_id") }
}

// MARK: - Remaining catalog entities (R3)

public struct Contract: RowBacked {
    public let raw: [String: Any]
    public init(raw: [String: Any]) { self.raw = raw }

    public var number: String { string("contract_number") ?? "—" }
    public var title: String { string("title") ?? "Contrat" }
    public var type: String { string("type") ?? "service" }
    public var status: String { string("status") ?? "draft" }
    public var clientId: Int? { int("client_id") }
    public var projectId: Int? { int("project_id") }
    public var value: String? { string("value") }
}

public struct ServiceItem: RowBacked {
    public let raw: [String: Any]
    public init(raw: [String: Any]) { self.raw = raw }

    public var name: String { string("name") ?? "Service" }
    public var category: String? { string("category") }
    public var unitPrice: String { string("unit_price") ?? "0" }
    public var isActive: Bool { bool("is_active") }
    public var displayOrder: Int { int("display_order") ?? 0 }
}

public struct Expense: RowBacked {
    public let raw: [String: Any]
    public init(raw: [String: Any]) { self.raw = raw }

    public var description: String { string("description") ?? "Dépense" }
    public var category: String? { string("category") }
    public var vendor: String? { string("vendor") }
    public var amount: String { string("amount") ?? "0" }
    public var status: String { string("status") ?? "pending" }
    public var projectId: Int? { int("project_id") }
    public var expenseDate: String? { string("expense_date") }
}

public struct TimeEntry: RowBacked {
    public let raw: [String: Any]
    public init(raw: [String: Any]) { self.raw = raw }

    public var taskTypeId: Int? { int("task_type_id") }
    public var sessionId: Int? { int("session_id") }
    public var projectId: Int? { int("project_id") }
    public var trackId: Int? { int("track_id") }
    public var durationMinutes: Int? { int("duration_minutes") }
    public var notes: String? { string("notes") }
    public var hourlyRateSnapshot: String? { string("hourly_rate_snapshot") }
    /// Server invoice id once this time has been billed (nil = not invoiced).
    public var invoiceId: Int? { int("invoice_id") }
    /// Clockify-style per-entry flag: only billable entries are invoiced.
    /// Missing key (old rows) = billable.
    public var billable: Bool { raw["billable"] == nil ? true : bool("billable") }

    private func date(_ key: String) -> Date? {
        RSMDate.parse(string(key))
    }
    public var startTime: Date? { date("start_time") }
    public var endTime: Date? { date("end_time") }

    /// Billable amount = duration × hourly rate.
    public var amount: Double {
        guard let minutes = durationMinutes, let rate = Double(hourlyRateSnapshot ?? "0") else { return 0 }
        return Double(minutes) / 60.0 * rate
    }
}

public struct TaskType: RowBacked {
    public let raw: [String: Any]
    public init(raw: [String: Any]) { self.raw = raw }

    public var serverId: Int? { int("id") }
    public var name: String { string("name") ?? "Tâche" }
    public var color: String? { string("color") }
    public var category: String { string("category") ?? "billable" }
    /// Hourly rate as a decimal string (e.g. "80.00"); used for time-entry snapshots.
    public var hourlyRate: String { string("hourly_rate") ?? "0.00" }
}

// MARK: - Track credits (cross-entity graph)

public struct TrackCredit: RowBacked {
    public let raw: [String: Any]
    public init(raw: [String: Any]) { self.raw = raw }

    public var trackId: Int? { int("track_id") }
    public var musicianId: Int? { int("musician_id") }
    public var role: String? { string("role") }
    public var creditName: String? { string("credit_name") }
}

/// Timestamped track comment (SoundCloud-style): `timestamp` is seconds into
/// the audio, anchoring the comment on the waveform.
public struct TrackCommentItem: RowBacked {
    public let raw: [String: Any]
    public init(raw: [String: Any]) { self.raw = raw }

    public var trackId: Int? { int("track_id") }
    public var content: String { string("content") ?? "" }
    public var authorName: String { string("author_name") ?? "?" }
    public var authorType: String { string("author_type") ?? "client" }
    public var versionType: String { string("version_type") ?? "finalMix" }
    public var status: String { string("status") ?? "open" }

    /// Seconds into the track (stored as decimal string or number).
    public var timestampSeconds: Double {
        if let d = raw["timestamp"] as? Double { return d }
        if let s = raw["timestamp"] as? String { return Double(s) ?? 0 }
        if let i = raw["timestamp"] as? Int { return Double(i) }
        return 0
    }
}

public struct SessionEquipmentEntry: RowBacked {
    public let raw: [String: Any]
    public init(raw: [String: Any]) { self.raw = raw }

    public var sessionId: Int? { int("session_id") }
    public var equipmentId: Int? { int("equipment_id") }
}

// MARK: - Staff & Members (P3)

public struct SessionStaffEntry: RowBacked {
    public let raw: [String: Any]
    public init(raw: [String: Any]) { self.raw = raw }

    public var sessionId: Int? { int("session_id") }
    public var userId: Int? { int("user_id") }
    public var role: String { string("role") ?? "engineer" }
    public var status: String { string("status") ?? "assigned" }
}

public struct Member: Identifiable, Sendable, Hashable {
    public let id: Int
    public let name: String
    public let email: String
    public let role: String

    public init?(raw: [String: Any]) {
        guard let id = raw["id"] as? Int else { return nil }
        self.id = id
        self.name = (raw["name"] as? String) ?? "?"
        self.email = (raw["email"] as? String) ?? ""
        self.role = (raw["role"] as? String) ?? "member"
    }
}

// MARK: - Track revisions (P3)

public struct TrackRevisionEntry: RowBacked {
    public let raw: [String: Any]
    public init(raw: [String: Any]) { self.raw = raw }

    public var trackId: Int? { int("track_id") }
    public var versionNumber: Int { int("version_number") ?? 1 }
    public var stage: String { string("stage") ?? "mix" }
    public var status: String { string("status") ?? "submitted" }
    public var clientFeedback: String? { string("client_feedback") }
}

// MARK: - Share

public struct Share: RowBacked {
    public let raw: [String: Any]
    public init(raw: [String: Any]) { self.raw = raw }

    public var token: String { string("share_token") ?? "" }
    public var projectId: Int? { int("project_id") }
    public var trackId: Int? { int("track_id") }
    public var recipientEmail: String? { string("recipient_email") }
    public var status: String { string("status") ?? "active" }
    public var accessCount: Int { int("access_count") ?? 0 }
}

// MARK: - Lead / Task / Document

public struct Lead: RowBacked {
    public let raw: [String: Any]
    public init(raw: [String: Any]) { self.raw = raw }
    public var name: String { string("name") ?? "Prospect" }
    public var email: String? { string("contact_email") }
    public var phone: String? { string("contact_phone") }
    public var source: String? { string("source") }
    public var status: String { string("status") ?? "new" }
    public var notes: String? { string("notes") }
    public var convertedClientId: Int? { int("converted_client_id") }
}

public struct TaskItem: RowBacked {
    public let raw: [String: Any]
    public init(raw: [String: Any]) { self.raw = raw }
    public var title: String { string("title") ?? "Tâche" }
    public var status: String { string("status") ?? "todo" }
    public var dueDate: Date? { RSMDate.parse(string("due_date")) }
    public var assignee: String? { string("assignee") }
    public var projectId: Int? { int("project_id") }
    public var sessionId: Int? { int("session_id") }
    public var clientId: Int? { int("client_id") }
    public var notes: String? { string("notes") }
}

public struct StudioDocument: RowBacked {
    public let raw: [String: Any]
    public init(raw: [String: Any]) { self.raw = raw }
    public var name: String { string("name") ?? "Document" }
    public var url: String { string("url") ?? "" }
    public var docType: String? { string("doc_type") }
    public var clientId: Int? { int("client_id") }
    public var projectId: Int? { int("project_id") }
    public var notes: String? { string("notes") }
}

public struct SessionTalentEntry: RowBacked {
    public let raw: [String: Any]
    public init(raw: [String: Any]) { self.raw = raw }
    public var sessionId: Int? { int("session_id") }
    public var musicianId: Int? { int("musician_id") }
    public var role: String? { string("role") }
    public var status: String { string("status") ?? "booked" }
}

public struct Availability: RowBacked {
    public let raw: [String: Any]
    public init(raw: [String: Any]) { self.raw = raw }
    public var subjectType: String { string("subject_type") ?? "staff" }  // staff | talent
    public var subjectId: Int? { int("subject_id") }
    public var start: Date? { RSMDate.parse(string("start_time")) }
    public var end: Date? { RSMDate.parse(string("end_time")) }
    public var kind: String { string("kind") ?? "unavailable" }  // unavailable | vacation
    public var notes: String? { string("notes") }
}

public struct ClientPackage: RowBacked {
    public let raw: [String: Any]
    public init(raw: [String: Any]) { self.raw = raw }
    public var name: String { string("name") ?? "Forfait" }
    public var clientId: Int? { int("client_id") }
    public var totalHours: Double? { double("total_hours") }
    public var usedHours: Double { double("used_hours") ?? 0 }
    public var price: String? { string("price") }
    public var status: String { string("status") ?? "active" }
    public var notes: String? { string("notes") }
    public var remaining: Double? { totalHours.map { $0 - usedHours } }
}

public struct CreditNote: RowBacked {
    public let raw: [String: Any]
    public init(raw: [String: Any]) { self.raw = raw }
    public var number: String { string("credit_note_number") ?? "—" }
    public var clientId: Int? { int("client_id") }
    public var amount: String { string("amount") ?? "0" }
    public var reason: String? { string("reason") }
    public var status: String { string("status") ?? "issued" }
}

public struct Coupon: RowBacked {
    public let raw: [String: Any]
    public init(raw: [String: Any]) { self.raw = raw }
    public var code: String { string("code") ?? "" }
    public var kind: String { string("kind") ?? "percent" }  // percent | amount | giftcard
    public var value: String { string("value") ?? "0" }
    public var isActive: Bool { bool("is_active") }
    public var notes: String? { string("notes") }
}

public struct Consumable: RowBacked {
    public let raw: [String: Any]
    public init(raw: [String: Any]) { self.raw = raw }
    public var name: String { string("name") ?? "Article" }
    public var quantity: Double { double("quantity") ?? 0 }
    public var unit: String? { string("unit") }
    public var threshold: Double? { double("threshold") }
    public var notes: String? { string("notes") }
    public var lowStock: Bool { threshold.map { quantity <= $0 } ?? false }
}

public struct Deliverable: RowBacked {
    public let raw: [String: Any]
    public init(raw: [String: Any]) { self.raw = raw }
    public var name: String { string("name") ?? "Livrable" }
    public var projectId: Int? { int("project_id") }
    public var url: String? { string("url") }
    public var status: String { string("status") ?? "draft" }
    public var notes: String? { string("notes") }
}

// MARK: - Repository helpers

public extension LocalStore {
    func leads() -> [Lead] {
        ((try? rows(table: "leads")) ?? []).map(Lead.init(raw:))
            .sorted { $0.name.localizedCaseInsensitiveCompare($1.name) == .orderedAscending }
    }
    func tasksList() -> [TaskItem] {
        ((try? rows(table: "tasks")) ?? []).map(TaskItem.init(raw:))
            .sorted { ($0.dueDate ?? .distantFuture) < ($1.dueDate ?? .distantFuture) }
    }
    func documents() -> [StudioDocument] {
        ((try? rows(table: "documents")) ?? []).map(StudioDocument.init(raw:))
            .sorted { $0.name.localizedCaseInsensitiveCompare($1.name) == .orderedAscending }
    }
    func sessionTalents(sessionServerId: Int) -> [SessionTalentEntry] {
        ((try? rows(table: "session_talents")) ?? []).map(SessionTalentEntry.init(raw:))
            .filter { $0.sessionId == sessionServerId }
    }
    func availabilityList() -> [Availability] {
        ((try? rows(table: "availability")) ?? []).map(Availability.init(raw:))
            .sorted { ($0.start ?? .distantFuture) < ($1.start ?? .distantFuture) }
    }
    func packages() -> [ClientPackage] {
        ((try? rows(table: "client_packages")) ?? []).map(ClientPackage.init(raw:))
            .sorted { $0.name.localizedCaseInsensitiveCompare($1.name) == .orderedAscending }
    }
    func creditNotes() -> [CreditNote] {
        ((try? rows(table: "credit_notes")) ?? []).map(CreditNote.init(raw:))
            .sorted { $0.number > $1.number }
    }
    func coupons() -> [Coupon] {
        ((try? rows(table: "coupons")) ?? []).map(Coupon.init(raw:))
            .sorted { $0.code.localizedCaseInsensitiveCompare($1.code) == .orderedAscending }
    }
    func consumables() -> [Consumable] {
        ((try? rows(table: "consumables")) ?? []).map(Consumable.init(raw:))
            .sorted { $0.name.localizedCaseInsensitiveCompare($1.name) == .orderedAscending }
    }
    func deliverables() -> [Deliverable] {
        ((try? rows(table: "deliverables")) ?? []).map(Deliverable.init(raw:))
            .sorted { $0.name.localizedCaseInsensitiveCompare($1.name) == .orderedAscending }
    }
    func shares(trackServerId: Int) -> [Share] {
        ((try? rows(table: "shares")) ?? []).map(Share.init(raw:))
            .filter { $0.trackId == trackServerId }
    }
    func shares(projectServerId: Int) -> [Share] {
        ((try? rows(table: "shares")) ?? []).map(Share.init(raw:))
            .filter { $0.projectId == projectServerId && $0.trackId == nil }
    }

    func clients() -> [Client] {
        ((try? rows(table: "clients")) ?? []).map(Client.init(raw:))
            .sorted { $0.name.localizedCaseInsensitiveCompare($1.name) == .orderedAscending }
    }

    func studioSessions() -> [StudioSession] {
        ((try? rows(table: "sessions")) ?? []).map(StudioSession.init(raw:))
            .sorted { ($0.startTime ?? .distantPast) > ($1.startTime ?? .distantPast) }
    }

    func roomsList() -> [Room] {
        ((try? rows(table: "rooms")) ?? []).map(Room.init(raw:))
    }

    func projects() -> [Project] {
        ((try? rows(table: "projects")) ?? []).map(Project.init(raw:))
            .sorted { $0.name.localizedCaseInsensitiveCompare($1.name) == .orderedAscending }
    }

    func tracks(projectServerId: Int) -> [Track] {
        ((try? rows(table: "tracks")) ?? []).map(Track.init(raw:))
            .filter { $0.projectId == projectServerId }
            .sorted { ($0.trackNumber ?? 999) < ($1.trackNumber ?? 999) }
    }

    func invoices() -> [Invoice] {
        ((try? rows(table: "invoices")) ?? []).map(Invoice.init(raw:))
            .sorted { $0.number > $1.number }
    }

    func invoiceItems(invoiceServerId: Int) -> [InvoiceItem] {
        ((try? rows(table: "invoice_items")) ?? []).map(InvoiceItem.init(raw:))
            .filter { $0.invoiceId == invoiceServerId }
    }

    func quotes() -> [Quote] {
        ((try? rows(table: "quotes")) ?? []).map(Quote.init(raw:))
            .sorted { $0.number > $1.number }
    }

    func quoteItems(quoteServerId: Int) -> [QuoteItem] {
        ((try? rows(table: "quote_items")) ?? []).map(QuoteItem.init(raw:))
            .filter { $0.quoteId == quoteServerId }
            .sorted { $0.displayOrder < $1.displayOrder }
    }

    func equipmentList() -> [EquipmentItem] {
        ((try? rows(table: "equipment")) ?? []).map(EquipmentItem.init(raw:))
            .sorted { $0.name.localizedCaseInsensitiveCompare($1.name) == .orderedAscending }
    }

    func talents() -> [Talent] {
        ((try? rows(table: "musicians")) ?? []).map(Talent.init(raw:))
            .sorted { $0.name.localizedCaseInsensitiveCompare($1.name) == .orderedAscending }
    }

    func sessionStaff(sessionServerId: Int) -> [SessionStaffEntry] {
        ((try? rows(table: "session_staff")) ?? []).map(SessionStaffEntry.init(raw:))
            .filter { $0.sessionId == sessionServerId }
    }

    func trackRevisions(trackServerId: Int) -> [TrackRevisionEntry] {
        ((try? rows(table: "track_revisions")) ?? []).map(TrackRevisionEntry.init(raw:))
            .filter { $0.trackId == trackServerId }
            .sorted { ($0.stage, $0.versionNumber) > ($1.stage, $1.versionNumber) }
    }

    /// Organization members cached from GET /api/sync/members (master DB).
    func cachedMembers() -> [Member] {
        guard let text = (try? meta("org_members")) ?? nil, let data = text.data(using: .utf8),
              let list = (try? JSONSerialization.jsonObject(with: data)) as? [[String: Any]] else { return [] }
        return list.compactMap(Member.init(raw:))
    }

    func cacheMembers(_ raw: [[String: Any]]) {
        if let data = try? JSONSerialization.data(withJSONObject: raw),
           let text = String(data: data, encoding: .utf8) {
            try? setMeta("org_members", text)
        }
    }

    func notifications() -> [NotificationItem] {
        ((try? rows(table: "notifications")) ?? []).map(NotificationItem.init(raw:))
            .sorted { ($0.createdAt ?? "") > ($1.createdAt ?? "") }
    }

    func allTracks() -> [Track] {
        ((try? rows(table: "tracks")) ?? []).map(Track.init(raw:))
            .sorted { $0.title.localizedCaseInsensitiveCompare($1.title) == .orderedAscending }
    }

    func contracts() -> [Contract] {
        ((try? rows(table: "contracts")) ?? []).map(Contract.init(raw:))
            .sorted { $0.number > $1.number }
    }

    func services() -> [ServiceItem] {
        ((try? rows(table: "service_catalog")) ?? []).map(ServiceItem.init(raw:))
            .sorted { $0.displayOrder < $1.displayOrder }
    }

    func expenses() -> [Expense] {
        ((try? rows(table: "expenses")) ?? []).map(Expense.init(raw:))
            .sorted { ($0.expenseDate ?? "") > ($1.expenseDate ?? "") }
    }

    func timeEntries() -> [TimeEntry] {
        ((try? rows(table: "time_entries")) ?? []).map(TimeEntry.init(raw:))
    }

    func taskTypes() -> [TaskType] {
        ((try? rows(table: "task_types")) ?? []).map(TaskType.init(raw:))
    }

    func trackComments(trackServerId: Int) -> [TrackCommentItem] {
        ((try? rows(table: "track_comments")) ?? []).map(TrackCommentItem.init(raw:))
            .filter { $0.trackId == trackServerId }
            .sorted { $0.timestampSeconds < $1.timestampSeconds }
    }

    func credits(trackServerId: Int) -> [(talent: Talent, role: String?)] {
        let talentsById = Dictionary(uniqueKeysWithValues: talents().compactMap { talent in
            talent.int("id").map { ($0, talent) }
        })
        return trackCredits()
            .filter { $0.trackId == trackServerId }
            .compactMap { credit in
                guard let musicianId = credit.musicianId, let talent = talentsById[musicianId] else { return nil }
                return (talent, credit.role)
            }
    }

    func expenses(projectServerId: Int) -> [Expense] {
        expenses().filter { $0.projectId == projectServerId }
    }

    func contracts(clientServerId: Int) -> [Contract] {
        contracts().filter { $0.clientId == clientServerId }
    }

    // MARK: Cross-entity relations (the studio graph)

    func projects(clientServerId: Int) -> [Project] {
        projects().filter { $0.clientId == clientServerId }
    }

    func sessions(clientServerId: Int) -> [StudioSession] {
        studioSessions().filter { $0.clientId == clientServerId }
    }

    func sessions(projectServerId: Int) -> [StudioSession] {
        studioSessions().filter { $0.int("project_id") == projectServerId }
    }

    func sessions(roomServerId: Int) -> [StudioSession] {
        studioSessions().filter { $0.roomId == roomServerId }
    }

    func invoices(clientServerId: Int) -> [Invoice] {
        invoices().filter { $0.clientId == clientServerId }
    }

    func quotes(clientServerId: Int) -> [Quote] {
        quotes().filter { $0.clientId == clientServerId }
    }

    func quotes(projectServerId: Int) -> [Quote] {
        quotes().filter { $0.convertedToProjectId == projectServerId }
    }

    func trackCredits() -> [TrackCredit] {
        ((try? rows(table: "track_credits")) ?? []).map(TrackCredit.init(raw:))
    }

    /// Talents credited on any track of the project.
    func talents(projectServerId: Int) -> [(talent: Talent, role: String?)] {
        let trackIds = Set(tracks(projectServerId: projectServerId).compactMap { $0.int("id") })
        guard !trackIds.isEmpty else { return [] }
        let credits = trackCredits().filter { credit in
            guard let trackId = credit.trackId else { return false }
            return trackIds.contains(trackId)
        }
        let talentsById = Dictionary(uniqueKeysWithValues: talents().compactMap { talent in
            talent.int("id").map { ($0, talent) }
        })
        var seen = Set<Int>()
        var result: [(Talent, String?)] = []
        for credit in credits {
            guard let musicianId = credit.musicianId, !seen.contains(musicianId),
                  let talent = talentsById[musicianId] else { continue }
            seen.insert(musicianId)
            result.append((talent, credit.role))
        }
        return result
    }

    /// Projects a talent is credited on (via track credits).
    func projects(talentServerId: Int) -> [Project] {
        let trackIds = Set(trackCredits().filter { $0.musicianId == talentServerId }.compactMap(\.trackId))
        guard !trackIds.isEmpty else { return [] }
        let allTracks = ((try? rows(table: "tracks")) ?? []).map(Track.init(raw:))
        let projectIds = Set(allTracks.filter { track in
            track.int("id").map { trackIds.contains($0) } ?? false
        }.compactMap(\.projectId))
        return projects().filter { project in
            project.serverId.map { projectIds.contains($0) } ?? false
        }
    }

    func sessionEquipmentEntries() -> [SessionEquipmentEntry] {
        ((try? rows(table: "session_equipment")) ?? []).map(SessionEquipmentEntry.init(raw:))
    }

    /// Equipment booked on a session (dry hire / reservations).
    func equipment(sessionServerId: Int) -> [EquipmentItem] {
        let ids = Set(sessionEquipmentEntries().filter { $0.sessionId == sessionServerId }.compactMap(\.equipmentId))
        return equipmentList().filter { item in item.int("id").map { ids.contains($0) } ?? false }
    }

    /// Sessions where a given equipment item is booked.
    func sessions(equipmentServerId: Int) -> [StudioSession] {
        let ids = Set(sessionEquipmentEntries().filter { $0.equipmentId == equipmentServerId }.compactMap(\.sessionId))
        return studioSessions().filter { session in session.int("id").map { ids.contains($0) } ?? false }
    }

    /// Lookup maps by server serial id (rows synced from the server carry "id").
    func clientsByServerId() -> [Int: Client] {
        var map: [Int: Client] = [:]
        for client in clients() { if let id = client.serverId { map[id] = client } }
        return map
    }

    func roomsByServerId() -> [Int: Room] {
        var map: [Int: Room] = [:]
        for room in roomsList() { if let id = room.serverId { map[id] = room } }
        return map
    }
}
