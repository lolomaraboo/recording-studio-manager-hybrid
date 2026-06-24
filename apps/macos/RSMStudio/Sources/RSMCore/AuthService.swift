/**
 * AuthService — account login against the existing tRPC auth router (M2).
 *
 * POST /api/trpc/auth.login with {email, password}; express-session sets a
 * `connect.sid` cookie that URLSession stores automatically. The cookie is
 * persisted in the macOS Keychain so the session survives app relaunches.
 */
import Foundation

public struct LoginResult: Sendable {
    public let userId: Int
    public let userName: String
    public let userEmail: String
    public let organizationId: Int
    public let organizationName: String
}

public enum AuthError: Error, LocalizedError {
    case server(String)
    case invalidResponse

    public var errorDescription: String? {
        switch self {
        case .server(let message): return message
        case .invalidResponse: return "Réponse serveur invalide"
        }
    }
}

public enum AuthService {
    private static let cookieKeyPrefix = "session-cookie:"

    public static func login(baseURL: String, email: String, password: String) async throws -> LoginResult {
        guard let url = URL(string: "\(baseURL)/api/trpc/auth.login") else { throw APIError.invalidURL }
        var req = URLRequest(url: url)
        req.httpMethod = "POST"
        req.setValue("application/json", forHTTPHeaderField: "Content-Type")
        req.timeoutInterval = 15
        req.httpBody = try JSONSerialization.data(withJSONObject: ["email": email, "password": password])

        let (data, _) = try await URLSession.shared.data(for: req)
        guard let json = (try? JSONSerialization.jsonObject(with: data)) as? [String: Any] else {
            throw AuthError.invalidResponse
        }

        // tRPC error envelope
        if let error = json["error"] as? [String: Any] {
            let message = ((error["json"] as? [String: Any])?["message"] as? String)
                ?? (error["message"] as? String)
                ?? "Identifiants invalides"
            throw AuthError.server(message)
        }

        guard let result = json["result"] as? [String: Any],
              let payload = result["data"] as? [String: Any],
              let user = payload["user"] as? [String: Any],
              let org = payload["organization"] as? [String: Any],
              let userId = user["id"] as? Int,
              let orgId = org["id"] as? Int else {
            throw AuthError.invalidResponse
        }

        persistCookies(for: baseURL)

        return LoginResult(
            userId: userId,
            userName: (user["name"] as? String) ?? "",
            userEmail: (user["email"] as? String) ?? email,
            organizationId: orgId,
            organizationName: (org["name"] as? String) ?? ""
        )
    }

    public static func logout(baseURL: String) {
        if let url = URL(string: baseURL) {
            for cookie in HTTPCookieStorage.shared.cookies(for: url) ?? [] {
                HTTPCookieStorage.shared.deleteCookie(cookie)
            }
        }
        Keychain.delete(cookieKeyPrefix + baseURL)
    }

    // MARK: - Cookie persistence (Keychain)

    public static func persistCookies(for baseURL: String) {
        guard let url = URL(string: baseURL),
              let cookies = HTTPCookieStorage.shared.cookies(for: url), !cookies.isEmpty else { return }
        let payload: [[String: String]] = cookies.map { c in
            ["name": c.name, "value": c.value, "domain": c.domain, "path": c.path]
        }
        if let data = try? JSONSerialization.data(withJSONObject: payload),
           let text = String(data: data, encoding: .utf8) {
            Keychain.set(text, for: cookieKeyPrefix + baseURL)
        }
    }

    /// Restore the saved session cookie on app launch. Returns true when found.
    @discardableResult
    public static func restoreCookies(for baseURL: String) -> Bool {
        guard let text = Keychain.get(cookieKeyPrefix + baseURL),
              let data = text.data(using: .utf8),
              let payload = (try? JSONSerialization.jsonObject(with: data)) as? [[String: String]] else { return false }
        var restored = false
        for item in payload {
            guard let name = item["name"], let value = item["value"],
                  let domain = item["domain"], let path = item["path"] else { continue }
            if let cookie = HTTPCookie(properties: [
                .name: name, .value: value, .domain: domain, .path: path,
                .expires: Date().addingTimeInterval(7 * 24 * 3600),
            ]) {
                HTTPCookieStorage.shared.setCookie(cookie)
                restored = true
            }
        }
        return restored
    }

    /// Probe whether the stored session is still valid for the sync API.
    public static func sessionIsValid(config: ServerConfig) async -> Bool {
        guard config.isAccountMode, let url = URL(string: "\(config.baseURL)/api/sync/pull") else { return false }
        var req = URLRequest(url: url)
        req.httpMethod = "POST"
        req.setValue("application/json", forHTTPHeaderField: "Content-Type")
        req.timeoutInterval = 8
        req.httpBody = try? JSONSerialization.data(withJSONObject: ["cursor": -1, "tables": ["rooms"], "limit": 1])
        guard let (_, response) = try? await URLSession.shared.data(for: req) else { return false }
        return (response as? HTTPURLResponse)?.statusCode == 200
    }
}
