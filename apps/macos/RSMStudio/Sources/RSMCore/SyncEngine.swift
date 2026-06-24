/**
 * SyncEngine — offline-first synchronization loop.
 *
 *   sync() = push local pending mutations → pull server delta from cursor
 *
 * Conflict policy (M1): server wins. On 'conflict' or 'not_found' the local
 * pending mutation is dropped and the server row (when provided) replaces the
 * local cache. Finer per-field merge can come later if needed.
 */
import Foundation

public enum SyncPhase: Sendable, Equatable {
    case idle
    case syncing
    case error(String)
    case offline
}

public struct SyncReport: Sendable {
    public var pushed = 0
    public var conflicts = 0
    public var pulled = 0
    public var cursor = 0
}

public actor SyncEngine {
    private let store: LocalStore
    private let api: APIClient
    private var timerTask: Task<Void, Never>?

    /// Called on the main actor after each state change (UI refresh hook).
    private let onChange: @Sendable (SyncPhase, Int) -> Void

    public init(store: LocalStore, api: APIClient, onChange: @escaping @Sendable (SyncPhase, Int) -> Void) {
        self.store = store
        self.api = api
        self.onChange = onChange
    }

    private func notify(_ phase: SyncPhase) {
        let pending = (try? store.pendingCount()) ?? 0
        onChange(phase, pending)
    }

    @discardableResult
    public func sync() async -> SyncReport {
        var report = SyncReport()
        notify(.syncing)

        guard await api.isReachable() else {
            notify(.offline)
            return report
        }

        do {
            report.pushed = try await pushPending(report: &report)
            try await pullAll(report: &report)
            notify(.idle)
        } catch {
            notify(.error(error.localizedDescription))
        }
        return report
    }

    // MARK: - Push

    private func pushPending(report: inout SyncReport) async throws -> Int {
        var totalPushed = 0
        while true {
            let pending = try store.pendingMutations(limit: 200)
            guard !pending.isEmpty else { break }

            let mutations: [[String: Any]] = pending.map { m in
                var dict: [String: Any] = ["table": m.table, "op": m.op, "uuid": m.uuid]
                if let payloadText = m.payload,
                   let data = payloadText.data(using: .utf8),
                   let json = (try? JSONSerialization.jsonObject(with: data)) as? [String: Any] {
                    dict["payload"] = json
                }
                if let base = m.baseVersion { dict["baseVersion"] = base }
                return dict
            }

            let outcomes = try await api.push(mutations: mutations)

            // Server wins on conflict: replace local cache with server row.
            for outcome in outcomes where outcome.status == "conflict" || outcome.status == "not_found" {
                report.conflicts += 1
                if let mutation = pending.first(where: { $0.uuid == outcome.uuid }) {
                    try store.applyServerWin(table: mutation.table, uuid: outcome.uuid, serverRow: outcome.serverRow, version: outcome.serverVersion)
                }
            }

            // All processed mutations leave the queue (applied, conflict-resolved, or errored —
            // errors are logged; retrying bad payloads forever would wedge the queue).
            for outcome in outcomes where outcome.status == "error" {
                NSLog("[Sync] push error for \(outcome.uuid): \(outcome.message ?? "?")")
            }
            try store.removePending(ids: pending.map(\.id))
            totalPushed += outcomes.filter { $0.status == "applied" }.count
        }
        return totalPushed
    }

    // MARK: - Pull

    private func pullAll(report: inout SyncReport) async throws {
        var cursor = Int(((try? store.meta(api.config.cursorKey)) ?? nil) ?? "0") ?? 0
        while true {
            let result = try await api.pull(cursor: cursor)
            try store.applyPulledChanges(result.changes)
            report.pulled += result.changes.count
            cursor = result.cursor
            try store.setMeta(api.config.cursorKey, String(cursor))
            if !result.hasMore { break }
        }
        report.cursor = cursor
    }

    // MARK: - Periodic sync

    public func startPeriodicSync(every seconds: TimeInterval = 60) {
        timerTask?.cancel()
        timerTask = Task { [weak self] in
            while !Task.isCancelled {
                try? await Task.sleep(nanoseconds: UInt64(seconds * 1_000_000_000))
                guard !Task.isCancelled else { break }
                await self?.sync()
            }
        }
    }

    public func stopPeriodicSync() {
        timerTask?.cancel()
        timerTask = nil
    }
}
