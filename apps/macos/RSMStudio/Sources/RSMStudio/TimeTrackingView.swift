import SwiftUI
import RSMCore

/// Clockify-style time tracking: a sticky tracker bar (description, project,
/// task type, live timer, Start/Stop) over entries grouped by day with totals.
struct TimeTrackingView: View {
    @Environment(AppModel.self) private var model

    @State private var description = ""
    @State private var projectServerId: Int?
    @State private var trackServerId: Int?
    @State private var taskTypeServerId: Int?
    @State private var showingTrackCreate = false
    @State private var now = Date() // drives the live timer label
    @State private var isInvoicing = false
    @State private var invoiceMessage: String?
    @State private var editingEntry: TimeEntry?
    @State private var showingEntryEdit = false
    private let ticker = Timer.publish(every: 1, on: .main, in: .common).autoconnect()

    private var entries: [TimeEntry] {
        _ = model.dataVersion
        return model.store.timeEntries()
            .sorted { ($0.startTime ?? .distantPast) > ($1.startTime ?? .distantPast) }
    }
    private var taskTypes: [TaskType] { model.store.taskTypes() }
    private var projects: [Project] { model.store.projects().filter { $0.serverId != nil } }
    private var tracks: [Track] { model.store.allTracks().filter { $0.int("id") != nil } }
    /// Tracks of the selected project (the second-level picker).
    private var projectTracks: [Track] {
        guard let pid = projectServerId else { return [] }
        return tracks.filter { $0.projectId == pid }
    }

    private var taskTypesById: [Int: TaskType] {
        Dictionary(taskTypes.compactMap { t in t.serverId.map { ($0, t) } }, uniquingKeysWith: { a, _ in a })
    }
    private var projectsById: [Int: Project] {
        Dictionary(projects.compactMap { p in p.serverId.map { ($0, p) } }, uniquingKeysWith: { a, _ in a })
    }
    private var tracksById: [Int: Track] {
        Dictionary(tracks.compactMap { t in t.int("id").map { ($0, t) } }, uniquingKeysWith: { a, _ in a })
    }

    private func trackLabel(_ track: Track) -> String {
        if let pid = track.projectId, let p = projectsById[pid] { return "\(p.name) — \(track.title)" }
        return track.title
    }

    var body: some View {
        VStack(spacing: 0) {
            trackerBar
            Divider()
            content
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .top)
        .navigationTitle("Temps")
        .toolbar {
            // Bill the selected project's unbilled billable time (draft invoice)
            ToolbarItem {
                Button {
                    if let pid = projectServerId { Task { await invoiceProject(pid) } }
                } label: {
                    if isInvoicing {
                        ProgressView().controlSize(.small)
                    } else {
                        Label("Facturer", systemImage: "doc.text.badge.plus")
                    }
                }
                .disabled(isInvoicing || unbilledEntries.isEmpty)
                .help(unbilledEntries.isEmpty
                      ? "Rien à facturer sur ce projet"
                      : "Facturer \(unbilledEntries.count) entrée\(unbilledEntries.count > 1 ? "s" : "") (\(unbilledAmount.formatted(.currency(code: "EUR").locale(Locale(identifier: "fr_FR")).precision(.fractionLength(0)))) HT)")
            }
        }
        .onReceive(ticker) { now = $0 }
        .onAppear {
            taskTypeServerId = taskTypeServerId
                ?? taskTypes.first(where: { $0.category == "billable" })?.serverId
                ?? taskTypes.first?.serverId
            projectServerId = projectServerId ?? projects.first?.serverId
            trackServerId = trackServerId ?? projectTracks.first?.int("id")
            if !running {
                model.timerBillable = (taskTypeServerId.flatMap { taskTypesById[$0] }?.category ?? "billable") == "billable"
            }
        }
        // Reset track when project changes; auto-pick the project's first track.
        .onChange(of: projectServerId) {
            if let tid = trackServerId, projectTracks.contains(where: { $0.int("id") == tid }) { return }
            trackServerId = projectTracks.first?.int("id")
        }
        // The $ default follows the task type (Pause → non billable) until started.
        .onChange(of: taskTypeServerId) {
            if !running {
                model.timerBillable = (taskTypeServerId.flatMap { taskTypesById[$0] }?.category ?? "billable") == "billable"
            }
        }
        .modalCard(isPresented: $showingEntryEdit) {
            if let entry = editingEntry {
                TimeEntryEditSheet(entry: entry) { changes in
                    try? model.store.localUpdate(table: "time_entries", uuid: entry.id, changes: changes)
                    Task { await model.syncNow() }
                }
            }
        }
        .modalCard(isPresented: $showingTrackCreate) {
            TrackCreateSheet(defaultProjectServerId: projectServerId) { payload in
                _ = try? model.store.localInsert(table: "tracks", payload: payload)
                Task {
                    await model.syncNow()
                    trackServerId = model.store.allTracks().first { $0.title == (payload["title"] as? String) }?.int("id")
                }
            }
        }
    }

