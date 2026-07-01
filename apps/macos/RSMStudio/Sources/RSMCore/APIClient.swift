/**
 * APIClient — talks to the RSM server sync API (/api/sync/pull, /api/sync/push).
 *
 * Auth (M1): development header mode (x-test-user-id / x-test-org-id), matching
 * the server's dev bypass. Session-cookie / token auth lands with the login
 * flow in a later milestone (Keychain storage is already in place).
 */
import Foundation

public struct ServerConfig: Codable, Equatable, Sendable {
    public var baseURL: String
    public var organizationId: Int
    public var userId: Int
    /// "account" = session-cookie auth (login flow); anything else = dev headers.
    public var authMode: String?
    public var userEmail: String?
    public var userName: String?
    public var organizationName: String?

    public init(baseURL: String = "http://localhost:3001", organizationId: Int = 25, userId: Int = 1,
                authMode: String? = nil, userEmail: String? = nil, userName: String? = nil, organizationName: String? = nil) {
        self.baseURL = baseURL
        self.organizationId = organizationId
        self.userId = userId
        self.authMode = authMode
        self.userEmail = userEmail
        self.userName = userName
        self.organizationName = organizationName
    }

    public var isAccountMode: Bool { authMode == "account" }

    /// Key namespacing the sync cursor per server + organization.
    public var cursorKey: String { "cursor:\(baseURL):\(organizationId)" }
}

public enum APIError: Error, LocalizedError {
    case invalidURL
    case http(Int, String)
    case decoding(String)

    public var errorDescription: String? {
        switch self {
        case .invalidURL: return "URL serveur invalide"
        case .http(let code, let body): return "Erreur serveur (\(code)): \(body)"
        case .decoding(let detail): return "Réponse illisible: \(detail)"
        }
    }
}

public struct PullChange: Sendable {
    public let table: String
    public let op: String            // "upsert" | "delete"
    public let uuid: String
    public let row: [String: Any]?   // present for upsert

    public var syncVersion: Int { (row?["sync_version"] as? Int) ?? 1 }
}

public struct PullResult: Sendable {
    public let changes: [PullChange]
    public let cursor: Int
    public let hasMore: Bool
}

public struct PushOutcome: Sendable {
    public let uuid: String
    public let status: String        // applied | conflict | not_found | error
    public let serverVersion: Int?
    public let serverRow: [String: Any]?
    public let message: String?
}

public struct APIClient: Sendable {
    public let config: ServerConfig

    public init(config: ServerConfig) {
        self.config = config
    }

    private func request(path: String, body: [String: Any]) async throws -> [String: Any] {
        guard let url = URL(string: "\(config.baseURL)/api/sync/\(path)") else { throw APIError.invalidURL }
        var req = URLRequest(url: url)
        req.httpMethod = "POST"
        req.setValue("application/json", forHTTPHeaderField: "Content-Type")
        if !config.isAccountMode {
            // Dev bypass headers; account mode relies on the session cookie
            req.setValue(String(config.userId), forHTTPHeaderField: "x-test-user-id")
            req.setValue(String(config.organizationId), forHTTPHeaderField: "x-test-org-id")
        }
        req.timeoutInterval = 30
        req.httpBody = try JSONSerialization.data(withJSONObject: body)

        let (data, response) = try await URLSession.shared.data(for: req)
        let status = (response as? HTTPURLResponse)?.statusCode ?? 0
        guard (200..<300).contains(status) else {
            throw APIError.http(status, String(data: data, encoding: .utf8) ?? "")
        }
        guard let json = (try? JSONSerialization.jsonObject(with: data)) as? [String: Any] else {
            throw APIError.decoding("expected JSON object")
        }
        return json
    }

    public func pull(cursor: Int, tables: [String]? = nil, limit: Int = 1000) async throws -> PullResult {
        var body: [String: Any] = ["cursor": cursor, "limit": limit]
        if let tables { body["tables"] = tables }
        let json = try await request(path: "pull", body: body)

        guard let rawChanges = json["changes"] as? [[String: Any]],
              let newCursor = json["cursor"] as? Int else {
            throw APIError.decoding("pull response missing changes/cursor")
        }
        let changes: [PullChange] = rawChanges.compactMap { c in
            guard let table = c["table"] as? String,
                  let op = c["op"] as? String,
                  let uuid = c["uuid"] as? String else { return nil }
            return PullChange(table: table, op: op, uuid: uuid, row: c["row"] as? [String: Any])
        }
        return PullResult(changes: changes, cursor: newCursor, hasMore: (json["hasMore"] as? Bool) ?? false)
    }

