import SwiftUI
import RSMCore

/// Q3 — global instant search (⇧⌘F) over the local cache: zero latency,
/// fully offline. Results grouped by type; selecting one jumps to its section.
struct SearchSheet: View {
    @Environment(\.modalDismiss) private var dismiss
    @Environment(AppModel.self) private var model
    let onNavigate: (SidebarItem, String?) -> Void

    @State private var query = ""
    @FocusState private var focused: Bool

    struct Result: Identifiable {
        let id = UUID()
        let icon: String
        let title: String
        let subtitle: String
        let section: SidebarItem
        var uuid: String? = nil
    }

    private var results: [(group: String, items: [Result])] {
        let q = query.trimmingCharacters(in: .whitespaces)
        guard q.count >= 2 else { return [] }
        func match(_ values: String?...) -> Bool {
            values.contains { $0?.localizedCaseInsensitiveContains(q) == true }
        }

        var groups: [(String, [Result])] = []

        let clients = model.store.clients()
            .filter { match($0.name, $0.artistName, $0.email, $0.phone, $0.city) }
            .prefix(5)
            .map { Result(icon: "person.crop.circle", title: $0.displayName, subtitle: $0.email ?? $0.city ?? "", section: .clients, uuid: $0.id) }
        if !clients.isEmpty { groups.append(("Clients", Array(clients))) }

        let sessions = model.store.studioSessions()
            .filter { match($0.title, $0.string("notes")) }
            .prefix(5)
            .map { Result(icon: "calendar", title: $0.title,
                          subtitle: $0.startTime?.formatted(date: .abbreviated, time: .shortened) ?? "",
                          section: .sessions) }
        if !sessions.isEmpty { groups.append(("Sessions", Array(sessions))) }

        let projects = model.store.projects()
            .filter { match($0.name, $0.artistName) }
            .prefix(5)
            .map { Result(icon: "music.note.list", title: $0.name, subtitle: $0.artistName ?? "", section: .projects, uuid: $0.id) }
        if !projects.isEmpty { groups.append(("Projets", Array(projects))) }

        let tracks = model.store.allTracks()
            .filter { match($0.title, $0.key) }
            .prefix(5)
            .map { Result(icon: "waveform", title: $0.title, subtitle: $0.key ?? "", section: .tracks, uuid: $0.id) }
        if !tracks.isEmpty { groups.append(("Tracks", Array(tracks))) }

        let quotes = model.store.quotes()
            .filter { match($0.number, $0.notes) }
            .prefix(5)
            .map { Result(icon: "doc.plaintext", title: $0.number, subtitle: euro($0.total), section: .quotes, uuid: $0.id) }
        if !quotes.isEmpty { groups.append(("Devis", Array(quotes))) }

        let invoices = model.store.invoices()
            .filter { match($0.number, $0.notes) }
            .prefix(5)
            .map { Result(icon: "doc.text", title: $0.number, subtitle: euro($0.total), section: .invoices, uuid: $0.id) }
        if !invoices.isEmpty { groups.append(("Factures", Array(invoices))) }

        let equipment = model.store.equipmentList()
            .filter { match($0.name, $0.brand, $0.model, $0.serialNumber) }
            .prefix(5)
            .map { Result(icon: "hifispeaker", title: $0.name, subtitle: [$0.brand, $0.model].compactMap { $0 }.joined(separator: " "), section: .equipment) }
        if !equipment.isEmpty { groups.append(("Équipement", Array(equipment))) }

        let talents = model.store.talents()
            .filter { match($0.name, $0.stageName, $0.primaryInstrument) }
            .prefix(5)
            .map { Result(icon: "music.mic", title: $0.displayName, subtitle: $0.primaryInstrument ?? "", section: .talents) }
        if !talents.isEmpty { groups.append(("Talents", Array(talents))) }

        return groups
    }

    var body: some View {
        VStack(spacing: 0) {
            HStack {
                Image(systemName: "magnifyingglass").foregroundStyle(.secondary)
                TextField("Rechercher partout (clients, sessions, factures…)", text: $query)
                    .textFieldStyle(.plain)
                    .font(.title3)
                    .focused($focused)
            }
            .padding(14)
            Divider()

            if results.isEmpty {
                VStack {
                    Spacer()
                    Text(query.count >= 2 ? "Aucun résultat" : "Tape au moins 2 caractères")
                        .foregroundStyle(.secondary)
                    Spacer()
                }
                .frame(maxWidth: .infinity)
            } else {
                List {
                    ForEach(results, id: \.group) { group in
                        Section(group.group) {
                            ForEach(group.items) { result in
                                Button {
                                    onNavigate(result.section, result.uuid)
                                    dismiss()
                                } label: {
                                    HStack {
                                        Image(systemName: result.icon).foregroundStyle(.tint).frame(width: 20)
                                        Text(result.title)
                                        Spacer()
                                        Text(result.subtitle).font(.caption).foregroundStyle(.secondary)
                                    }
                                    .contentShape(Rectangle())
                                }
                                .buttonStyle(.plain)
                            }
                        }
                    }
                }
                .listStyle(.inset)
            }
        }
        .frame(width: 560, height: 420)
        .onAppear { focused = true }
        .onKeyPress(.escape) { dismiss(); return .handled }
    }
}
