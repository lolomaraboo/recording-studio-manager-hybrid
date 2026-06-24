import SwiftUI
import RSMCore

/// R2 — dedicated Tracks section: all tracks across projects, full metadata
/// detail (credits, revisions, technical data), creation and status edit.
struct TracksView: View {
    @Environment(AppModel.self) private var model
    @State private var search = ""
    @State private var selectedTrackId: String?
    @State private var showingCreate = false

    private var tracks: [Track] {
        _ = model.dataVersion
        let all = model.store.allTracks()
        guard !search.isEmpty else { return all }
        return all.filter {
            $0.title.localizedCaseInsensitiveContains(search)
                || ($0.key ?? "").localizedCaseInsensitiveContains(search)
        }
    }

    var body: some View {
        HSplitView {
            List(tracks, selection: $selectedTrackId) { track in
                TrackListRow(track: track).tag(track.id)
            }
            .frame(minWidth: 290, idealWidth: 330)
            .searchable(text: $search, placement: .sidebar, prompt: "Rechercher une track")
            .onAppear { consumeFocus() }
            .onChange(of: model.focusedEntity[.tracks]) { consumeFocus() }

            Group {
                if let id = selectedTrackId, let track = tracks.first(where: { $0.id == id }) {
                    TrackDetailView(track: track)
                } else {
                    ContentUnavailableView("Sélectionne une track", systemImage: "waveform")
                }
            }
            .frame(minWidth: 380, maxWidth: .infinity, maxHeight: .infinity)
        }
        .navigationTitle("Tracks")
        .toolbar {
            ToolbarItem {
                Button { showingCreate = true } label: {
                    Label("Nouvelle track", systemImage: "plus")
                }
            }
        }
        .modalCard(isPresented: $showingCreate) {
            TrackCreateSheet { payload in
                _ = try? model.store.localInsert(table: "tracks", payload: payload)
                Task { await model.syncNow() }
            }
        }
    }

    private func consumeFocus() {
        if let uuid = model.focusedEntity[.tracks] {
            selectedTrackId = uuid
            search = ""
            model.focusedEntity[.tracks] = nil
        }
    }
}

struct TrackListRow: View {
    @Environment(AppModel.self) private var model
    let track: Track

    var body: some View {
        let project = track.projectId.flatMap { id in model.store.projects().first { $0.serverId == id } }
        HStack {
            Image(systemName: "waveform").foregroundStyle(.tint)
            VStack(alignment: .leading, spacing: 2) {
                Text(track.title).fontWeight(.medium)
                if let project {
                    Text(project.name).font(.caption).foregroundStyle(.secondary)
                }
            }
            Spacer()
            TrackStatusBadge(status: track.status)
        }
        .padding(.vertical, 2)
    }
}

struct TrackDetailView: View {
    @Environment(AppModel.self) private var model
    let track: Track