    @ViewBuilder
    private var content: some View {
        Group {
            if taskTypes.isEmpty {
                ContentUnavailableView("Pas encore de type de tâche",
                                       systemImage: "timer",
                                       description: Text("Crée un type de tâche (avec son tarif) pour pouvoir chronométrer."))
                Button("Créer les types par défaut") { model.seedDefaultTaskTypes() }
                    .buttonStyle(.borderedProminent)
                    .padding(.bottom)
            } else if entries.isEmpty {
                ContentUnavailableView("Aucun temps suivi",
                                       systemImage: "timer",
                                       description: Text("Lance le chrono ci-dessus pour enregistrer ton temps."))
            } else {
                entriesList
            }
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
    }

    // MARK: Tracker bar

    private var running: Bool { model.timerStartedAt != nil }
    private var canStart: Bool { !taskTypes.isEmpty && trackServerId != nil }

    private var trackerBar: some View {
        VStack(spacing: 4) {
            HStack(spacing: 10) {
                TextField("Sur quoi travailles-tu ?", text: $description)
                    .textFieldStyle(.plain)
                    .font(.body)
                    .onSubmit { if canStart || running { toggle() } }

                // Step 1: project
                Picker("", selection: $projectServerId) {
                    Text("Projet…").tag(nil as Int?)
                    ForEach(projects) { p in Text(p.name).tag(p.serverId) }
                }
                .frame(maxWidth: 150)
                .help("Projet")

                // Step 2: track within that project (or create one)
                if projectServerId == nil {
                    Text("→ track").font(.caption).foregroundStyle(.tertiary)
                } else if projectTracks.isEmpty {
                    Button {
                        showingTrackCreate = true
                    } label: {
                        Label("Créer une track", systemImage: "plus")
                    }
                    .help("Ce projet n'a pas encore de track")
                } else {
                    Picker("", selection: $trackServerId) {
                        Text("Track…").tag(nil as Int?)
                        ForEach(projectTracks) { t in Text(t.title).tag(t.int("id")) }
                    }
                    .frame(maxWidth: 150)
                    .help("Track travaillée")
                    Button {
                        showingTrackCreate = true
                    } label: { Image(systemName: "plus") }
                    .help("Nouvelle track dans ce projet")
                }

                Picker("", selection: $taskTypeServerId) {
                    ForEach(taskTypes) { t in Text(t.name).tag(t.serverId) }
                }
                .frame(maxWidth: 130)
                .help("Type de tâche (porte le tarif)")
                .disabled(taskTypes.isEmpty)

                if running, let start = model.timerStartedAt {
                    Text(timerString(now.timeIntervalSince(start)))
                        .font(.title3.monospacedDigit()).foregroundStyle(.red)
                        .frame(minWidth: 76)
                }

                VStack(spacing: 3) {
                    Button(action: toggle) {
                        Image(systemName: running ? "stop.fill" : "play.fill")
                            .font(.title3)
                            .foregroundStyle(.white)
                            .frame(width: 38, height: 38)
                            .background(Circle().fill(running ? Color.red : (canStart ? Color.green : Color.gray)))
                            .contentShape(Circle())
                    }
                    .buttonStyle(.plain)
                    .disabled(!running && !canStart)
                    .help(running ? "Arrêter" : "Démarrer")

                    // Clockify-style $ toggle: will the (next or running) entry
                    // be billable? Green = yes, gray = no. Click to flip.
                    Button {
                        model.timerBillable.toggle()
                    } label: {
                        Image(systemName: "dollarsign.circle.fill")
                            .font(.body)
                            .foregroundStyle(model.timerBillable ? Color.green : Color.gray.opacity(0.45))
                    }
                    .buttonStyle(.plain)
                    .help(model.timerBillable
                          ? "Temps facturable — clique pour le rendre non facturable"
                          : "Temps non facturable — clique pour le rendre facturable")
                }
            }
            if let invoiceMessage {
                Text(invoiceMessage).font(.caption)
                    .foregroundStyle(invoiceMessage.hasPrefix("Facture ") ? .green : .orange)
                    .frame(maxWidth: .infinity, alignment: .leading)
            }
            if let error = model.timerError {
                Text(error).font(.caption).foregroundStyle(.orange)
                    .frame(maxWidth: .infinity, alignment: .leading)
            } else if !running && projectServerId == nil {
                Text("Choisis un projet, puis une track, pour démarrer le chrono.")
                    .font(.caption).foregroundStyle(.secondary)
                    .frame(maxWidth: .infinity, alignment: .leading)
            } else if !running && trackServerId == nil {
                Text("Choisis ou crée une track de ce projet.")
                    .font(.caption).foregroundStyle(.secondary)
                    .frame(maxWidth: .infinity, alignment: .leading)
            }
        }
        .padding(12)
        .background(.bar)
    }

    private func toggle() {
        if running {
            model.stopTimer()
            description = ""
        } else {
            model.startTimer(taskTypeId: taskTypeServerId, trackId: trackServerId, description: description)
        }
    }

    // MARK: Billing tracked time

    /// Finished, billable, not-yet-invoiced entries of the selected project
    /// (entries tracked on a track belong to the project through the track —
    /// the server CHECK keeps project_id null in that case).
    private var unbilledEntries: [TimeEntry] {
        guard let pid = projectServerId else { return [] }
        return entries.filter { e in
            e.invoiceId == nil && e.endTime != nil && e.billable
                && (e.projectId ?? e.trackId.flatMap { tracksById[$0]?.projectId }) == pid
        }
    }
    private var unbilledAmount: Double { unbilledEntries.reduce(0) { $0 + $1.amount } }

    /// Online-only: the server creates the draft invoice (FAC-… numbering)
    /// and marks the entries; the pull brings everything back.
    private func invoiceProject(_ projectServerId: Int) async {
        guard let clientId = projectsById[projectServerId]?.clientId else {
            invoiceMessage = "Ce projet n'a pas de client associé — ajoute-le d'abord."
            return
        }
        isInvoicing = true
        invoiceMessage = nil
        defer { isInvoicing = false }
        do {
            let api = APIClient(config: model.config)
            let result = try await api.invoiceFromTimeEntries(
                uuids: unbilledEntries.map(\.id),
                clientServerId: clientId)
            await model.syncNow() // pulls the invoice + entries now marked invoice_id
            invoiceMessage = "Facture \(result.invoiceNumber) créée (\(result.total) € TTC, \(result.itemCount) ligne\(result.itemCount > 1 ? "s" : ""))."
        } catch {
            invoiceMessage = "Facturation impossible : \(error.localizedDescription)"
        }
    }

    // MARK: Entries grouped by day

    private var groupedByDay: [(day: Date, label: String, total: Int, billable: Double, items: [TimeEntry])] {
        let calendar = Calendar.current
        let fmt = DateFormatter(); fmt.locale = Locale(identifier: "fr_FR"); fmt.dateFormat = "EEEE d MMMM"
        var groups: [Date: [TimeEntry]] = [:]
        for entry in entries {
            let day = calendar.startOfDay(for: entry.startTime ?? .distantPast)
            groups[day, default: []].append(entry)
        }
        return groups.keys.sorted(by: >).map { day in
            let items = groups[day]!
            let total = items.compactMap(\.durationMinutes).reduce(0, +)
            // Only $-flagged entries count toward the billable day total
            let billable = items.filter(\.billable).reduce(0) { $0 + $1.amount }
            let label = calendar.isDateInToday(day) ? "Aujourd'hui"
                      : calendar.isDateInYesterday(day) ? "Hier"
                      : fmt.string(from: day).capitalized
            return (day, label, total, billable, items)
        }
    }

    private var entriesList: some View {
        List {
            ForEach(groupedByDay, id: \.day) { group in
                Section {
                    ForEach(group.items) { entry in
                        TimeEntryRow(entry: entry,
                                     taskType: entry.taskTypeId.flatMap { taskTypesById[$0] },
                                     // project_id is null when the entry links a track
                                     // (exclusive server CHECK) → resolve via the track.
                                     project: (entry.projectId ?? entry.trackId.flatMap { tracksById[$0]?.projectId })
                                         .flatMap { projectsById[$0] },
                                     // One-click billable flip — locked once invoiced
                                     onToggleBillable: entry.invoiceId != nil ? nil : {
                                         try? model.store.localUpdate(table: "time_entries",
                                                                      uuid: entry.id,
                                                                      changes: ["billable": !entry.billable])
                                         Task { await model.syncNow() }
                                     })
                            .contentShape(Rectangle())
                            .onTapGesture {
                                guard entry.invoiceId == nil else {
                                    invoiceMessage = "Cette entrée est déjà facturée — elle n'est plus modifiable."
                                    return
                                }
                                editingEntry = entry
                                showingEntryEdit = true
                            }
                            .contextMenu {
                                if entry.invoiceId == nil {
                                    Button("Modifier") {
                                        editingEntry = entry
                                        showingEntryEdit = true
                                    }
                                    Button("Supprimer", role: .destructive) {
                                        try? model.store.localDelete(table: "time_entries", uuid: entry.id)
                                        Task { await model.syncNow() }
                                    }
                                }
                            }
                    }
                } header: {
                    HStack {
                        Text(group.label)
                        Spacer()
                        Text(durationLabel(group.total)).monospacedDigit()
                        if group.billable > 0 {
                            Text("· \(group.billable.formatted(.currency(code: "EUR").locale(Locale(identifier: "fr_FR")).precision(.fractionLength(0))))")
                                .foregroundStyle(.green)
                        }
                    }
                    .font(.callout)
                }
            }
        }
    }

    private func timerString(_ seconds: TimeInterval) -> String {
        let s = max(0, Int(seconds))
        return String(format: "%02d:%02d:%02d", s / 3600, (s % 3600) / 60, s % 60)
    }
    private func durationLabel(_ minutes: Int) -> String {
        String(format: "%dh%02d", minutes / 60, minutes % 60)
    }
}

struct TimeEntryRow: View {
    let entry: TimeEntry
    let taskType: TaskType?
    let project: Project?
    /// Click on the $ — flips the entry's billable flag (nil = locked/invoiced).
    var onToggleBillable: (() -> Void)? = nil

