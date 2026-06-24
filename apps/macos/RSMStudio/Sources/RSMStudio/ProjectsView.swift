import SwiftUI
import RSMCore

/// M4 — projects with their tracks (read + status at a glance).
struct ProjectsView: View {
    @Environment(AppModel.self) private var model
    @State private var selectedProjectId: String?

    private var projects: [Project] {
        _ = model.dataVersion
        return model.store.projects()
    }

    var body: some View {
        HSplitView {
            List(projects, selection: $selectedProjectId) { project in
                ProjectRow(project: project).tag(project.id)
            }
            .frame(minWidth: 280, idealWidth: 320)
            .onAppear { consumeFocus() }
            .onChange(of: model.focusedEntity[.projects]) { consumeFocus() }

            Group {
                if let id = selectedProjectId, let project = projects.first(where: { $0.id == id }) {
                    ProjectDetailView(project: project)
                } else {
                    ContentUnavailableView("Sélectionne un projet", systemImage: "music.note.list")
                }
            }
            .frame(minWidth: 360, maxWidth: .infinity, maxHeight: .infinity)
        }
        .navigationTitle("Projets")
    }

    private func consumeFocus() {
        if let uuid = model.focusedEntity[.projects] {
            selectedProjectId = uuid
            model.focusedEntity[.projects] = nil
        }
    }
}

struct ProjectRow: View {
    @Environment(AppModel.self) private var model
    let project: Project

    var body: some View {
        let clientName = project.clientId.flatMap { model.store.clientsByServerId()[$0]?.name }
        HStack {
            Image(systemName: "music.note.list").foregroundStyle(.tint)
            VStack(alignment: .leading, spacing: 2) {
                Text(project.name).fontWeight(.medium)
                HStack(spacing: 4) {
                    Text(typeLabel(project.type))
                    if let clientName { Text("· \(clientName)") }
                }
                .font(.caption).foregroundStyle(.secondary)
            }
            Spacer()
            ProjectStatusBadge(status: project.status)
        }
        .padding(.vertical, 2)
    }

    private func typeLabel(_ type: String) -> String {
        switch type {
        case "ep": "EP"
        case "single": "Single"
        case "demo": "Démo"
        case "soundtrack": "BO"
        case "podcast": "Podcast"
        default: "Album"
        }
    }
}

struct ProjectStatusBadge: View {
    let status: String

    var body: some View {
        let (label, color): (String, Color) = switch status {
        case "recording": ("Enregistrement", .red)
        case "editing": ("Édition", .orange)
        case "mixing": ("Mixage", .blue)
        case "mastering": ("Mastering", .purple)
        case "completed": ("Terminé", .green)
        case "delivered": ("Livré", .green)
        case "archived": ("Archivé", .secondary)
        default: ("Pré-prod", .secondary)
        }
        return Text(label)
            .font(.caption2)
            .padding(.horizontal, 6).padding(.vertical, 2)
            .background(color.opacity(0.15), in: Capsule())
            .foregroundStyle(color)
    }
}

struct ProjectDetailView: View {
    @Environment(AppModel.self) private var model
    let project: Project

    private var tracks: [Track] {
        _ = model.dataVersion
        guard let serverId = project.serverId else { return [] }
        return model.store.tracks(projectServerId: serverId)
    }

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 16) {
                HStack {
                    VStack(alignment: .leading, spacing: 3) {
                        Text(project.name).font(.title2).bold()
                        if let artist = project.artistName {
                            Text(artist).foregroundStyle(.secondary)
                        }
                        if let client = project.clientId.flatMap({ model.store.clientsByServerId()[$0] }) {
                            EntityLink(icon: "person.crop.circle", label: client.displayName) {
                                model.open(.clients, entity: client.id)
                            }
                        }
                    }
                    Spacer()
                    ProjectStatusBadge(status: project.status)
                }

                GroupBox("Tracks (\(tracks.count))") {
                    if tracks.isEmpty {
                        Text("Aucune track synchronisée.")
                            .foregroundStyle(.secondary)
                            .frame(maxWidth: .infinity, alignment: .leading)
                    } else {
                        ForEach(tracks) { track in
                            TrackRowWithRevisions(track: track, includedRevisions: project.includedRevisions)
                            if track.id != tracks.last?.id { Divider() }
                        }
                    }
                }

                // ---- Le graphe du projet : tout ce qui s'y rattache ----
                if let serverId = project.serverId {
                    RelatedSection("Sessions", items: model.store.sessions(projectServerId: serverId),
                                   emptyText: "Aucune session liée à ce projet.") { session in
                        session.relatedRow
                    } onTap: { _ in
                        model.open(.sessions)
                    }

                    let credited = model.store.talents(projectServerId: serverId)
                    RelatedSection("Talents crédités", items: credited.map(\.talent)) { talent in
                        let role = credited.first { $0.talent.id == talent.id }?.role
                        return RelatedRowContent(icon: "music.mic", title: talent.displayName, subtitle: role)
                    } onTap: { _ in
                        model.open(.talents)
                    }

                    RelatedSection("Devis à l'origine du projet", items: model.store.quotes(projectServerId: serverId)) { quote in
                        RelatedRowContent(icon: "doc.plaintext", title: quote.number, subtitle: euro(quote.total))
                    } onTap: { quote in
                        model.open(.quotes, entity: quote.id)
                    }

                    RelatedSection("Dépenses du projet", items: model.store.expenses(projectServerId: serverId)) { expense in
                        RelatedRowContent(icon: "cart", title: expense.description, subtitle: euro(expense.amount))
                    } onTap: { _ in
                        model.open(.expenses)
                    }
                }
            }
            .padding()
        }
    }
}

