import SwiftUI
import UserNotifications
import RSMCore

// ============================================================================
// S1 — Notifications: native macOS banners for newly synced notifications
// + bell popover with the list, navigation links and mark-as-read.
// ============================================================================

@MainActor
enum NativeNotifier {
    private static var delivered = Set<String>()
    private static var permissionRequested = false
    private static var bootstrapped = false

    /// Banner-notify any unread notification not yet delivered this run.
    /// First call only seeds the delivered set (no banner storm at launch).
    static func deliverNew(from store: LocalStore) {
        // No bundle (e.g. `swift run` without .app) → UNUserNotificationCenter unavailable
        guard Bundle.main.bundleIdentifier != nil else { return }

        let unread = store.notifications().filter { !$0.isRead }

        if !bootstrapped {
            bootstrapped = true
            delivered.formUnion(unread.map(\.id))
            return
        }

        let fresh = unread.filter { !delivered.contains($0.id) }
        guard !fresh.isEmpty else { return }
        delivered.formUnion(fresh.map(\.id))

        let center = UNUserNotificationCenter.current()
        if !permissionRequested {
            permissionRequested = true
            center.requestAuthorization(options: [.alert, .sound, .badge]) { _, _ in }
        }

        for item in fresh.prefix(5) {
            let content = UNMutableNotificationContent()
            content.title = item.title
            if let message = item.message { content.body = message }
            if item.priority == "high" || item.priority == "urgent" { content.sound = .default }
            center.add(UNNotificationRequest(identifier: item.id, content: content, trigger: nil))
        }
    }
}

// MARK: - Bell button + popover list (toolbar)

struct NotificationsBell: View {
    @Environment(AppModel.self) private var model
    @State private var showingList = false

    private var unreadCount: Int {
        _ = model.dataVersion
        return model.store.notifications().filter { !$0.isRead }.count
    }

    var body: some View {
        Button {
            showingList = true
        } label: {
            Label("Notifications", systemImage: unreadCount > 0 ? "bell.badge.fill" : "bell")
                .symbolRenderingMode(unreadCount > 0 ? .multicolor : .monochrome)
        }
        .help(unreadCount > 0 ? "\(unreadCount) notification(s) non lue(s)" : "Notifications")
        .popover(isPresented: $showingList, arrowEdge: .bottom) {
            NotificationsList()
        }
    }
}

struct NotificationsList: View {
    @Environment(\.dismiss) private var dismiss
    @Environment(AppModel.self) private var model

    private var notifications: [NotificationItem] {
        _ = model.dataVersion
        return Array(model.store.notifications().prefix(30))
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            HStack {
                Text("Notifications").font(.headline)
                Spacer()
                if notifications.contains(where: { !$0.isRead }) {
                    Button("Tout marquer lu") {
                        for item in notifications where !item.isRead {
                            try? model.store.localUpdate(table: "notifications", uuid: item.id, changes: ["is_read": true])
                        }
                        Task { await model.syncNow() }
                    }
                    .font(.caption)
                }
            }
            .padding(10)
            Divider()

            if notifications.isEmpty {
                Text("Aucune notification")
                    .foregroundStyle(.secondary)
                    .frame(maxWidth: .infinity, minHeight: 80)
            } else {
                ScrollView {
                    VStack(spacing: 0) {
                        ForEach(notifications) { item in
                            Button {
                                open(item)
                            } label: {
                                HStack(alignment: .top, spacing: 8) {
                                    Circle()
                                        .fill(item.isRead ? Color.clear : Color.accentColor)
                                        .frame(width: 7, height: 7)
                                        .padding(.top, 5)
                                    VStack(alignment: .leading, spacing: 2) {
                                        Text(item.title)
                                            .fontWeight(item.isRead ? .regular : .semibold)
                                            .foregroundStyle(.primary)
                                        if let message = item.message {
                                            Text(message).font(.caption).foregroundStyle(.secondary)
                                                .lineLimit(2)
                                        }
                                    }
                                    Spacer()
                                }
                                .padding(.horizontal, 10).padding(.vertical, 6)
                                .contentShape(Rectangle())
                            }
                            .buttonStyle(.plain)
                            Divider()
                        }
                    }
                }
            }
        }
        .frame(width: 340, height: 360)
    }

    private func open(_ item: NotificationItem) {
        try? model.store.localUpdate(table: "notifications", uuid: item.id, changes: ["is_read": true])
        Task { await model.syncNow() }

        // Navigate to the linked entity when there is one
        if let clientId = item.clientId,
           let client = model.store.clientsByServerId()[clientId] {
            model.open(.clients, entity: client.id)
        } else if let projectId = item.projectId,
                  let project = model.store.projects().first(where: { $0.serverId == projectId }) {
            model.open(.projects, entity: project.id)
        } else if let invoiceId = item.invoiceId,
                  let invoice = model.store.invoices().first(where: { $0.serverId == invoiceId }) {
            model.open(.invoices, entity: invoice.id)
        } else if item.sessionId != nil {
            model.open(.sessions)
        }
        dismiss()
    }
}
