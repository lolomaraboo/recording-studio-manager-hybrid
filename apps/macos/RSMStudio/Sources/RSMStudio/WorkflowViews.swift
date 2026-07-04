import SwiftUI
import AppKit
import RSMCore

// ============================================================================
// Workflow universel : Prospects (leads), Tâches, Documents.
// ============================================================================

// MARK: - Prospects (leads)

struct LeadsView: View {
    @Environment(AppModel.self) private var model
    @State private var showingCreate = false

    private var leads: [Lead] {
        _ = model.dataVersion
        return model.store.leads()
    }

    var body: some View {
        Group {
            if leads.isEmpty {
                StudioEmptyState(title: "Aucun prospect", systemImage: "person.crop.circle.badge.questionmark",
                                 message: "Les demandes de réservation avant qu'un client soit créé.")
            } else {
                List(leads) { lead in
                    StudioRow(icon: "person.crop.circle.badge.questionmark", title: lead.name,
                              subtitle: [lead.email, lead.phone, lead.source].compactMap { $0 }.joined(separator: " · ")) {
                        LeadStatusBadge(status: lead.status)
                    }
                    .contextMenu {
                        Menu("Changer le statut") {
                            ForEach(["new", "contacted", "quoted", "won", "lost"], id: \.self) { s in
                                Button(leadStatusLabel(s)) { setStatus(lead, s) }
                            }
                        }
                        Button("Convertir en client") { convert(lead) }
                        Button("Supprimer", role: .destructive) {
                            try? model.store.localDelete(table: "leads", uuid: lead.id)
                            Task { await model.syncNow() }
                        }
                    }
                }
            }
        }
        .navigationTitle("Prospects")
        .toolbar {
            ToolbarItem {
                Button { showingCreate = true } label: { Label("Nouveau prospect", systemImage: "plus") }
            }
        }
        .modalCard(isPresented: $showingCreate) {
            LeadCreateSheet { payload in
                _ = try? model.store.localInsert(table: "leads", payload: payload)
                Task { await model.syncNow() }
            }
        }
    }

    private func setStatus(_ lead: Lead, _ status: String) {
        try? model.store.localUpdate(table: "leads", uuid: lead.id, changes: ["status": status])
        Task { await model.syncNow() }
    }

    private func convert(_ lead: Lead) {
        var payload: [String: Any] = ["name": lead.name, "type": "individual"]
        if let email = lead.email { payload["email"] = email }
        if let phone = lead.phone { payload["phone"] = phone }
        _ = try? model.store.localInsert(table: "clients", payload: payload)
        try? model.store.localUpdate(table: "leads", uuid: lead.id, changes: ["status": "won"])
        Task { await model.syncNow() }
    }
}

func leadStatusLabel(_ s: String) -> String {
    switch s {
    case "contacted": "Contacté"
    case "quoted": "Devisé"
    case "won": "Gagné"
    case "lost": "Perdu"
    default: "Nouveau"
    }
}

struct LeadStatusBadge: View {
    let status: String
    var body: some View {
        let color: Color = switch status {
        case "won": .green
        case "lost": .secondary
        case "quoted": .blue
        case "contacted": .orange
        default: .purple
        }
        return Text(leadStatusLabel(status)).font(.caption2)
            .padding(.horizontal, 6).padding(.vertical, 1)
            .background(color.opacity(0.15), in: Capsule()).foregroundStyle(color)
    }
}

struct LeadCreateSheet: View {
    let onCreate: ([String: Any]) -> Void
    @State private var name = ""
    @State private var email = ""
    @State private var phone = ""
    @State private var source = "appel"
    @State private var notes = ""

    var body: some View {
        StudioFormSheet(
            title: "Nouveau prospect", confirmLabel: "Créer",
            confirmDisabled: name.trimmingCharacters(in: .whitespaces).isEmpty,
            height: 400,
            onConfirm: {
                var payload: [String: Any] = ["name": name, "source": source, "status": "new"]
                if !email.isEmpty { payload["contact_email"] = email }
                if !phone.isEmpty { payload["contact_phone"] = phone }
                if !notes.isEmpty { payload["notes"] = notes }
                onCreate(payload)
            }
        ) {
            TextField("Nom", text: $name)
            TextField("Email", text: $email)
            TextField("Téléphone", text: $phone)
            Picker("Source", selection: $source) {
                Text("Appel").tag("appel")
                Text("Email").tag("email")
                Text("Site web").tag("site")
                Text("Recommandation").tag("recommandation")
                Text("Autre").tag("autre")
            }
            TextField("Notes", text: $notes, axis: .vertical).lineLimit(2...5)
        }
    }
}