    public func push(mutations: [[String: Any]]) async throws -> [PushOutcome] {
        let json = try await request(path: "push", body: ["mutations": mutations])
        guard let results = json["results"] as? [[String: Any]] else {
            throw APIError.decoding("push response missing results")
        }
        return results.map { r in
            PushOutcome(
                uuid: (r["uuid"] as? String) ?? "",
                status: (r["status"] as? String) ?? "error",
                serverVersion: r["serverVersion"] as? Int,
                serverRow: r["serverRow"] as? [String: Any],
                message: r["message"] as? String
            )
        }
    }

    /// Authenticated GET on /api/sync/* (members, etc.)
    public func get(path: String) async throws -> [String: Any] {
        guard let url = URL(string: "\(config.baseURL)/api/sync/\(path)") else { throw APIError.invalidURL }
        var req = URLRequest(url: url)
        if !config.isAccountMode {
            req.setValue(String(config.userId), forHTTPHeaderField: "x-test-user-id")
            req.setValue(String(config.organizationId), forHTTPHeaderField: "x-test-org-id")
        }
        req.timeoutInterval = 15
        let (data, response) = try await URLSession.shared.data(for: req)
        let status = (response as? HTTPURLResponse)?.statusCode ?? 0
        guard (200..<300).contains(status) else {
            throw APIError.http(status, String(data: data, encoding: .utf8) ?? "")
        }
        guard let json = (try? JSONSerialization.jsonObject(with: data)) as? [String: Any] else {
            throw APIError.decoding("expected JSON object")
        }
        return json
    }

    /// Organization members (master DB) — for staff assignment.
    public func fetchMembers() async throws -> [[String: Any]] {
        let json = try await get(path: "members")
        return (json["members"] as? [[String: Any]]) ?? []
    }

    /// Online-only invoice creation: the SERVER allocates the invoice number.
    public func createInvoice(clientServerId: Int, items: [[String: Any]], taxRate: Double = 20,
                              projectServerId: Int? = nil) async throws -> String {
        var body: [String: Any] = ["clientId": clientServerId, "items": items, "taxRate": taxRate]
        if let projectServerId { body["projectId"] = projectServerId }
        let json = try await request(path: "create-invoice", body: body)
        guard let number = json["invoiceNumber"] as? String else { throw APIError.decoding("missing invoiceNumber") }
        return number
    }

    /// Online-only: generate a draft invoice from tracked time entries.
    /// The server groups by task type, skips non-billable types, refuses
    /// already-invoiced entries and marks the billed ones (invoice_id).
    public func invoiceFromTimeEntries(uuids: [String], clientServerId: Int,
                                       taxRate: Double = 20, notes: String? = nil) async throws
        -> (invoiceNumber: String, total: String, itemCount: Int) {
        var body: [String: Any] = [
            "timeEntryUuids": uuids, "clientId": clientServerId, "taxRate": taxRate,
        ]
        if let notes { body["notes"] = notes }
        let json = try await request(path: "invoice-from-time", body: body)
        guard let number = json["invoiceNumber"] as? String else {
            throw APIError.decoding("missing invoiceNumber")
        }
        return (number, (json["total"] as? String) ?? "", (json["itemCount"] as? Int) ?? 0)
    }

    /// Online-only quote creation: the SERVER allocates the quote number.
    public func createQuote(clientServerId: Int, items: [[String: Any]], taxRate: Double = 20, validityDays: Int = 30) async throws -> String {
        let json = try await request(path: "create-quote", body: [
            "clientId": clientServerId, "items": items, "taxRate": taxRate, "validityDays": validityDays,
        ])
        guard let number = json["quoteNumber"] as? String else { throw APIError.decoding("missing quoteNumber") }
        return number
    }

