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
    /// Mutations the server rejected this run (kept in the queue for retry).
    public var failed = 0
    /// Mutations dropped after exhausting their retries (surfaced, not silent).
    public var dropped: [String] = []
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
            if !report.dropped.isEmpty {
                notify(.error("\(report.dropped.count) modification(s) non synchronisée(s)"))
            } else {
                notify(.idle)
            }
        } catch {
            notify(.error(error.localizedDescription))
        }
        return report
    }

    // MARK: - Push

    private func pushPending(report: inout SyncReport) async throws -> Int {
        var totalPushed = 0
        // Mutations that errored THIS run are skipped on re-fetch so the loop
        // can't spin forever on them; they stay queued for the next sync pass.
        var skipIds = Set<Int64>()

        while true {
            let pending = try store.pendingMutations(limit: 200)
            let batch = pending.filter { !skipIds.contains($0.id) }
            guard !batch.isEmpty else { break }

            let mutations: [[String: Any]] = batch.map { m in
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

            // The server returns results in the same order as the mutations sent,
            // so we pair positionally (robust even when two queued mutations share
            // a uuid — e.g. insert then update of the same row before a sync).
            for (i, m) in batch.enumerated() {
                guard i < outcomes.count else { skipIds.insert(m.id); continue }
                let outcome = outcomes[i]
                switch outcome.status {
                case "applied":
                    try store.removePending(ids: [m.id])
                    totalPushed += 1
                case "conflict", "not_found":
                    // Server wins: replace local cache with the server row, drop the mutation.
                    report.conflicts += 1
                    try store.applyServerWin(table: m.table, uuid: m.uuid,
                                             serverRow: outcome.serverRow, version: outcome.serverVersion)
                    try store.removePending(ids: [m.id])
                default: // "error" — KEEP the mutation, retry next pass (no silent loss)
                    report.failed += 1
                    let droppedPermanently = try store.markPendingError(id: m.id, message: outcome.message ?? "unknown")
                    if droppedPermanently {
                        report.dropped.append("\(m.table)/\(m.uuid): \(outcome.message ?? "unknown")")
                        NSLog("[Sync] DROPPED after max retries \(m.table)/\(m.uuid): \(outcome.message ?? "?")")
                    } else {
                        NSLog("[Sync] push error (will retry) \(m.table)/\(m.uuid): \(outcome.message ?? "?")")
                    }
                    skipIds.insert(m.id)
                }
            }
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