// MARK: - Tâches

struct TasksView: View {
    @Environment(AppModel.self) private var model
    @State private var showingCreate = false

    private var tasks: [TaskItem] {
        _ = model.dataVersion
        return model.store.tasksList()
    }

    private static let df: DateFormatter = {
        let f = DateFormatter(); f.locale = Locale(identifier: "fr_FR"); f.dateFormat = "d MMM"; return f
    }()

    var body: some View {
        Group {
            if tasks.isEmpty {
                StudioEmptyState(title: "Aucune tâche", systemImage: "checklist",
                                 message: "To-do de prépa, de projet ou de session.")
            } else {
                List(tasks) { task in
                    HStack(spacing: 8) {
                        Button {
                            let next = task.status == "done" ? "todo" : "done"
                            try? model.store.localUpdate(table: "tasks", uuid: task.id, changes: ["status": next])
                            Task { await model.syncNow() }
                        } label: {
                            Image(systemName: task.status == "done" ? "checkmark.circle.fill" : "circle")
                                .foregroundStyle(task.status == "done" ? Color.green : Color.secondary)
                        }
                        .buttonStyle(.plain)
                        VStack(alignment: .leading, spacing: 1) {
                            Text(task.title).strikethrough(task.status == "done")
                                .foregroundStyle(task.status == "done" ? .secondary : .primary)
                            let project = task.projectId.flatMap { id in model.store.projects().first { $0.serverId == id } }
                            let sub = [task.assignee, project?.name].compactMap { $0 }.joined(separator: " · ")
                            if !sub.isEmpty { Text(sub).font(.caption).foregroundStyle(.secondary) }
                        }
                        Spacer()
                        if let due = task.dueDate {
                            Text(Self.df.string(from: due)).font(.caption).foregroundStyle(.orange)
                        }
                    }
                    .padding(.vertical, 2)
                    .contextMenu {
                        Button("Supprimer", role: .destructive) {
                            try? model.store.localDelete(table: "tasks", uuid: task.id)
                            Task { await model.syncNow() }
                        }
                    }
                }
            }
        }
        .navigationTitle("Tâches")
        .toolbar {
            ToolbarItem {
                Button { showingCreate = true } label: { Label("Nouvelle tâche", systemImage: "plus") }
            }
        }
        .modalCard(isPresented: $showingCreate) {
            TaskCreateSheet { payload in
                _ = try? model.store.localInsert(table: "tasks", payload: payload)
                Task { await model.syncNow() }
            }
        }
    }
}

struct TaskCreateSheet: View {
    @Environment(AppModel.self) private var model
    let onCreate: ([String: Any]) -> Void
    @State private var title = ""
    @State private var assignee = ""
    @State private var hasDue = false
    @State private var due = Date()
    @State private var projectServerId: Int?
    @State private var notes = ""

    var body: some View {
        StudioFormSheet(
            title: "Nouvelle tâche", confirmLabel: "Créer",
            confirmDisabled: title.trimmingCharacters(in: .whitespaces).isEmpty,
            height: 420,
            onConfirm: {
                var payload: [String: Any] = ["title": title, "status": "todo"]
                if !assignee.isEmpty { payload["assignee"] = assignee }
                if hasDue { payload["due_date"] = ISO8601DateFormatter().string(from: due) }
                if let projectServerId { payload["project_id"] = projectServerId }
                if !notes.isEmpty { payload["notes"] = notes }
                onCreate(payload)
            }
        ) {
            TextField("Intitulé", text: $title)
            TextField("Assigné à", text: $assignee)
            Toggle("Échéance", isOn: $hasDue)
            if hasDue { DatePicker("Le", selection: $due, displayedComponents: .date) }
            Picker("Projet (optionnel)", selection: $projectServerId) {
                Text("Aucun").tag(nil as Int?)
                ForEach(model.store.projects().filter { $0.serverId != nil }) { project in
                    Text(project.name).tag(project.serverId)
                }
            }
            TextField("Notes", text: $notes, axis: .vertical).lineLimit(2...4)
        }
    }
}

