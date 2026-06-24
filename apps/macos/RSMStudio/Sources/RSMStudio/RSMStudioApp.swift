/**
 * RSM Studio — native macOS app entry point (Phase M1).
 */
import SwiftUI
import AppKit
import RSMCore

@main
struct RSMStudioApp: App {
    @State private var model = AppModel()

    init() {
        // Required when launched via `swift run` (no app bundle yet)
        NSApplication.shared.setActivationPolicy(.regular)
        NSApplication.shared.activate(ignoringOtherApps: true)
    }

    var body: some Scene {
        WindowGroup("RSM Studio", id: "main") {
            ContentView()
                .environment(model)
                .frame(minWidth: 900, minHeight: 560)
                .task { await model.start() }
        }
        .commands {
            CommandGroup(after: .newItem) {
                Button("Synchroniser maintenant") {
                    Task { await model.syncNow() }
                }
                .keyboardShortcut("r", modifiers: [.command, .shift])

                Button("Assistant en panneau latéral") {
                    model.chatPanelOpen.toggle()
                }
                .keyboardShortcut("a", modifiers: [.command, .shift])
            }
        }

        // Assistant in its own window (same ChatStore → same conversation)
        Window("Assistant RSM", id: "assistant") {
            ChatView()
                .environment(model)
                .frame(minWidth: 380, minHeight: 460)
        }
        .defaultSize(width: 420, height: 600)
        .keyboardShortcut("a", modifiers: [.command, .option])

        // Audio player in its own window (same engine → same playback)
        Window("Lecteur RSM", id: "player") {
            AudioPlayerView(compact: true)
                .environment(model)
                .frame(minWidth: 420, minHeight: 480)
        }
        .defaultSize(width: 460, height: 640)

        // S2 — Studio timer + glanceable status in the macOS menu bar
        MenuBarExtra {
            MenuBarContent()
                .environment(model)
        } label: {
            // ⚠️ Ne JAMAIS mettre de Text(_, style: .timer) ici : le label d'un
            // MenuBarExtra est converti en image du status item à chaque frame
            // pour les vues auto-animées → setImage/_adjustLength en boucle sur
            // la run loop principale → freeze total + mémoire qui explose
            // (12,5 Go constatés). On tique manuellement à 1 Hz à la place.
            MenuBarTimerLabel()
                .environment(model)
        }
        .menuBarExtraStyle(.menu)
    }
}

/// Menu bar label: waveform icon, or record icon + elapsed time while the
/// timer runs. Updates once per second via an explicit ticker (see warning
/// above — auto-animated Text is forbidden in a MenuBarExtra label).
struct MenuBarTimerLabel: View {
    @Environment(AppModel.self) private var model
    @State private var now = Date()
    private let ticker = Timer.publish(every: 1, on: .main, in: .common).autoconnect()

    var body: some View {
        Group {
            if let startedAt = model.timerStartedAt {
                HStack(spacing: 3) {
                    Image(systemName: "record.circle.fill")
                    Text(elapsedString(now.timeIntervalSince(startedAt))).monospacedDigit()
                }
            } else {
                Image(systemName: "waveform")
            }
        }
        .onReceive(ticker) { now = $0 }
    }

    private func elapsedString(_ seconds: TimeInterval) -> String {
        let s = max(0, Int(seconds))
        return s >= 3600
            ? String(format: "%d:%02d:%02d", s / 3600, (s % 3600) / 60, s % 60)
            : String(format: "%02d:%02d", s / 60, s % 60)
    }
}

// MARK: - Menu bar content

struct MenuBarContent: View {
    @Environment(AppModel.self) private var model
    @Environment(\.openWindow) private var openWindow

    private var nextSession: StudioSession? {
        model.store.studioSessions()
            .filter { ($0.startTime ?? .distantPast) > Date() && $0.status == "scheduled" }
            .min { ($0.startTime ?? .distantFuture) < ($1.startTime ?? .distantFuture) }
    }

    /// Today's entries — for the glanceable summary.
    private var todayEntries: [TimeEntry] {
        let calendar = Calendar.current
        return model.store.timeEntries()
            .filter { $0.startTime.map { calendar.isDateInToday($0) } ?? false }
    }

    /// Human label of what the running timer tracks (type — track/projet).
    private var runningLabel: String {
        var parts: [String] = []
        if let tid = model.timerTaskTypeId,
           let type = model.store.taskTypes().first(where: { $0.serverId == tid }) {
            parts.append(type.name)
        }
        if let trackId = model.timerTrackId,
           let track = model.store.allTracks().first(where: { $0.int("id") == trackId }) {
            parts.append(track.title)
        } else if let pid = model.timerProjectId,
                  let project = model.store.projects().first(where: { $0.serverId == pid }) {
            parts.append(project.name)
        }
        return parts.isEmpty ? "Temps en cours" : parts.joined(separator: " — ")
    }