    var body: some View {
        HStack {
            VStack(alignment: .leading, spacing: 2) {
                Text(entry.notes?.isEmpty == false ? entry.notes! : (taskType?.name ?? "Temps"))
                    .fontWeight(.medium)
                HStack(spacing: 6) {
                    if let project { Label(project.name, systemImage: "music.note.list").labelStyle(.titleAndIcon) }
                    if let taskType { Text("· \(taskType.name)") }
                    if let start = entry.startTime, let end = entry.endTime {
                        Text("· \(start.formatted(date: .omitted, time: .shortened))–\(end.formatted(date: .omitted, time: .shortened))")
                    }
                }
                .font(.caption).foregroundStyle(.secondary)
            }
            Spacer()
            // $ toggle: green = billable, gray = not billable. Locked once invoiced.
            Button {
                onToggleBillable?()
            } label: {
                Image(systemName: "dollarsign.circle.fill")
                    .foregroundStyle(entry.billable ? Color.green : Color.gray.opacity(0.45))
            }
            .buttonStyle(.plain)
            .disabled(onToggleBillable == nil)
            .help(entry.invoiceId != nil
                  ? "Temps facturé"
                  : entry.billable ? "Facturable — clique pour exclure de la facturation"
                                   : "Non facturable — clique pour le rendre facturable")
            if entry.billable && entry.amount > 0 {
                Text(entry.amount.formatted(.currency(code: "EUR").locale(Locale(identifier: "fr_FR")).precision(.fractionLength(0))))
                    .font(.caption).foregroundStyle(.green)
            }
            Text(durationLabel(entry.durationMinutes ?? 0))
                .monospacedDigit().fontWeight(.medium)
        }
        .padding(.vertical, 2)
    }

