/**
 * LocalStore — SQLite (GRDB) offline-first cache.
 *
 * Design (M1): generic document storage. Every synced server row lives in
 * `rsm_rows` as raw JSON keyed by (table_name, uuid). Pending local writes
 * queue in `rsm_pending` until pushed. This mirrors the server contract
 * (snake_case JSON) exactly and survives server schema evolution; dedicated
 * typed tables/indexes can be introduced per-module in later milestones.
 */
import Foundation
import GRDB

public final class LocalStore: @unchecked Sendable {
    public let dbQueue: DatabaseQueue

    public init(path: String? = nil) throws {
        let resolvedPath: String
        if let path {
            resolvedPath = path
        } else {
            let support = FileManager.default.urls(for: .applicationSupportDirectory, in: .userDomainMask)[0]
                .appendingPathComponent("RSMStudio", isDirectory: true)
            try FileManager.default.createDirectory(at: support, withIntermediateDirectories: true)
            resolvedPath = support.appendingPathComponent("rsm.sqlite").path
        }
        dbQueue = try DatabaseQueue(path: resolvedPath)
        try migrate()
    }

    private func migrate() throws {
        var migrator = DatabaseMigrator()
        migrator.registerMigration("v1") { db in
            try db.create(table: "rsm_rows") { t in
                t.column("table_name", .text).notNull()
                t.column("uuid", .text).notNull()
                t.column("data", .text).notNull()          // raw server row JSON (snake_case)
                t.column("sync_version", .integer).notNull().defaults(to: 1)
                t.primaryKey(["table_name", "uuid"])
            }
            try db.create(table: "rsm_pending") { t in
                t.autoIncrementedPrimaryKey("id")
                t.column("table_name", .text).notNull()
                t.column("uuid", .text).notNull()
                t.column("op", .text).notNull()            // insert | update | delete
                t.column("payload", .text)                  // JSON, nil for delete
                t.column("base_version", .integer)
                t.column("created_at", .datetime).notNull().defaults(sql: "CURRENT_TIMESTAMP")
            }
            try db.create(table: "rsm_meta") { t in
                t.primaryKey("key", .text)
                t.column("value", .text).notNull()
            }
        }
        try migrator.migrate(dbQueue)
    }

    // MARK: - Meta (sync cursor, etc.)

    public func meta(_ key: String) throws -> String? {
        try dbQueue.read { db in
            try String.fetchOne(db, sql: "SELECT value FROM rsm_meta WHERE key = ?", arguments: [key])
        }
    }

    public func setMeta(_ key: String, _ value: String) throws {
        try dbQueue.write { db in
            try db.execute(sql: "INSERT INTO rsm_meta (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value", arguments: [key, value])
        }
    }

    // MARK: - Rows (server state cache)

    public func upsertRow(table: String, uuid: String, json: [String: Any], version: Int, db: Database) throws {
        let data = try JSONSerialization.data(withJSONObject: json)
        try db.execute(
            sql: """
            INSERT INTO rsm_rows (table_name, uuid, data, sync_version) VALUES (?, ?, ?, ?)
            ON CONFLICT(table_name, uuid) DO UPDATE SET data = excluded.data, sync_version = excluded.sync_version
            """,
            arguments: [table, uuid, String(data: data, encoding: .utf8)!, version]
        )
    }

    public func deleteRow(table: String, uuid: String, db: Database) throws {
        try db.execute(sql: "DELETE FROM rsm_rows WHERE table_name = ? AND uuid = ?", arguments: [table, uuid])
    }

    public func rows(table: String) throws -> [[String: Any]] {
        try dbQueue.read { db in
            let raw = try Row.fetchAll(db, sql: "SELECT data FROM rsm_rows WHERE table_name = ?", arguments: [table])
            return raw.compactMap { row in
                guard let text: String = row["data"], let data = text.data(using: .utf8) else { return nil }
                return (try? JSONSerialization.jsonObject(with: data)) as? [String: Any]
            }
        }
    }

    public func row(table: String, uuid: String) throws -> [String: Any]? {
        try dbQueue.read { db in
            guard let text = try String.fetchOne(db, sql: "SELECT data FROM rsm_rows WHERE table_name = ? AND uuid = ?", arguments: [table, uuid]),
                  let data = text.data(using: .utf8) else { return nil }
            return (try? JSONSerialization.jsonObject(with: data)) as? [String: Any]
        }
    }

    // MARK: - Local writes (offline-first: apply locally + enqueue for push)