// MARK: - Documents

struct DocumentsView: View {
    @Environment(AppModel.self) private var model
    @State private var showingCreate = false

    private var docs: [StudioDocument] {
        _ = model.dataVersion
        return model.store.documents()
    }

    var body: some View {
        Group {
            if docs.isEmpty {
                StudioEmptyState(title: "Aucun document", systemImage: "folder",
                                 message: "Briefs, références, riders, stems, contrats…")
            } else {
                List(docs) { doc in
                    StudioRow(icon: "doc", title: doc.name,
                              subtitle: [doc.docType.map(docTypeLabel), doc.notes].compactMap { $0 }.joined(separator: " · ")) {
                        if let u = URL(string: doc.url) {
                            Link(destination: u) { Image(systemName: "arrow.up.right.square") }.buttonStyle(.plain)
                        }
                    }
                    .contextMenu {
                        Button("Supprimer", role: .destructive) {
                            try? model.store.localDelete(table: "documents", uuid: doc.id)
                            Task { await model.syncNow() }
                        }
                    }
                }
            }
        }
        .navigationTitle("Documents")
        .toolbar {
            ToolbarItem {
                Button { showingCreate = true } label: { Label("Nouveau document", systemImage: "plus") }
            }
        }
        .modalCard(isPresented: $showingCreate) {
            DocumentCreateSheet { payload in
                _ = try? model.store.localInsert(table: "documents", payload: payload)
                Task { await model.syncNow() }
            }
        }
    }
}

func docTypeLabel(_ t: String) -> String {
    switch t {
    case "brief": "Brief"
    case "reference": "Référence"
    case "rider": "Rider"
    case "stem": "Stem"
    case "contrat": "Contrat"
    default: "Autre"
    }
}

// MARK: - Disponibilités (staff & talents)

struct AvailabilityView: View {
    @Environment(AppModel.self) private var model
    @State private var showingCreate = false

    private var items: [Availability] {
        _ = model.dataVersion
        return model.store.availabilityList()
    }

    private static let df: DateFormatter = {
        let f = DateFormatter(); f.locale = Locale(identifier: "fr_FR"); f.dateFormat = "EEE d MMM, HH:mm"; return f
    }()

    private func subjectName(_ a: Availability) -> String {
        guard let id = a.subjectId else { return "?" }
        if a.subjectType == "talent" {
            return model.store.talents().first { $0.int("id") == id }?.displayName ?? "Talent #\(id)"
        }
        return model.store.cachedMembers().first { $0.id == id }?.name ?? "Membre #\(id)"
    }

    private func rangeLabel(_ a: Availability) -> String? {
        guard let s = a.start, let e = a.end else { return nil }
        return "\(Self.df.string(from: s)) → \(Self.df.string(from: e))"
    }

    var body: some View {
        Group {
            if items.isEmpty {
                StudioEmptyState(title: "Aucune indisponibilité", systemImage: "calendar.badge.minus",
                                 message: "Déclare les absences / congés du staff et des talents.")
            } else {
                List(items) { a in
                    StudioRow(icon: a.kind == "vacation" ? "beach.umbrella" : "calendar.badge.minus",
                              title: subjectName(a),
                              subtitle: [rangeLabel(a), a.notes].compactMap { $0 }.joined(separator: " · ")) {
                        Text(a.subjectType == "talent" ? "Talent" : "Staff")
                            .font(.caption2).foregroundStyle(.secondary)
                    }
                    .contextMenu {
                        Button("Supprimer", role: .destructive) {
                            try? model.store.localDelete(table: "availability", uuid: a.id)
                            Task { await model.syncNow() }
                        }
                    }
                }
            }
        }
        .navigationTitle("Disponibilités")
        .toolbar {
            ToolbarItem {
                Button { showingCreate = true } label: { Label("Nouvelle indisponibilité", systemImage: "plus") }
            }
        }
        .modalCard(isPresented: $showingCreate) {
            AvailabilityCreateSheet { payload in
                _ = try? model.store.localInsert(table: "availability", payload: payload)
                Task { await model.syncNow() }
            }
        }
    }
}