    private func durationLabel(_ minutes: Int) -> String {
        String(format: "%dh%02d", minutes / 60, minutes % 60)
    }
}

/// Edit a (non-invoiced) time entry: description, task type, project/track
/// link, start/end. Saves through LocalStore (offline-first) — the exclusive
/// server CHECK (track XOR session XOR project) is preserved on save.
struct TimeEntryEditSheet: View {
    @Environment(\.modalDismiss) private var dismiss
    @Environment(AppModel.self) private var model
    let entry: TimeEntry
    let onSave: ([String: Any]) -> Void

    @State private var notes = ""
    @State private var taskTypeServerId: Int?
    @State private var projectServerId: Int?
    @State private var trackServerId: Int?
    @State private var start = Date()
    @State private var end = Date()
    @State private var billable = true

    private var taskTypes: [TaskType] { model.store.taskTypes() }
    private var projects: [Project] { model.store.projects().filter { $0.serverId != nil } }
    private var tracks: [Track] { model.store.allTracks().filter { $0.int("id") != nil } }
    private var projectTracks: [Track] {
        guard let pid = projectServerId else { return [] }
        return tracks.filter { $0.projectId == pid }
    }
    private var durationMinutes: Int { max(1, Int(end.timeIntervalSince(start) / 60)) }
    private var hourlyRate: Double {
        Double(taskTypes.first(where: { $0.serverId == taskTypeServerId })?.hourlyRate ?? "0") ?? 0
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            Text("Modifier l'entrée").font(.title3).bold().padding()
            Form {
                TextField("Description", text: $notes, prompt: Text("Sur quoi as-tu travaillé ?"))
                Picker("Type de tâche", selection: $taskTypeServerId) {
                    ForEach(taskTypes) { t in Text(t.name).tag(t.serverId) }
                }
                Picker("Projet", selection: $projectServerId) {
                    Text("—").tag(nil as Int?)
                    ForEach(projects) { p in Text(p.name).tag(p.serverId) }
                }
                if projectServerId != nil && !projectTracks.isEmpty {
                    Picker("Track", selection: $trackServerId) {
                        Text("— (projet entier)").tag(nil as Int?)
                        ForEach(projectTracks) { t in Text(t.title).tag(t.int("id")) }
                    }
                }
                DatePicker("Début", selection: $start)
                DatePicker("Fin", selection: $end, in: start...)
                LabeledContent("Durée") {
                    Text(String(format: "%dh%02d", durationMinutes / 60, durationMinutes % 60))
                        .monospacedDigit()
                }
                Toggle("Facturable", isOn: $billable)
                if billable {
                    LabeledContent("Montant") {
                        Text((Double(durationMinutes) / 60.0 * hourlyRate)
                            .formatted(.currency(code: "EUR").locale(Locale(identifier: "fr_FR")).precision(.fractionLength(2))))
                            .foregroundStyle(.green)
                    }
                }
            }
            .formStyle(.grouped)
            HStack {
                Spacer()
                Button("Annuler") { dismiss() }.keyboardShortcut(.escape)
                Button("Enregistrer") {
                    let iso = ISO8601DateFormatter()
                    var changes: [String: Any] = [
                        "start_time": iso.string(from: start),
                        "end_time": iso.string(from: end),
                        "duration_minutes": durationMinutes,
                        "manually_adjusted": true,
                        "billable": billable,
                        "notes": notes,
                    ]
                    if let tid = taskTypeServerId,
                       let type = taskTypes.first(where: { $0.serverId == tid }) {
                        changes["task_type_id"] = tid
                        changes["hourly_rate_snapshot"] = type.hourlyRate
                    }
                    // Exclusive server CHECK: exactly ONE of track/session/project.
                    if let trackId = trackServerId {
                        changes["track_id"] = trackId
                        changes["project_id"] = NSNull()
                        changes["session_id"] = NSNull()
                    } else if let pid = projectServerId {
                        changes["project_id"] = pid
                        changes["track_id"] = NSNull()
                        changes["session_id"] = NSNull()
                    }
                    onSave(changes)
                    dismiss()
                }
                .keyboardShortcut(.return)
                .buttonStyle(.borderedProminent)
                .disabled(end <= start || (trackServerId == nil && projectServerId == nil && entry.sessionId == nil))
            }
            .padding()
        }
        .frame(width: 460, height: 480)
        .onAppear {
            notes = entry.notes ?? ""
            taskTypeServerId = entry.taskTypeId
            trackServerId = entry.trackId
            projectServerId = entry.projectId
                ?? entry.trackId.flatMap { tid in tracks.first { $0.int("id") == tid }?.projectId }
            start = entry.startTime ?? Date()
            end = entry.endTime ?? Date()
            billable = entry.billable
        }
        // Track no longer valid when the project changes → reset to whole project
        .onChange(of: projectServerId) {
            if let tid = trackServerId, projectTracks.contains(where: { $0.int("id") == tid }) { return }
            trackServerId = nil
        }
    }
}
