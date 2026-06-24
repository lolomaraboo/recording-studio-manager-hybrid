import XCTest
@testable import RSMCore

final class LocalStoreTests: XCTestCase {
    private func makeStore() throws -> LocalStore {
        try LocalStore(path: NSTemporaryDirectory() + "/rsm-test-\(UUID().uuidString).sqlite")
    }

    func testLocalInsertCreatesRowAndPendingMutation() throws {
        let store = try makeStore()
        let uuid = try store.localInsert(table: "clients", payload: ["name": "Test", "type": "individual"])

        let row = try store.row(table: "clients", uuid: uuid)
        XCTAssertEqual(row?["name"] as? String, "Test")
        XCTAssertEqual(row?["sync_uuid"] as? String, uuid)

        let pending = try store.pendingMutations()
        XCTAssertEqual(pending.count, 1)
        XCTAssertEqual(pending[0].op, "insert")
        XCTAssertEqual(pending[0].uuid, uuid)
    }

    func testLocalUpdateMergesAndQueuesBaseVersion() throws {
        let store = try makeStore()
        let uuid = try store.localInsert(table: "clients", payload: ["name": "Avant"])
        try store.localUpdate(table: "clients", uuid: uuid, changes: ["name": "Après", "email": "a@b.c"])

        let row = try store.row(table: "clients", uuid: uuid)
        XCTAssertEqual(row?["name"] as? String, "Après")
        XCTAssertEqual(row?["email"] as? String, "a@b.c")

        let pending = try store.pendingMutations()
        XCTAssertEqual(pending.count, 2)
        XCTAssertEqual(pending[1].op, "update")
        XCTAssertEqual(pending[1].baseVersion, 1)
    }

    func testLocalDeleteRemovesRowAndQueuesTombstone() throws {
        let store = try makeStore()
        let uuid = try store.localInsert(table: "clients", payload: ["name": "Bye"])
        try store.localDelete(table: "clients", uuid: uuid)

        XCTAssertNil(try store.row(table: "clients", uuid: uuid))
        let pending = try store.pendingMutations()
        XCTAssertEqual(pending.last?.op, "delete")
    }

    func testMetaCursorRoundTrip() throws {
        let store = try makeStore()
        XCTAssertNil(try store.meta("cursor:x"))
        try store.setMeta("cursor:x", "42")
        XCTAssertEqual(try store.meta("cursor:x"), "42")
        try store.setMeta("cursor:x", "43")
        XCTAssertEqual(try store.meta("cursor:x"), "43")
    }

    func testClientsSortedByName() throws {
        let store = try makeStore()
        _ = try store.localInsert(table: "clients", payload: ["name": "Zoé"])
        _ = try store.localInsert(table: "clients", payload: ["name": "Anna"])
        let clients = store.clients()
        XCTAssertEqual(clients.map(\.name), ["Anna", "Zoé"])
    }
}