    private var project: Project? {
        track.projectId.flatMap { id in model.store.projects().first { $0.serverId == id } }
    }

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 16) {
                // Header
                HStack {
                    VStack(alignment: .leading, spacing: 3) {
                        Text(track.title).font(.title2).bold()
                        if let project {
                            EntityLink(icon: "music.note.list", label: "Projet : \(project.name)") {
                                model.open(.projects, entity: project.id)
                            }
                        }
                    }
                    Spacer()
                    statusPicker
                }

                // Player (SoundCloud-style) — persistent, multi-presentation
                if track.int("id") != nil {
                    Button {
                        model.openPlayer(track: track)
                    } label: {
                        Label("Écouter & commenter", systemImage: "waveform.circle.fill")
                            .frame(maxWidth: .infinity)
                    }
                    .controlSize(.large)
                    .buttonStyle(.borderedProminent)
                }

                // Musical metadata
                GroupBox("Infos musicales") {
                    VStack(spacing: 4) {
                        InfoRow(label: "N° de piste", value: track.trackNumber.map(String.init))
                        InfoRow(label: "BPM", value: track.bpm.map(String.init))
                        InfoRow(label: "Tonalité", value: track.key)
                        InfoRow(label: "Durée", value: track.int("duration").map { "\($0 / 60):\(String(format: "%02d", $0 % 60))" })
                        InfoRow(label: "ISRC", value: track.string("isrc"))
                        InfoRow(label: "Compositeur", value: track.string("composer"))
                        InfoRow(label: "Parolier", value: track.string("lyricist"))
                    }
                }

                // Production versions (legacy shortcuts)
                let versions: [(String, String?)] = [
                    ("Démo", track.string("demo_url")),
                    ("Rough mix", track.string("rough_mix_url")),
                    ("Mix final", track.string("final_mix_url")),
                    ("Master", track.string("master_url")),
                ]
                if versions.contains(where: { $0.1 != nil }) {
                    GroupBox("Versions") {
                        VStack(alignment: .leading, spacing: 4) {
                            ForEach(versions, id: \.0) { label, url in
                                if let url {
                                    HStack {
                                        Image(systemName: "waveform.circle").foregroundStyle(.tint)
                                        Text(label)
                                        Spacer()
                                        Text(url).font(.caption).foregroundStyle(.secondary)
                                            .lineLimit(1).truncationMode(.middle)
                                    }
                                }
                            }
                        }
                    }
                }

                // Credits → talents
                if let serverId = track.int("id") {
                    let credits = model.store.credits(trackServerId: serverId)
                    RelatedSection("Crédits", items: credits.map(\.talent),
                                   emptyText: "Aucun talent crédité.") { talent in
                        let role = credits.first { $0.talent.id == talent.id }?.role
                        return RelatedRowContent(icon: "music.mic", title: talent.displayName, subtitle: role)
                    } onTap: { _ in
                        model.open(.talents)
                    }

                    // Revisions cycle (same component as in project view)
                    GroupBox("Cycle de révisions") {
                        TrackRowWithRevisions(track: track, includedRevisions: project?.includedRevisions ?? 2)
                    }
                }

                if let lyrics = track.string("lyrics"), !lyrics.isEmpty {
                    GroupBox("Paroles") {
                        Text(lyrics).frame(maxWidth: .infinity, alignment: .leading)
                            .font(.callout)
                    }
                }

                if let notes = track.string("notes"), !notes.isEmpty {
                    GroupBox("Notes") {
                        Text(notes).frame(maxWidth: .infinity, alignment: .leading)
                    }
                }
            }
            .padding()
        }
    }

    private var statusPicker: some View {
        Picker("", selection: Binding(
            get: { track.status },
            set: { newStatus in
                try? model.store.localUpdate(table: "tracks", uuid: track.id, changes: ["status": newStatus])
                Task { await model.syncNow() }
            }
        )) {
            Text("Enregistrement").tag("recording")
            Text("Édition").tag("editing")
            Text("Mixage").tag("mixing")
            Text("Mastering").tag("mastering")
            Text("Terminé").tag("completed")
        }
        .pickerStyle(.menu)
        .frame(width: 150)
    }
}

// MARK: - Create sheet

struct TrackCreateSheet: View {
    @Environment(\.modalDismiss) private var dismiss
    @Environment(AppModel.self) private var model
    var defaultProjectServerId: Int? = nil
    let onCreate: ([String: Any]) -> Void

    @State private var title = ""
    @State private var projectServerId: Int?
    @State private var trackNumber = 1
    @State private var bpm = 0
    @State private var key = ""

    private var projects: [Project] { model.store.projects().filter { $0.serverId != nil } }

    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            Text("Nouvelle track").font(.title3).bold().padding()
            Form {
                TextField("Titre", text: $title)
                Picker("Projet", selection: $projectServerId) {
                    Text("Choisir…").tag(nil as Int?)
                    ForEach(projects) { project in
                        Text(project.name).tag(project.serverId)
                    }
                }
                Stepper("N° de piste : \(trackNumber)", value: $trackNumber, in: 1...99)
                TextField("BPM", value: $bpm, format: .number)
                TextField("Tonalité", text: $key, prompt: Text("Am, C, F#m…"))
                if projects.isEmpty {
                    Text("Crée d'abord un projet (synchronisé).")
                        .font(.caption).foregroundStyle(.orange)
                }
            }
            .formStyle(.grouped)
            HStack {
                Spacer()
                Button("Annuler") { dismiss() }.keyboardShortcut(.escape)
                Button("Créer") {
                    var payload: [String: Any] = [
                        "title": title,
                        "project_id": projectServerId ?? 0,
                        "track_number": trackNumber,
                        "status": "recording",
                    ]
                    if bpm > 0 { payload["bpm"] = bpm }
                    if !key.isEmpty { payload["key"] = key }
                    onCreate(payload)
                    dismiss()
                }
                .keyboardShortcut(.return)
                .buttonStyle(.borderedProminent)
                .disabled(title.trimmingCharacters(in: .whitespaces).isEmpty || projectServerId == nil)
            }
            .padding()
        }
        .frame(width: 420, height: 400)
        .onAppear { projectServerId = projectServerId ?? defaultProjectServerId }
    }
}
