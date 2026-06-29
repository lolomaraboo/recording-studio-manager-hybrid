import SwiftUI

/// Agenda Mac — read-only view of the user's native Calendar events and
/// Reminders inside RSM (via EventKit). Permissions prompt on first load.
struct SystemView: View {
    @State private var events: [MacEvent] = []
    @State private var reminders: [MacReminder] = []
    @State private var loading = true

    private static let dfDateTime: DateFormatter = {
        let f = DateFormatter(); f.locale = Locale(identifier: "fr_FR")
        f.dateFormat = "EEE d MMM, HH:mm"; return f
    }()
    private static let dfDay: DateFormatter = {
        let f = DateFormatter(); f.locale = Locale(identifier: "fr_FR")
        f.dateFormat = "d MMM"; return f
    }()

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 16) {
                GroupBox("Calendrier — 14 prochains jours") {
                    if loading {
                        ProgressView().frame(maxWidth: .infinity).padding()
                    } else if events.isEmpty {
                        Text("Aucun événement (ou accès non autorisé dans Réglages › Confidentialité › Calendriers).")
                            .font(.callout).foregroundStyle(.secondary)
                            .frame(maxWidth: .infinity, alignment: .leading)
                    } else {
                        VStack(alignment: .leading, spacing: 8) {
                            ForEach(events) { e in
                                HStack(alignment: .top, spacing: 8) {
                                    Image(systemName: "calendar").foregroundStyle(.tint)
                                    VStack(alignment: .leading, spacing: 1) {
                                        Text(e.title)
                                        Text("\(Self.dfDateTime.string(from: e.start)) · \(e.calendar)")
                                            .font(.caption).foregroundStyle(.secondary)
                                    }
                                    Spacer()
                                }
                            }
                        }
                    }
                }

                GroupBox("Rappels à faire") {
                    if loading {
                        ProgressView().frame(maxWidth: .infinity).padding()
                    } else if reminders.isEmpty {
                        Text("Aucun rappel (ou accès non autorisé dans Réglages › Confidentialité › Rappels).")
                            .font(.callout).foregroundStyle(.secondary)
                            .frame(maxWidth: .infinity, alignment: .leading)
                    } else {
                        VStack(alignment: .leading, spacing: 8) {
                            ForEach(reminders) { r in
                                HStack(spacing: 8) {
                                    Image(systemName: "circle").foregroundStyle(.secondary)
                                    Text(r.title)
                                    Spacer()
                                    if let due = r.due {
                                        Text(Self.dfDay.string(from: due))
                                            .font(.caption).foregroundStyle(.orange)
                                    }
                                }
                            }
                        }
                    }
                }
            }
            .padding()
        }
        .navigationTitle("Agenda Mac")
        .toolbar {
            ToolbarItem {
                Button { Task { await load() } } label: {
                    Label("Actualiser", systemImage: "arrow.clockwise")
                }
            }
        }
        .task { await load() }
    }

    private func load() async {
        loading = true
        async let e = SystemImport.events()
        async let r = SystemImport.reminders()
        events = await e
        reminders = await r
        loading = false
    }
}
