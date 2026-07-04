import SwiftUI
import AppKit
import UniformTypeIdentifiers
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

    @State private var uploadStage = "demo"
    @State private var uploading = false
    @State private var uploadError: String?
    @State private var shareNotice: String?
    @State private var showingCredits = false

    private var project: Project? {
        track.projectId.flatMap { id in model.store.projects().first { $0.serverId == id } }
    }

    private let versionDefs: [(label: String, type: String, column: String)] = [
        ("Démo", "demo", "demo_url"),
        ("Rough mix", "roughMix", "rough_mix_url"),
        ("Mix final", "finalMix", "final_mix_url"),
        ("Master", "master", "master_url"),
    ]

    private func importAudio() {
        let panel = NSOpenPanel()
        panel.allowedContentTypes = [.audio]
        panel.allowsMultipleSelection = false
        panel.canChooseDirectories = false
        guard panel.runModal() == .OK, let fileURL = panel.url,
              let def = versionDefs.first(where: { $0.type == uploadStage }) else { return }
        let trackId = track.int("id")
        let uuid = track.id
        let stage = uploadStage
        let api = APIClient(config: model.config)
        let store = model.store
        uploading = true
        uploadError = nil
        Task {
            do {
                let hosted = try await api.uploadAudio(fileURL: fileURL, versionType: stage, trackServerId: trackId)
                try store.localUpdate(table: "tracks", uuid: uuid, changes: [def.column: hosted])
                await model.syncNow()
                await MainActor.run { uploading = false }
            } catch {
                await MainActor.run {
                    uploading = false
                    uploadError = error.localizedDescription
                }
            }
        }
    }

    private func shareLink(_ token: String) -> String {
        "\(model.config.baseURL)/api/share/\(model.config.organizationId)/\(token)"
    }

    private func copyLink(_ token: String) {
        let pb = NSPasteboard.general
        pb.clearContents()
        pb.setString(shareLink(token), forType: .string)
        shareNotice = "Lien copié"
    }

    private func createShare() {
        guard let trackId = track.int("id") else { return }
        let token = UUID().uuidString.replacingOccurrences(of: "-", with: "").lowercased()
        _ = try? model.store.localInsert(table: "shares", payload: [
            "track_id": trackId,
            "share_token": token,
            "status": "active",
            "access_count": 0,
        ])
        copyLink(token)
        Task { await model.syncNow() }
    }

    private func revokeShare(_ share: Share) {
        try? model.store.localUpdate(table: "shares", uuid: share.id, changes: ["status": "revoked"])
        Task { await model.syncNow() }
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

                // Production versions + upload to the server (Cloudinary)
                GroupBox("Versions audio") {
                    VStack(alignment: .leading, spacing: 6) {
                        ForEach(versionDefs, id: \.type) { def in
                            if let url = track.string(def.column), !url.isEmpty {
                                HStack {
                                    Image(systemName: "waveform.circle").foregroundStyle(.tint)
                                    Text(def.label)
                                    Spacer()
                                    Text(url).font(.caption).foregroundStyle(.secondary)
                                        .lineLimit(1).truncationMode(.middle)
                                }
                            }
                        }
                        Divider()
                        HStack {
                            Picker("Version", selection: $uploadStage) {
                                ForEach(versionDefs, id: \.type) { def in
                                    Text(def.label).tag(def.type)
                                }
                            }
                            .labelsHidden().frame(width: 150)
                            Button {
                                importAudio()
                            } label: {
                                Label(uploading ? "Envoi en cours…" : "Importer un fichier audio",
                                      systemImage: "square.and.arrow.up")
                            }
                            .disabled(uploading || track.int("id") == nil)
                            if uploading { ProgressView().controlSize(.small) }
                        }
                        if let uploadError {
                            Text(uploadError).font(.caption).foregroundStyle(.red)
                        }
                        if track.int("id") == nil {
                            Text("Synchronise d'abord cette track pour pouvoir importer un fichier.")
                                .font(.caption2).foregroundStyle(.secondary)
                        }
                    }
                }

                // Public share links
                if let serverId = track.int("id") {
                    let activeShares = model.store.shares(trackServerId: serverId).filter { $0.status == "active" }
                    GroupBox("Partage public") {
                        VStack(alignment: .leading, spacing: 6) {
                            if activeShares.isEmpty {
                                Text("Aucun lien actif.").font(.caption).foregroundStyle(.secondary)
                                    .frame(maxWidth: .infinity, alignment: .leading)
                            } else {
                                ForEach(activeShares) { share in
                                    HStack {
                                        Image(systemName: "link").foregroundStyle(.tint)
                                        Text(shareLink(share.token))
                                            .font(.caption).lineLimit(1).truncationMode(.middle)
                                        Spacer()
                                        Text("\(share.accessCount) vues").font(.caption2).foregroundStyle(.secondary)
                                        Button { copyLink(share.token) } label: { Image(systemName: "doc.on.doc") }
                                            .buttonStyle(.borderless).help("Copier le lien")
                                        Button(role: .destructive) { revokeShare(share) } label: { Image(systemName: "trash") }
                                            .buttonStyle(.borderless).help("Révoquer")
                                    }
                                }
                            }
                            HStack {
                                Button { createShare() } label: {
                                    Label("Créer un lien de partage", systemImage: "square.and.arrow.up.on.square")
                                }
                                if let shareNotice {
                                    Text(shareNotice).font(.caption).foregroundStyle(.green)
                                }
                            }
                        }
                    }
                }

                // Credits & royalty splits (editable)
                if let serverId = track.int("id") {
                    let credits = model.store.trackCredits().filter { $0.trackId == serverId }
                    let splitTotal = credits.compactMap(\.splitPercent).reduce(0, +)
                    GroupBox {
                        VStack(alignment: .leading, spacing: 6) {
                            HStack {
                                Text("Crédits & splits").font(.headline)
                                Spacer()
                                Button { showingCredits = true } label: {
                                    Label("Gérer", systemImage: "slider.horizontal.3")
                                }
                                .buttonStyle(.bordered)
                            }
                            if credits.isEmpty {
                                Text("Aucun crédit. Ajoute les contributeurs et leur répartition de droits.")
                                    .font(.caption).foregroundStyle(.secondary)
                                    .frame(maxWidth: .infinity, alignment: .leading)
                            } else {
                                ForEach(credits) { credit in
                                    HStack {
                                        Image(systemName: "music.mic").foregroundStyle(.tint)
                                        VStack(alignment: .leading, spacing: 1) {
                                            Text(credit.creditName ?? "—").fontWeight(.medium)
                                            if let role = credit.role { Text(role).font(.caption2).foregroundStyle(.secondary) }
                                        }
                                        Spacer()
                                        if let s = credit.splitPercent {
                                            Text("\(s.formatted()) %").monospacedDigit().foregroundStyle(.secondary)
                                        }
                                    }
                                }
                                Divider()
                                HStack {
                                    Text("Total des splits").font(.caption)
                                    Spacer()
                                    Text("\(splitTotal.formatted()) %")
                                        .font(.caption).monospacedDigit()
                                        .foregroundStyle(abs(splitTotal - 100) < 0.01 ? .green : .orange)
                                }
                            }
                        }
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
        .sheet(isPresented: $showingCredits) {
            TrackCreditsEditorSheet(trackServerId: track.int("id") ?? 0, trackTitle: track.title)
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
    @Environment(AppModel.self) private var model
    var defaultProjectServerId: Int? = nil
    let onCreate: ([String: Any]) -> Void

    @State private var title = ""
    @State private var projectServerId: Int?
    @State private var sessionServerId: Int?
    @State private var trackNumber = 1
    @State private var bpm = 0
    @State private var key = ""

    private var projects: [Project] { model.store.projects().filter { $0.serverId != nil } }

    var body: some View {
        StudioFormSheet(
            title: "Nouvelle track", confirmLabel: "Créer",
            confirmDisabled: title.trimmingCharacters(in: .whitespaces).isEmpty || projectServerId == nil,
            height: 400,
            onConfirm: {
                var payload: [String: Any] = [
                    "title": title,
                    "project_id": projectServerId ?? 0,
                    "track_number": trackNumber,
                    "status": "recording",
                ]
                if bpm > 0 { payload["bpm"] = bpm }
                if !key.isEmpty { payload["key"] = key }
                if let sessionServerId { payload["session_id"] = sessionServerId }
                onCreate(payload)
            }
        ) {
            TextField("Titre", text: $title)
            Picker("Projet", selection: $projectServerId) {
                Text("Choisir…").tag(nil as Int?)
                ForEach(projects) { project in
                    Text(project.name).tag(project.serverId)
                }
            }
            if let pid = projectServerId {
                Picker("Session (optionnel)", selection: $sessionServerId) {
                    Text("Aucune").tag(nil as Int?)
                    ForEach(model.store.sessions(projectServerId: pid)) { s in
                        Text(s.title).tag(s.serverId)
                    }
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
        .onAppear { projectServerId = projectServerId ?? defaultProjectServerId }
    }
}

// MARK: - Credits & royalty splits editor

struct TrackCreditsEditorSheet: View {
    @Environment(\.dismiss) private var dismiss
    @Environment(AppModel.self) private var model
    let trackServerId: Int
    let trackTitle: String

    // New-credit form
    @State private var newTalentId: Int?
    @State private var newRole = "producer"
    @State private var newName = ""
    @State private var newSplit = 0.0

    private let roles = ["producer", "engineer", "mixing", "mastering", "vocals", "guitar", "bass", "drums", "keys", "songwriter", "featuring", "other"]

    private var credits: [TrackCredit] {
        _ = model.dataVersion
        return model.store.trackCredits().filter { $0.trackId == trackServerId }
    }
    private var talents: [Talent] { model.store.talents().filter { $0.int("id") != nil } }
    private var splitTotal: Double { credits.compactMap(\.splitPercent).reduce(0, +) }

    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            Text("Crédits & splits — \(trackTitle)").font(.title3).bold().padding()
            Form {
                Section("Contributeurs") {
                    if credits.isEmpty {
                        Text("Aucun crédit pour l'instant.").font(.caption).foregroundStyle(.secondary)
                    }
                    ForEach(credits) { credit in
                        HStack {
                            VStack(alignment: .leading, spacing: 1) {
                                Text(credit.creditName ?? "—").fontWeight(.medium)
                                if let role = credit.role { Text(role).font(.caption2).foregroundStyle(.secondary) }
                            }
                            Spacer()
                            TextField("%", value: Binding(
                                get: { credit.splitPercent ?? 0 },
                                set: { setSplit(credit, $0) }
                            ), format: .number).frame(width: 60).multilineTextAlignment(.trailing)
                            Text("%").foregroundStyle(.secondary)
                            Button(role: .destructive) {
                                try? model.store.localDelete(table: "track_credits", uuid: credit.id)
                                Task { await model.syncNow() }
                            } label: { Image(systemName: "minus.circle") }
                            .buttonStyle(.plain)
                        }
                    }
                    HStack {
                        Text("Total").font(.caption)
                        Spacer()
                        Text("\(splitTotal.formatted()) %").font(.caption).monospacedDigit()
                            .foregroundStyle(abs(splitTotal - 100) < 0.01 ? .green : .orange)
                        if abs(splitTotal - 100) >= 0.01, !credits.isEmpty {
                            Button("Équilibrer") { equalize() }.font(.caption).buttonStyle(.borderless)
                        }
                    }
                }
                Section("Ajouter un crédit") {
                    Picker("Talent (optionnel)", selection: $newTalentId) {
                        Text("Aucun / externe").tag(nil as Int?)
                        ForEach(talents) { t in Text(t.displayName).tag(t.int("id")) }
                    }
                    .onChange(of: newTalentId) {
                        if let tid = newTalentId, newName.isEmpty,
                           let t = talents.first(where: { $0.int("id") == tid }) { newName = t.displayName }
                    }
                    TextField("Nom au générique", text: $newName, prompt: Text("Ex : Jean Dupont"))
                    Picker("Rôle", selection: $newRole) {
                        ForEach(roles, id: \.self) { Text($0).tag($0) }
                    }
                    HStack {
                        Text("Split")
                        Spacer()
                        TextField("%", value: $newSplit, format: .number).frame(width: 60).multilineTextAlignment(.trailing)
                        Text("%").foregroundStyle(.secondary)
                    }
                    Button {
                        addCredit()
                    } label: { Label("Ajouter", systemImage: "plus.circle") }
                    .disabled(newName.trimmingCharacters(in: .whitespaces).isEmpty)
                }
            }
            .formStyle(.grouped)

            HStack {
                Spacer()
                Button("Fermer") { dismiss() }.keyboardShortcut(.escape).buttonStyle(.borderedProminent)
            }
            .padding()
        }
        .frame(width: 520, height: 560)
    }

    private func setSplit(_ credit: TrackCredit, _ value: Double) {
        try? model.store.localUpdate(table: "track_credits", uuid: credit.id,
                                     changes: ["split_percent": String(format: "%.2f", max(0, value))])
        Task { await model.syncNow() }
    }

    private func addCredit() {
        var payload: [String: Any] = [
            "track_id": trackServerId,
            "role": newRole,
            "credit_name": newName,
            "is_primary": false,
        ]
        if let newTalentId { payload["musician_id"] = newTalentId }
        if newSplit > 0 { payload["split_percent"] = String(format: "%.2f", newSplit) }
        _ = try? model.store.localInsert(table: "track_credits", payload: payload)
        newName = ""; newSplit = 0; newTalentId = nil; newRole = "producer"
        Task { await model.syncNow() }
    }

    /// Distribute 100% evenly across all current credits.
    private func equalize() {
        let list = credits
        guard !list.isEmpty else { return }
        let each = (100.0 / Double(list.count) * 100).rounded() / 100
        for credit in list {
            try? model.store.localUpdate(table: "track_credits", uuid: credit.id,
                                         changes: ["split_percent": String(format: "%.2f", each)])
        }
        Task { await model.syncNow() }
    }
}