    /// Insert a brand-new entity locally; returns its new uuid.
    public func localInsert(table: String, payload: [String: Any]) throws -> String {
        let uuid = UUID().uuidString.lowercased()
        var json = payload
        json["sync_uuid"] = uuid
        let payloadData = try JSONSerialization.data(withJSONObject: payload)
        try dbQueue.write { db in
            try upsertRow(table: table, uuid: uuid, json: json, version: 1, db: db)
            try db.execute(
                sql: "INSERT INTO rsm_pending (table_name, uuid, op, payload) VALUES (?, ?, 'insert', ?)",
                arguments: [table, uuid, String(data: payloadData, encoding: .utf8)!]
            )
        }
        return uuid
    }

    public func localUpdate(table: String, uuid: String, changes: [String: Any]) throws {
        try dbQueue.write { db in
            // Merge into cached row
            guard let text = try String.fetchOne(db, sql: "SELECT data FROM rsm_rows WHERE table_name = ? AND uuid = ?", arguments: [table, uuid]),
                  let data = text.data(using: .utf8),
                  var json = (try? JSONSerialization.jsonObject(with: data)) as? [String: Any] else { return }
            let baseVersion = try Int.fetchOne(db, sql: "SELECT sync_version FROM rsm_rows WHERE table_name = ? AND uuid = ?", arguments: [table, uuid]) ?? 1
            for (k, v) in changes { json[k] = v }
            try upsertRow(table: table, uuid: uuid, json: json, version: baseVersion, db: db)

            let payloadData = try JSONSerialization.data(withJSONObject: changes)
            try db.execute(
                sql: "INSERT INTO rsm_pending (table_name, uuid, op, payload, base_version) VALUES (?, ?, 'update', ?, ?)",
                arguments: [table, uuid, String(data: payloadData, encoding: .utf8)!, baseVersion]
            )
        }
    }

    public func localDelete(table: String, uuid: String) throws {
        try dbQueue.write { db in
            try deleteRow(table: table, uuid: uuid, db: db)
            try db.execute(
                sql: "INSERT INTO rsm_pending (table_name, uuid, op) VALUES (?, ?, 'delete')",
                arguments: [table, uuid]
            )
        }
    }

    // MARK: - Pending queue

    public struct PendingMutation: Sendable {
        public let id: Int64
        public let table: String
        public let uuid: String
        public let op: String
        public let payload: String?
        public let baseVersion: Int?
    }

    public func pendingMutations(limit: Int = 500) throws -> [PendingMutation] {
        try dbQueue.read { db in
            let rows = try Row.fetchAll(db, sql: "SELECT id, table_name, uuid, op, payload, base_version FROM rsm_pending ORDER BY id ASC LIMIT ?", arguments: [limit])
            return rows.map {
                PendingMutation(id: $0["id"], table: $0["table_name"], uuid: $0["uuid"], op: $0["op"], payload: $0["payload"], baseVersion: $0["base_version"])
            }
        }
    }

    public func pendingCount() throws -> Int {
        try dbQueue.read { db in
            try Int.fetchOne(db, sql: "SELECT COUNT(*) FROM rsm_pending") ?? 0
        }
    }

    public func removePending(ids: [Int64]) throws {
        guard !ids.isEmpty else { return }
        try dbQueue.write { db in
            let marks = ids.map { _ in "?" }.joined(separator: ",")
            try db.execute(sql: "DELETE FROM rsm_pending WHERE id IN (\(marks))", arguments: StatementArguments(ids))
        }
    }

    // MARK: - Sync application (called by SyncEngine; sync context so GRDB's
    // synchronous write overload is selected — the async one needs Sendable)

    public func applyPulledChanges(_ changes: [PullChange]) throws {
        try dbQueue.write { db in
            for change in changes {
                if change.op == "delete" || change.row == nil {
                    try deleteRow(table: change.table, uuid: change.uuid, db: db)
                } else if let row = change.row {
                    try upsertRow(table: change.table, uuid: change.uuid, json: row, version: change.syncVersion, db: db)
                }
            }
        }
    }

    /// Conflict resolution "server wins": replace (or remove) the local row.
    public func applyServerWin(table: String, uuid: String, serverRow: [String: Any]?, version: Int?) throws {
        try dbQueue.write { db in
            if let serverRow, let version {
                try upsertRow(table: table, uuid: uuid, json: serverRow, version: version, db: db)
            } else {
                try deleteRow(table: table, uuid: uuid, db: db)
            }
        }
    }

    /// Wipe everything (used when switching server/organization).
    public func reset() throws {
        try dbQueue.write { db in
            try db.execute(sql: "DELETE FROM rsm_rows")
            try db.execute(sql: "DELETE FROM rsm_pending")
            try db.execute(sql: "DELETE FROM rsm_meta")
        }
    }
}
