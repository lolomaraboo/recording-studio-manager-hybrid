/**
 * SyncEventsListener — realtime sync via SSE (GET /api/sync/events).
 *
 * The server LISTENs on pg_notify('rsm_sync') (emitted by the sync triggers
 * on EVERY tenant write, web or Mac) and forwards events here. On any event
 * we ask the engine to sync — the 60 s poll becomes a safety net only.
 * Auto-reconnects with backoff.
 */
import Foundation

public actor SyncEventsListener {
    private var task: Task<Void, Never>?
    private let config: ServerConfig
    private let onDirty: @Sendable () -> Void

    public init(config: ServerConfig, onDirty: @escaping @Sendable () -> Void) {
        self.config = config
        self.onDirty = onDirty
    }

    public func start() {
        guard task == nil else { return }
        let config = self.config
        let onDirty = self.onDirty
        task = Task {
            var backoff: UInt64 = 2
            while !Task.isCancelled {
                do {
                    guard let url = URL(string: "\(config.baseURL)/api/sync/events") else { return }
                    var req = URLRequest(url: url)
                    if !config.isAccountMode {
                        req.setValue(String(config.userId), forHTTPHeaderField: "x-test-user-id")
                        req.setValue(String(config.organizationId), forHTTPHeaderField: "x-test-org-id")
                    }
                    req.timeoutInterval = 3600

                    let (bytes, response) = try await URLSession.shared.bytes(for: req)
                    guard (response as? HTTPURLResponse)?.statusCode == 200 else {
                        throw APIError.http((response as? HTTPURLResponse)?.statusCode ?? 0, "events")
                    }
                    backoff = 2
                    NSLog("[SyncEvents] connected")

                    for try await line in bytes.lines {
                        guard !Task.isCancelled else { return }
                        if line.hasPrefix("data:") {
                            let payload = line.dropFirst(5).trimmingCharacters(in: .whitespaces)
                            if payload.contains("\"connected\"") { continue }
                            onDirty() // engine serializes; bursts are cheap no-ops
                        }
                    }
                } catch {
                    if Task.isCancelled { return }
                    NSLog("[SyncEvents] disconnected (\(error.localizedDescription)), retry in \(backoff)s")
                    try? await Task.sleep(nanoseconds: backoff * 1_000_000_000)
                    backoff = min(backoff * 2, 60)
                }
            }
        }
    }

    public func stop() {
        task?.cancel()
        task = nil
    }
}
