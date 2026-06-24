import XCTest
@testable import RSMCore

/**
 * End-to-end test of the Swift sync engine against a LIVE local server.
 *
 *   1. Start the server (./start.sh) with the sync upgrade applied
 *   2. RSM_SYNC_TEST=1 RSM_SYNC_ORG=25 swift test --filter SyncEngineIntegration
 *
 * Skipped unless RSM_SYNC_TEST=1.
 */
final class SyncEngineIntegrationTests: XCTestCase {
    private var config: ServerConfig {
        ServerConfig(
            baseURL: ProcessInfo.processInfo.environment["RSM_SYNC_URL"] ?? "http://localhost:3001",
            organizationId: Int(ProcessInfo.processInfo.environment["RSM_SYNC_ORG"] ?? "25") ?? 25,
            userId: 1
        )
    }

    private func skipUnlessEnabled() throws {
        try XCTSkipUnless(ProcessInfo.processInfo.environment["RSM_SYNC_TEST"] == "1", "RSM_SYNC_TEST not set")
    }

    /// Sync context on purpose: GRDB's synchronous `write` overload.
    private func forgeStaleVersion(store: LocalStore, uuid: String) throws {
        try store.dbQueue.write { db in
            try db.execute(sql: "UPDATE rsm_rows SET sync_version = 1 WHERE uuid = ?", arguments: [uuid])
        }
    }

    func testFullRoundTrip() async throws {
        try skipUnlessEnabled()

        let store = try LocalStore(path: NSTemporaryDirectory() + "/rsm-e2e-\(UUID().uuidString).sqlite")
        let api = APIClient(config: config)
        let engine = SyncEngine(store: store, api: api) { _, _ in }

        // 1. Local offline insert
        let name = "E2E Swift \(Int.random(in: 1000...9999))"
        let uuid = try store.localInsert(table: "clients", payload: ["name": name, "type": "individual"])
        XCTAssertEqual(try store.pendingCount(), 1)

        // 2. Sync: push must drain the queue
        let report1 = await engine.sync()
        XCTAssertEqual(report1.pushed, 1, "insert should be pushed")
        XCTAssertEqual(try store.pendingCount(), 0)

        // 3. A SECOND device must receive the row via pull
        let store2 = try LocalStore(path: NSTemporaryDirectory() + "/rsm-e2e2-\(UUID().uuidString).sqlite")
        let engine2 = SyncEngine(store: store2, api: api) { _, _ in }
        await engine2.sync()
        let received = try store2.row(table: "clients", uuid: uuid)
        XCTAssertEqual(received?["name"] as? String, name, "device 2 should see device 1's client")

        // 4. Update from device 2 → device 1 receives it
        try store2.localUpdate(table: "clients", uuid: uuid, changes: ["city": "Paris"])
        await engine2.sync()
        await engine.sync()
        XCTAssertEqual(try store.row(table: "clients", uuid: uuid)?["city"] as? String, "Paris")

        // 5. Conflict: stale local update is beaten by server state (server wins)
        try forgeStaleVersion(store: store, uuid: uuid)
        try store.localUpdate(table: "clients", uuid: uuid, changes: ["city": "Lyon"])
        let conflictReport = await engine.sync()
        XCTAssertEqual(conflictReport.conflicts, 1, "stale update must be detected as conflict")
        XCTAssertEqual(try store.row(table: "clients", uuid: uuid)?["city"] as? String, "Paris", "server version must win")

        // 6. Cleanup: delete from device 1, device 2 sees the tombstone
        try store.localDelete(table: "clients", uuid: uuid)
        await engine.sync()
        await engine2.sync()
        XCTAssertNil(try store2.row(table: "clients", uuid: uuid))
    }

    func testOfflineQueuePersists() async throws {
        try skipUnlessEnabled()

        // Unreachable server → mutations stay queued, phase = offline
        let store = try LocalStore(path: NSTemporaryDirectory() + "/rsm-off-\(UUID().uuidString).sqlite")
        let api = APIClient(config: ServerConfig(baseURL: "http://localhost:59999", organizationId: 1, userId: 1))

        var observedPhase: SyncPhase?
        let engine = SyncEngine(store: store, api: api) { phase, _ in
            if phase == .offline { observedPhase = phase }
        }

        _ = try store.localInsert(table: "clients", payload: ["name": "Offline Client"])
        await engine.sync()

        XCTAssertEqual(observedPhase, .offline)
        XCTAssertEqual(try store.pendingCount(), 1, "mutation must survive offline sync attempt")
    }
}