    private func durationLabel(_ minutes: Int) -> String {
        String(format: "%dh%02d", minutes / 60, minutes % 60)
    }

    var body: some View {
        // ── Main window first: the menu must always lead back to the app
        Button("Afficher RSM Studio") {
            NSApp.activate(ignoringOtherApps: true)
            if let window = NSApp.windows.first(where: { $0.title == "RSM Studio" && $0.canBecomeKey }) {
                window.makeKeyAndOrderFront(nil)
            } else {
                openWindow(id: "main") // window was closed — recreate it
            }
        }
        Button("Ouvrir l'assistant") {
            openWindow(id: "assistant")
            NSApp.activate(ignoringOtherApps: true)
        }

        Divider()

        // ── Timer: live state, billable toggle, stop — or quick start
        if let startedAt = model.timerStartedAt {
            let minutes = max(0, Int(Date().timeIntervalSince(startedAt) / 60))
            Text("⏱ \(runningLabel) — \(durationLabel(minutes))")
            Button(model.timerBillable
                   ? "💲 Facturable — rendre non facturable"
                   : "💲 Non facturable — rendre facturable") {
                model.timerBillable.toggle()
            }
            Button("⏹ Arrêter et enregistrer") {
                model.stopTimer()
            }
        } else {
            let taskTypes = model.store.taskTypes()
            if taskTypes.isEmpty {
                Button("▶️ Démarrer le timer") {
                    model.startTimer(taskTypeId: nil)
                }
            } else {
                Menu("▶️ Démarrer le timer") {
                    ForEach(taskTypes) { taskType in
                        Button(taskType.category == "billable" ? taskType.name : "\(taskType.name) (non facturable)") {
                            model.timerBillable = taskType.category == "billable"
                            model.startTimer(taskTypeId: taskType.int("id"))
                        }
                    }
                    Divider()
                    Button("Sans type de tâche") {
                        model.timerBillable = true
                        model.startTimer(taskTypeId: nil)
                    }
                }
            }
        }

        // ── Today at a glance
        if !todayEntries.isEmpty {
            let total = todayEntries.compactMap(\.durationMinutes).reduce(0, +)
            let billable = todayEntries.filter(\.billable).reduce(0.0) { $0 + $1.amount }
            let unbilled = todayEntries.filter { $0.billable && $0.invoiceId == nil && $0.endTime != nil }.count
            Divider()
            Text("Aujourd'hui : \(durationLabel(total)) · \(billable.formatted(.currency(code: "EUR").locale(Locale(identifier: "fr_FR")).precision(.fractionLength(0)))) facturable")
            if unbilled > 0 {
                Text("\(unbilled) entrée\(unbilled > 1 ? "s" : "") pas encore facturée\(unbilled > 1 ? "s" : "")")
            }
        }

        if let next = nextSession, let start = next.startTime {
            Divider()
            Text("Prochaine session : \(next.title) — \(start.formatted(.dateTime.weekday(.wide).hour().minute()))")
        }

        Divider()

        // ── Sync state + action
        switch model.phase {
        case .offline: Text("⚠️ Hors ligne — \(model.pendingCount) modif. en attente")
        case .error: Text("⚠️ Erreur de synchronisation")
        default: Text("Synchronisé ✓")
        }
        Button("Synchroniser maintenant") {
            Task { await model.syncNow() }
        }

        Divider()
        Button("Quitter RSM Studio") {
            NSApp.terminate(nil)
        }
    }
}

// MARK: - App model (main-actor state hub)

@Observable @MainActor
final class AppModel {
    var phase: SyncPhase = .idle
    var pendingCount = 0
    /// Incremented after every applied sync so list views re-query the store.
    var dataVersion = 0

    /// Assistant: shared conversation + right-panel visibility
    let chat = ChatStore()
    var chatPanelOpen = false

    // MARK: - Persistent audio player (multi-presentation like the assistant)

    enum PlayerMode { case hidden, bar, panel, window }

    /// Shared engine so playback survives navigation and presentation changes.
    let audioEngine = AudioEngine()
    var playerMode: PlayerMode = .hidden
    /// sync_uuid of the track currently loaded in the player.
    var playerTrackUuid: String?
    var playerWaveform: [Float] = []
    var playerLoadingWaveform = false
    var playerSourceLabel = ""
    /// Running waveform generation — cancelled before starting a new one so
    /// rapid track switches never decode several files concurrently.
    private var waveformTask: Task<Void, Never>?

    var playerTrack: Track? {
        guard let uuid = playerTrackUuid else { return nil }
        return model_allTracksByUuid[uuid]
    }
    private var model_allTracksByUuid: [String: Track] {
        Dictionary(store.allTracks().map { ($0.id, $0) }, uniquingKeysWith: { a, _ in a })
    }

