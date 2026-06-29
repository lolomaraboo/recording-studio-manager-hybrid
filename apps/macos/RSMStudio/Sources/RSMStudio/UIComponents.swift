import SwiftUI

/// Shared UI building blocks so every section looks and behaves the same:
/// consistent empty states, cards, list rows, form sheets and detail headers.

// MARK: - Sizing constants

enum UI {
    static let sheetWidth: CGFloat = 460
    static let contentSpacing: CGFloat = 16
    static let rowSpacing: CGFloat = 2
}

// MARK: - Empty state

/// Standard full-area empty/placeholder state (wraps ContentUnavailableView so
/// every section is identical).
struct StudioEmptyState: View {
    let title: String
    let systemImage: String
    var message: String? = nil

    var body: some View {
        ContentUnavailableView {
            Label(title, systemImage: systemImage)
        } description: {
            if let message { Text(message) }
        }
    }
}

// MARK: - Card

/// Standard card (titled GroupBox) used for every grouped block in detail and
/// dashboard views.
struct StudioCard<Content: View>: View {
    let title: String
    @ViewBuilder let content: Content

    var body: some View {
        GroupBox(title) {
            VStack(alignment: .leading, spacing: 6) { content }
                .frame(maxWidth: .infinity, alignment: .leading)
                .padding(.top, 2)
        }
    }
}

// MARK: - Standard list row

/// Standard leading-icon list row (title + optional subtitle + optional trailing).
struct StudioRow<Trailing: View>: View {
    let icon: String
    let title: String
    var subtitle: String? = nil
    @ViewBuilder var trailing: Trailing

    var body: some View {
        HStack(spacing: 8) {
            Image(systemName: icon).foregroundStyle(.tint)
            VStack(alignment: .leading, spacing: 1) {
                Text(title).fontWeight(.medium)
                if let subtitle, !subtitle.isEmpty {
                    Text(subtitle).font(.caption).foregroundStyle(.secondary)
                }
            }
            Spacer()
            trailing
        }
        .padding(.vertical, UI.rowSpacing)
    }
}

extension StudioRow where Trailing == EmptyView {
    init(icon: String, title: String, subtitle: String? = nil) {
        self.init(icon: icon, title: title, subtitle: subtitle) { EmptyView() }
    }
}

// MARK: - Form sheet scaffold

/// Standard modal form: title, grouped form content, and a Cancel / confirm
/// footer — same width and chrome everywhere.
struct StudioFormSheet<FormContent: View>: View {
    @Environment(\.modalDismiss) private var dismiss

    let title: String
    var confirmLabel: String = "Enregistrer"
    var confirmDisabled: Bool = false
    var height: CGFloat = 420
    let onConfirm: () -> Void
    @ViewBuilder let content: FormContent

    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            Text(title).font(.title3).bold().padding()
            Form { content }
                .formStyle(.grouped)
            HStack {
                Spacer()
                Button("Annuler") { dismiss() }.keyboardShortcut(.escape)
                Button(confirmLabel) { onConfirm(); dismiss() }
                    .keyboardShortcut(.return)
                    .buttonStyle(.borderedProminent)
                    .disabled(confirmDisabled)
            }
            .padding()
        }
        .frame(width: UI.sheetWidth, height: height)
    }
}

// MARK: - Detail header

/// Standard detail header: title, optional subtitle, optional trailing actions.
struct StudioDetailHeader<Trailing: View>: View {
    let title: String
    var subtitle: String? = nil
    @ViewBuilder var trailing: Trailing

    var body: some View {
        HStack(alignment: .top) {
            VStack(alignment: .leading, spacing: 3) {
                Text(title).font(.title2).bold()
                if let subtitle, !subtitle.isEmpty {
                    Text(subtitle).foregroundStyle(.secondary)
                }
            }
            Spacer()
            trailing
        }
    }
}