struct AvailabilityCreateSheet: View {
    @Environment(AppModel.self) private var model
    let onCreate: ([String: Any]) -> Void

    @State private var subjectType = "staff"
    @State private var staffId: Int?
    @State private var talentId: Int?
    @State private var kind = "unavailable"
    @State private var start = Date()
    @State private var end = Date().addingTimeInterval(3600)
    @State private var notes = ""

    private static let iso: ISO8601DateFormatter = {
        let f = ISO8601DateFormatter(); f.formatOptions = [.withInternetDateTime, .withFractionalSeconds]; return f
    }()

    var body: some View {
        StudioFormSheet(
            title: "Indisponibilité", confirmLabel: "Créer",
            confirmDisabled: subjectType == "staff" ? staffId == nil : talentId == nil,
            height: 460,
            onConfirm: {
                let subjectId = subjectType == "staff" ? staffId : talentId
                var payload: [String: Any] = [
                    "subject_type": subjectType,
                    "kind": kind,
                    "start_time": Self.iso.string(from: start),
                    "end_time": Self.iso.string(from: end),
                ]
                if let subjectId { payload["subject_id"] = subjectId }
                if !notes.isEmpty { payload["notes"] = notes }
                onCreate(payload)
            }
        ) {
            Picker("Qui", selection: $subjectType) {
                Text("Membre de l'équipe").tag("staff")
                Text("Talent").tag("talent")
            }
            if subjectType == "staff" {
                Picker("Membre", selection: $staffId) {
                    Text("Choisir…").tag(nil as Int?)
                    ForEach(model.store.cachedMembers()) { m in
                        Text(m.name).tag(m.id as Int?)
                    }
                }
            } else {
                Picker("Talent", selection: $talentId) {
                    Text("Choisir…").tag(nil as Int?)
                    ForEach(model.store.talents().filter { $0.int("id") != nil }) { t in
                        Text(t.displayName).tag(t.int("id"))
                    }
                }
            }
            Picker("Type", selection: $kind) {
                Text("Indisponible").tag("unavailable")
                Text("Congé").tag("vacation")
            }
            DatePicker("Début", selection: $start)
            DatePicker("Fin", selection: $end)
            TextField("Notes", text: $notes, axis: .vertical).lineLimit(2...4)
        }
    }
}

struct DocumentCreateSheet: View {
    @Environment(AppModel.self) private var model
    let onCreate: ([String: Any]) -> Void
    @State private var name = ""
    @State private var url = ""
    @State private var docType = "brief"
    @State private var projectServerId: Int?
    @State private var notes = ""

    var body: some View {
        StudioFormSheet(
            title: "Nouveau document", confirmLabel: "Ajouter",
            confirmDisabled: name.trimmingCharacters(in: .whitespaces).isEmpty || url.isEmpty,
            height: 420,
            onConfirm: {
                var payload: [String: Any] = ["name": name, "url": url, "doc_type": docType]
                if let projectServerId { payload["project_id"] = projectServerId }
                if !notes.isEmpty { payload["notes"] = notes }
                onCreate(payload)
            }
        ) {
            TextField("Nom", text: $name)
            TextField("Lien (URL)", text: $url, prompt: Text("https://…"))
            Picker("Type", selection: $docType) {
                Text("Brief").tag("brief")
                Text("Référence").tag("reference")
                Text("Rider").tag("rider")
                Text("Stem").tag("stem")
                Text("Contrat").tag("contrat")
                Text("Autre").tag("autre")
            }
            Picker("Projet (optionnel)", selection: $projectServerId) {
                Text("Aucun").tag(nil as Int?)
                ForEach(model.store.projects().filter { $0.serverId != nil }) { project in
                    Text(project.name).tag(project.serverId)
                }
            }
            TextField("Notes", text: $notes, axis: .vertical).lineLimit(2...4)
        }
    }
}