    /// AI chatbot — calls the existing tRPC ai.chat mutation.
    /// Returns (response text, sessionId for the conversation thread).
    public func aiChat(message: String, sessionId: String?) async throws -> (response: String, sessionId: String) {
        guard let url = URL(string: "\(config.baseURL)/api/trpc/ai.chat") else { throw APIError.invalidURL }
        var req = URLRequest(url: url)
        req.httpMethod = "POST"
        req.setValue("application/json", forHTTPHeaderField: "Content-Type")
        if !config.isAccountMode {
            req.setValue(String(config.userId), forHTTPHeaderField: "x-test-user-id")
            req.setValue(String(config.organizationId), forHTTPHeaderField: "x-test-org-id")
        }
        req.timeoutInterval = 120 // LLM + actions can be slow
        var body: [String: Any] = ["message": message]
        if let sessionId { body["sessionId"] = sessionId }
        req.httpBody = try JSONSerialization.data(withJSONObject: body)

        let (data, _) = try await URLSession.shared.data(for: req)
        guard let json = (try? JSONSerialization.jsonObject(with: data)) as? [String: Any] else {
            throw APIError.decoding("ai.chat: invalid JSON")
        }
        if let error = json["error"] as? [String: Any] {
            let message = ((error["json"] as? [String: Any])?["message"] as? String)
                ?? (error["message"] as? String) ?? "Erreur IA"
            throw APIError.http(500, message)
        }
        guard let result = json["result"] as? [String: Any],
              let payload = result["data"] as? [String: Any],
              let text = payload["response"] as? String,
              let session = payload["sessionId"] as? String else {
            throw APIError.decoding("ai.chat: unexpected payload")
        }
        return (text, session)
    }

    /// Uploads an audio file (multipart/form-data) to the server, which stores it
    /// (Cloudinary) and returns the hosted URL. `versionType` ∈
    /// {demo, roughMix, finalMix, master}. Endpoint: POST /api/upload/audio.
    public func uploadAudio(fileURL: URL, versionType: String, trackServerId: Int?) async throws -> String {
        guard let url = URL(string: "\(config.baseURL)/api/upload/audio") else { throw APIError.invalidURL }
        let boundary = "rsm-\(UUID().uuidString)"
        var req = URLRequest(url: url)
        req.httpMethod = "POST"
        req.setValue("multipart/form-data; boundary=\(boundary)", forHTTPHeaderField: "Content-Type")
        if !config.isAccountMode {
            req.setValue(String(config.userId), forHTTPHeaderField: "x-test-user-id")
            req.setValue(String(config.organizationId), forHTTPHeaderField: "x-test-org-id")
        }
        req.timeoutInterval = 300

        let fileData = try Data(contentsOf: fileURL)
        let filename = fileURL.lastPathComponent
        var body = Data()
        func field(_ name: String, _ value: String) {
            body.append("--\(boundary)\r\n".data(using: .utf8)!)
            body.append("Content-Disposition: form-data; name=\"\(name)\"\r\n\r\n".data(using: .utf8)!)
            body.append("\(value)\r\n".data(using: .utf8)!)
        }
        field("versionType", versionType)
        if let trackServerId { field("trackId", String(trackServerId)) }
        body.append("--\(boundary)\r\n".data(using: .utf8)!)
        body.append("Content-Disposition: form-data; name=\"file\"; filename=\"\(filename)\"\r\n".data(using: .utf8)!)
        body.append("Content-Type: \(Self.audioMime(for: fileURL))\r\n\r\n".data(using: .utf8)!)
        body.append(fileData)
        body.append("\r\n".data(using: .utf8)!)
        body.append("--\(boundary)--\r\n".data(using: .utf8)!)
        req.httpBody = body

        let (data, response) = try await URLSession.shared.data(for: req)
        let status = (response as? HTTPURLResponse)?.statusCode ?? 0
        guard (200..<300).contains(status) else {
            throw APIError.http(status, String(data: data, encoding: .utf8) ?? "")
        }
        guard let json = (try? JSONSerialization.jsonObject(with: data)) as? [String: Any],
              let payload = json["data"] as? [String: Any],
              let secure = (payload["secureUrl"] as? String) ?? (payload["url"] as? String) else {
            throw APIError.decoding("upload: réponse sans data.secureUrl")
        }
        return secure
    }

    private static func audioMime(for url: URL) -> String {
        switch url.pathExtension.lowercased() {
        case "mp3": return "audio/mpeg"
        case "wav", "wave": return "audio/wav"
        case "flac": return "audio/flac"
        case "aac", "m4a", "mp4": return "audio/aac"
        case "ogg", "oga": return "audio/ogg"
        case "webm": return "audio/webm"
        default: return "audio/mpeg"
        }
    }

    /// Health probe — true when the server answers.
    public func isReachable() async -> Bool {
        guard let url = URL(string: "\(config.baseURL)/api/health") else { return false }
        var req = URLRequest(url: url)
        req.timeoutInterval = 5
        guard let (_, response) = try? await URLSession.shared.data(for: req) else { return false }
        return (response as? HTTPURLResponse)?.statusCode == 200
    }
}