    /// Open the player for a track (default: right-side panel).
    func openPlayer(track: Track, mode: PlayerMode = .panel) {
        let isSameTrack = playerTrackUuid == track.id
        playerTrackUuid = track.id
        playerMode = mode
        if !isSameTrack {
            loadPlayerAudio(for: track)
        }
    }

    func loadPlayerAudio(for track: Track, urlOverride: URL? = nil, label: String? = nil) {
        let candidates: [(String, String?)] = [
            ("Master", track.string("master_url")),
            ("Mix final", track.string("final_mix_url")),
            ("Rough mix", track.string("rough_mix_url")),
            ("Démo", track.string("demo_url")),
            ("Fichier", track.string("file_url")),
        ]
        let url: URL?
        if let urlOverride {
            url = urlOverride
            playerSourceLabel = label ?? urlOverride.lastPathComponent
        } else if let first = candidates.first(where: { $0.1 != nil }) {
            url = URL(string: first.1!)
            playerSourceLabel = first.0
        } else {
            url = nil
            playerSourceLabel = "Aucun fichier"
        }
        guard let url else { playerWaveform = []; return }
        audioEngine.load(url: url)
        playerLoadingWaveform = true
        playerWaveform = []
        waveformTask?.cancel()
        waveformTask = Task {
            let samples = await WaveformGenerator.generate(from: url, buckets: 400)
            guard !Task.isCancelled else { return }
            await MainActor.run {
                self.playerWaveform = samples
                self.playerLoadingWaveform = false
            }
        }
    }

    func closePlayer() {
        waveformTask?.cancel()
        waveformTask = nil
        audioEngine.stop()
        playerMode = .hidden
        playerTrackUuid = nil
        playerWaveform = []
    }

    /// Cross-entity navigation: which section is shown, and (optionally)
    /// which entity each section should select on next display.
    var currentSection: SidebarItem? = .assistant
    var focusedEntity: [SidebarItem: String] = [:]

    /// Jump to an entity anywhere in the app (e.g. project → its client).
    func open(_ section: SidebarItem, entity uuid: String? = nil) {
        if let uuid { focusedEntity[section] = uuid }
        currentSection = section
    }

    // MARK: - Time-tracking timer (Clockify-style)

    var timerStartedAt: Date?
    var timerTaskTypeId: Int?        // server id of the chosen task type
    var timerTrackId: Int?           // server id of the track being worked on
    var timerProjectId: Int?         // derived from the track
    var timerSessionId: Int?         // optional server id of the session
    var timerDescription = ""
    /// Clockify-style $: whether the entry being tracked will be billable.
    /// Toggleable before AND during the run; defaults from the task type.
    var timerBillable = true
    var timerError: String?

    var isTimerRunning: Bool { timerStartedAt != nil }

    /// Resolve a track's parent project id (tracks carry project_id).
    private func projectId(forTrack trackServerId: Int) -> Int? {
        store.allTracks().first { $0.int("id") == trackServerId }?.projectId
    }

    func startTimer(taskTypeId: Int? = nil, trackId: Int? = nil, sessionId: Int? = nil, description: String = "") {
        timerError = nil
        timerStartedAt = Date()
        timerTaskTypeId = taskTypeId ?? store.taskTypes().first?.serverId
        timerTrackId = trackId
        timerProjectId = trackId.flatMap { projectId(forTrack: $0) }
        timerSessionId = sessionId
        timerDescription = description
    }

    /// Stop the running timer and record an offline-first time entry.
    /// `time_entries` requires a non-null task_type_id (FK) and
    /// hourly_rate_snapshot — both are filled here, otherwise the push silently
    /// fails on the server and the data never leaves the device.
    func stopTimer() {
        guard let startedAt = timerStartedAt else { return }
        recordEntry(start: startedAt, end: Date())
        timerStartedAt = nil
    }

    /// Create a default set of task types when the studio has none (so the
    /// timer's NOT NULL task_type_id can always be satisfied).
    func seedDefaultTaskTypes() {
        guard store.taskTypes().isEmpty else { return }
        let defaults: [(String, String, String)] = [
            ("Enregistrement", "80.00", "#3B82F6"),
            ("Mixage", "70.00", "#8B5CF6"),
            ("Mastering", "90.00", "#EC4899"),
            ("Édition", "55.00", "#F59E0B"),
            ("Pause", "0.00", "#9CA3AF"),
        ]
        for (index, def) in defaults.enumerated() {
            _ = try? store.localInsert(table: "task_types", payload: [
                "name": def.0,
                "hourly_rate": def.1,
                "color": def.2,
                "category": def.0 == "Pause" ? "non-billable" : "billable",
                "sort_order": index,
                "is_active": true,
            ])
        }
        Task { await syncNow() }
    }

