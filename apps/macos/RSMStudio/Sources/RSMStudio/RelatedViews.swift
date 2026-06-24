import SwiftUI
import RSMCore

/// Décloisonnement : section réutilisable « données liées » avec lignes
/// cliquables qui naviguent vers l'entité (model.open(section, entity:)).
struct RelatedSection<Item: Identifiable>: View {
    let title: String
    let items: [Item]
    let emptyText: String?
    let row: (Item) -> RelatedRowContent
    let onTap: (Item) -> Void

    init(_ title: String, items: [Item], emptyText: String? = nil,
         row: @escaping (Item) -> RelatedRowContent, onTap: @escaping (Item) -> Void) {
        self.title = title
        self.items = items
        self.emptyText = emptyText
        self.row = row
        self.onTap = onTap
    }

    var body: some View {
        if !items.isEmpty || emptyText != nil {
            GroupBox("\(title) (\(items.count))") {
                if items.isEmpty {
                    Text(emptyText ?? "—").foregroundStyle(.secondary)
                        .frame(maxWidth: .infinity, alignment: .leading)
                } else {
                    VStack(spacing: 0) {
                        ForEach(items) { item in
                            let content = row(item)
                            Button {
                                onTap(item)
                            } label: {
                                HStack {
                                    Image(systemName: content.icon)
                                        .foregroundStyle(.tint).frame(width: 20)
                                    Text(content.title).foregroundStyle(.primary)
                                    if let badge = content.badge {
                                        Text(badge).font(.caption2)
                                            .padding(.horizontal, 5).padding(.vertical, 1)
                                            .background(.quaternary, in: Capsule())
                                    }
                                    Spacer()
                                    Text(content.subtitle ?? "")
                                        .font(.caption).foregroundStyle(.secondary)
                                    Image(systemName: "chevron.right")
                                        .font(.caption2).foregroundStyle(.tertiary)
                                }
                                .padding(.vertical, 4)
                                .contentShape(Rectangle())
                            }
                            .buttonStyle(.plain)
                            if item.id != items.last?.id { Divider() }
                        }
                    }
                }
            }
        }
    }
}

struct RelatedRowContent {
    let icon: String
    let title: String
    var subtitle: String? = nil
    var badge: String? = nil
}

/// Lien inline vers une entité (ex: nom du client dans un en-tête de fiche).
struct EntityLink: View {
    let icon: String
    let label: String
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            HStack(spacing: 4) {
                Image(systemName: icon).font(.caption)
                Text(label).underline(pattern: .dot)
            }
            .foregroundStyle(Color.accentColor)
        }
        .buttonStyle(.plain)
        .help("Ouvrir \(label)")
    }
}

// MARK: - Shared row formatters

extension StudioSession {
    var relatedRow: RelatedRowContent {
        RelatedRowContent(
            icon: "calendar",
            title: title,
            subtitle: startTime?.formatted(date: .abbreviated, time: .shortened),
            badge: status == "cancelled" ? "Annulée" : (status == "conflict" ? "⚠ Conflit" : nil)
        )
    }
}