/// Track row + structured revision cycle (P3 — GAP-3): V1 → retours → V2 → approuvée.
struct TrackRowWithRevisions: View {
    @Environment(AppModel.self) private var model
    let track: Track
    let includedRevisions: Int
    @State private var expanded = false

    private var revisions: [TrackRevisionEntry] {
        _ = model.dataVersion
        guard let serverId = track.int("id") else { return [] }
        return model.store.trackRevisions(trackServerId: serverId)
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            HStack {
                Text(track.trackNumber.map { String(format: "%02d", $0) } ?? "—")
                    .font(.caption.monospaced()).foregroundStyle(.secondary)
                Text(track.title)
                Spacer()
                if let bpm = track.bpm {
                    Text("\(bpm) BPM").font(.caption).foregroundStyle(.secondary)
                }
                if let key = track.key {
                    Text(key).font(.caption).foregroundStyle(.secondary)
                }
                TrackStatusBadge(status: track.status)
                if track.int("id") != nil {
                    Button {
                        withAnimation { expanded.toggle() }
                    } label: {
                        Label("\(revisions.count)", systemImage: expanded ? "chevron.down" : "chevron.right")
                            .font(.caption)
                    }
                    .buttonStyle(.plain).foregroundStyle(.secondary)
                    .help("Révisions")
                }
            }
            .padding(.vertical, 3)

            if expanded {
                VStack(alignment: .leading, spacing: 6) {
                    ForEach(revisions) { revision in
                        HStack {
                            Text("V\(revision.versionNumber)").font(.caption.monospaced()).bold()
                            Text(stageLabel(revision.stage)).font(.caption).foregroundStyle(.secondary)
                            RevisionStatusBadge(status: revision.status)
                            if let feedback = revision.clientFeedback, !feedback.isEmpty {
                                Image(systemName: "text.bubble").font(.caption2).help(feedback)
                            }
                            Spacer()
                            if revision.status == "submitted" {
                                Button("Approuver") { setStatus(revision, "approved") }
                                    .font(.caption).buttonStyle(.bordered).controlSize(.mini)
                                Button("Retours") { setStatus(revision, "changes_requested") }
                                    .font(.caption).buttonStyle(.bordered).controlSize(.mini)
                            }
                        }
                    }
                    HStack {
                        Button {
                            addRevision()
                        } label: {
                            Label("Nouvelle version (mix)", systemImage: "plus.circle")
                        }
                        .font(.caption).buttonStyle(.borderless)
                        let billable = max(0, revisions.filter { $0.stage == "mix" }.count - includedRevisions)
                        if billable > 0 {
                            Text("\(billable) au-delà du devis → facturable")
                                .font(.caption2).foregroundStyle(.orange)
                        }
                    }
                }
                .padding(.leading, 28).padding(.bottom, 4)
            }
        }
    }

    private func setStatus(_ revision: TrackRevisionEntry, _ status: String) {
        try? model.store.localUpdate(table: "track_revisions", uuid: revision.id, changes: ["status": status])
        Task { await model.syncNow() }
    }

    private func addRevision() {
        guard let trackId = track.int("id") else { return }
        let nextVersion = (revisions.filter { $0.stage == "mix" }.map(\.versionNumber).max() ?? 0) + 1
        let billable = nextVersion > includedRevisions
        _ = try? model.store.localInsert(table: "track_revisions", payload: [
            "track_id": trackId, "version_number": nextVersion, "stage": "mix",
            "status": "submitted", "is_billable": billable,
        ])
        Task { await model.syncNow() }
    }

    private func stageLabel(_ stage: String) -> String {
        switch stage {
        case "demo": "Démo"
        case "master": "Master"
        default: "Mix"
        }
    }
}

struct RevisionStatusBadge: View {
    let status: String

    var body: some View {
        let (label, color): (String, Color) = switch status {
        case "approved": ("Approuvée", .green)
        case "changes_requested": ("Retours demandés", .orange)
        default: ("En attente client", .blue)
        }
        return Text(label)
            .font(.caption2)
            .padding(.horizontal, 5).padding(.vertical, 1)
            .background(color.opacity(0.15), in: Capsule())
            .foregroundStyle(color)
    }
}

struct TrackStatusBadge: View {
    let status: String

    var body: some View {
        let (label, color): (String, Color) = switch status {
        case "editing": ("Édition", .orange)
        case "mixing": ("Mix", .blue)
        case "mastering": ("Master", .purple)
        case "completed": ("Terminé", .green)
        default: ("Rec", .red)
        }
        return Text(label)
            .font(.caption2)
            .padding(.horizontal, 5).padding(.vertical, 1)
            .background(color.opacity(0.15), in: Capsule())
            .foregroundStyle(color)
    }
}