    /// Add a time entry (used by the running timer and by manual entry).
    @discardableResult
    func recordEntry(start: Date, end: Date, taskTypeId: Int? = nil,
                     trackId: Int? = nil, sessionId: Int? = nil, description: String? = nil) -> Bool {
        let types = store.taskTypes()
        let resolvedTaskTypeId = taskTypeId ?? timerTaskTypeId ?? types.first?.serverId
        guard let taskTypeServerId = resolvedTaskTypeId,
              let taskType = types.first(where: { $0.serverId == taskTypeServerId }) ?? types.first else {
            timerError = "Crée d'abord un type de tâche."
            return false
        }

        // Server CHECK constraint: a time entry MUST link to a track, session or
        // project. We track on a TRACK (which carries its project).
        let linkTrack = trackId ?? timerTrackId
        let linkSession = sessionId ?? timerSessionId
        guard linkTrack != nil || linkSession != nil else {
            timerError = "Choisis une track pour suivre ce temps."
            return false
        }
        let linkProject = linkTrack.flatMap { projectId(forTrack: $0) } ?? timerProjectId

        let minutes = max(1, Int(end.timeIntervalSince(start) / 60))
        let iso = ISO8601DateFormatter()
        var payload: [String: Any] = [
            "task_type_id": taskType.serverId as Any,
            "start_time": iso.string(from: start),
            "end_time": iso.string(from: end),
            "duration_minutes": minutes,
            "hourly_rate_snapshot": taskType.hourlyRate, // required NOT NULL
            "billable": timerBillable, // Clockify-style $ choice
            "created_by": config.userId,
        ]
        // Server CHECK is EXCLUSIVE: exactly ONE of track_id / session_id /
        // project_id may be non-null. Send only the most specific link —
        // sending track_id AND project_id violates the constraint and the
        // push fails. The project is derived from the track when displaying.
        if let linkTrack {
            payload["track_id"] = linkTrack
        } else if let linkSession {
            payload["session_id"] = linkSession
        } else if let linkProject {
            payload["project_id"] = linkProject
        }
        let note = description ?? (timerDescription.isEmpty ? nil : timerDescription)
        if let note { payload["notes"] = note }

        _ = try? store.localInsert(table: "time_entries", payload: payload)
        timerTaskTypeId = nil
        timerTrackId = nil
        timerProjectId = nil
        timerSessionId = nil
        timerDescription = ""
        timerBillable = true
        timerError = nil
        Task { await syncNow() }
        return true
    }

    var config: ServerConfig {
        didSet { persistConfig(); Task { await rebuildEngine() } }
    }

    let store: LocalStore
    private(set) var engine: SyncEngine?
    private var eventsListener: SyncEventsListener?

    init() {
        if let data = UserDefaults.standard.data(forKey: "serverConfig"),
           let saved = try? JSONDecoder().decode(ServerConfig.self, from: data) {
            config = saved
        } else {
            config = ServerConfig()
        }
        do {
            store = try LocalStore()
        } catch {
            fatalError("Impossible d'ouvrir la base locale: \(error)")
        }
    }

    func start() async {
        if config.isAccountMode {
            AuthService.restoreCookies(for: config.baseURL)
        }
        await rebuildEngine()
        await syncNow()
        await engine?.startPeriodicSync(every: 60)
    }

    func syncNow() async {
        await engine?.sync()
        dataVersion += 1
    }

    func resetLocalData() async {
        try? store.reset()
        dataVersion += 1
        await syncNow()
    }

    private func rebuildEngine() async {
        await engine?.stopPeriodicSync()
        await eventsListener?.stop()
        let api = APIClient(config: config)
        engine = SyncEngine(store: store, api: api) { [weak self] phase, pending in
            Task { @MainActor in
                guard let self else { return }
                self.phase = phase
                self.pendingCount = pending
                if phase == .idle {
                    self.dataVersion += 1
                    NativeNotifier.deliverNew(from: self.store) // macOS banners (S1)
                }
            }
        }
        await engine?.startPeriodicSync(every: 60)

        // Realtime: any tenant write (web or another Mac) triggers a sync here
        let currentEngine = engine
        eventsListener = SyncEventsListener(config: config) {
            Task { await currentEngine?.sync() }
        }
        await eventsListener?.start()

        // Refresh org members cache (staff assignment)
        let store = self.store
        Task.detached {
            if let members = try? await api.fetchMembers() {
                store.cacheMembers(members)
            }
        }
    }

    private func persistConfig() {
        if let data = try? JSONEncoder().encode(config) {
            UserDefaults.standard.set(data, forKey: "serverConfig")
        }
    }
}
