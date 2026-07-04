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

// MARK: - Forfaits / packs prépayés

struct PackagesView: View {
    @Environment(AppModel.self) private var model
    @State private var showingCreate = false

    private var packages: [ClientPackage] {
        _ = model.dataVersion
        return model.store.packages()
    }

    private func clientName(_ id: Int?) -> String? {
        id.flatMap { model.store.clientsByServerId()[$0]?.displayName }
    }

    var body: some View {
        Group {
            if packages.isEmpty {
                StudioEmptyState(title: "Aucun forfait", systemImage: "creditcard",
                                 message: "Packs d'heures prépayées / abonnements par client.")
            } else {
                List(packages) { pack in
                    StudioRow(icon: "creditcard", title: pack.name,
                              subtitle: [clientName(pack.clientId), pack.price.map { "\($0) €" }].compactMap { $0 }.joined(separator: " · ")) {
                        if let total = pack.totalHours {
                            Text("\(pack.usedHours.formatted()) / \(total.formatted()) h")
                                .font(.caption).monospacedDigit()
                                .foregroundStyle((pack.remaining ?? 0) <= 0 ? .red : .secondary)
                        }
                    }
                    .contextMenu {
                        Button("Consommer 1 h") { consume(pack, 1) }
                        Button("Consommer 0,5 h") { consume(pack, 0.5) }
                        Button("Supprimer", role: .destructive) {
                            try? model.store.localDelete(table: "client_packages", uuid: pack.id)
                            Task { await model.syncNow() }
                        }
                    }
                }
            }
        }
        .navigationTitle("Forfaits")
        .toolbar {
            ToolbarItem {
                Button { showingCreate = true } label: { Label("Nouveau forfait", systemImage: "plus") }
            }
        }
        .modalCard(isPresented: $showingCreate) {
            PackageCreateSheet { payload in
                _ = try? model.store.localInsert(table: "client_packages", payload: payload)
                Task { await model.syncNow() }
            }
        }
    }

    private func consume(_ pack: ClientPackage, _ hours: Double) {
        let used = pack.usedHours + hours
        try? model.store.localUpdate(table: "client_packages", uuid: pack.id,
                                     changes: ["used_hours": String(format: "%.2f", used)])
        Task { await model.syncNow() }
    }
}

struct PackageCreateSheet: View {
    @Environment(AppModel.self) private var model
    let onCreate: ([String: Any]) -> Void

    @State private var clientServerId: Int?
    @State private var name = ""
    @State private var totalHours = 10.0
    @State private var price = 0.0
    @State private var notes = ""

    var body: some View {
        StudioFormSheet(
            title: "Nouveau forfait", confirmLabel: "Créer",
            confirmDisabled: name.trimmingCharacters(in: .whitespaces).isEmpty || clientServerId == nil,
            height: 420,
            onConfirm: {
                var payload: [String: Any] = [
                    "name": name,
                    "total_hours": String(format: "%.2f", totalHours),
                    "used_hours": "0",
                    "status": "active",
                ]
                if let clientServerId { payload["client_id"] = clientServerId }
                if price > 0 { payload["price"] = String(format: "%.2f", price) }
                if !notes.isEmpty { payload["notes"] = notes }
                onCreate(payload)
            }
        ) {
            Picker("Client", selection: $clientServerId) {
                Text("Choisir…").tag(nil as Int?)
                ForEach(model.store.clients().filter { $0.serverId != nil }) { client in
                    Text(client.displayName).tag(client.serverId)
                }
            }
            TextField("Nom du forfait", text: $name, prompt: Text("Pack 10 h — mensuel"))
            TextField("Heures incluses", value: $totalHours, format: .number)
            TextField("Prix €", value: $price, format: .number)
            TextField("Notes", text: $notes, axis: .vertical).lineLimit(2...4)
        }
    }
}

// MARK: - Avoirs (credit notes)

struct CreditNotesView: View {
    @Environment(AppModel.self) private var model
    @State private var showingCreate = false

    private var notes: [CreditNote] { _ = model.dataVersion; return model.store.creditNotes() }
    private func clientName(_ id: Int?) -> String? { id.flatMap { model.store.clientsByServerId()[$0]?.displayName } }

    var body: some View {
        Group {
            if notes.isEmpty {
                StudioEmptyState(title: "Aucun avoir", systemImage: "arrow.uturn.left.circle",
                                 message: "Notes de crédit (avoirs) émises aux clients.")
            } else {
                List(notes) { n in
                    StudioRow(icon: "arrow.uturn.left.circle", title: n.number,
                              subtitle: [clientName(n.clientId), n.reason].compactMap { $0 }.joined(separator: " · ")) {
                        Text(euro(n.amount)).font(.caption).monospacedDigit().foregroundStyle(.red)
                    }
                }
            }
        }
        .navigationTitle("Avoirs")
        .toolbar { ToolbarItem { Button { showingCreate = true } label: { Label("Nouvel avoir", systemImage: "plus") } } }
        .modalCard(isPresented: $showingCreate) { CreditNoteCreateSheet() }
    }
}

struct CreditNoteCreateSheet: View {
    @Environment(AppModel.self) private var model
    @State private var clientServerId: Int?
    @State private var amount = 0.0
    @State private var reason = ""

    var body: some View {
        StudioFormSheet(
            title: "Nouvel avoir", confirmLabel: "Créer",
            confirmDisabled: clientServerId == nil || amount <= 0, height: 360,
            onConfirm: {
                guard let cid = clientServerId else { return }
                let amt = amount
                let rsn = reason
                let api = APIClient(config: model.config)
                Task {
                    _ = try? await api.createCreditNote(clientServerId: cid, amount: amt, reason: rsn.isEmpty ? nil : rsn)
                    await model.syncNow()
                }
            }
        ) {
            Picker("Client", selection: $clientServerId) {
                Text("Choisir…").tag(nil as Int?)
                ForEach(model.store.clients().filter { $0.serverId != nil }) { c in Text(c.displayName).tag(c.serverId) }
            }
            TextField("Montant €", value: $amount, format: .number)
            TextField("Motif", text: $reason, axis: .vertical).lineLimit(2...4)
            Text("Numéro attribué par le serveur — création en ligne uniquement.")
                .font(.caption).foregroundStyle(.secondary)
        }
    }
}

// MARK: - Coupons / cartes cadeaux

struct CouponsView: View {
    @Environment(AppModel.self) private var model
    @State private var showingCreate = false

    private var coupons: [Coupon] { _ = model.dataVersion; return model.store.coupons() }

    var body: some View {
        Group {
            if coupons.isEmpty {
                StudioEmptyState(title: "Aucun coupon", systemImage: "ticket",
                                 message: "Codes promo et cartes cadeaux.")
            } else {
                List(coupons) { c in
                    StudioRow(icon: "ticket", title: c.code,
                              subtitle: c.kind == "percent" ? "-\(c.value) %" : (c.kind == "giftcard" ? "Carte cadeau \(c.value) €" : "-\(c.value) €")) {
                        Text(c.isActive ? "Actif" : "Inactif").font(.caption2)
                            .foregroundStyle(c.isActive ? .green : .secondary)
                    }
                    .contextMenu {
                        Button("Supprimer", role: .destructive) {
                            try? model.store.localDelete(table: "coupons", uuid: c.id)
                            Task { await model.syncNow() }
                        }
                    }
                }
            }
        }
        .navigationTitle("Coupons")
        .toolbar { ToolbarItem { Button { showingCreate = true } label: { Label("Nouveau coupon", systemImage: "plus") } } }
        .modalCard(isPresented: $showingCreate) {
            CouponCreateSheet { payload in
                _ = try? model.store.localInsert(table: "coupons", payload: payload)
                Task { await model.syncNow() }
            }
        }
    }
}

struct CouponCreateSheet: View {
    let onCreate: ([String: Any]) -> Void
    @State private var code = ""
    @State private var kind = "percent"
    @State private var value = 0.0
    @State private var notes = ""

    var body: some View {
        StudioFormSheet(
            title: "Nouveau coupon", confirmLabel: "Créer",
            confirmDisabled: code.trimmingCharacters(in: .whitespaces).isEmpty || value <= 0, height: 380,
            onConfirm: {
                var payload: [String: Any] = ["code": code, "kind": kind, "value": String(format: "%.2f", value), "is_active": true]
                if !notes.isEmpty { payload["notes"] = notes }
                onCreate(payload)
            }
        ) {
            TextField("Code", text: $code, prompt: Text("PROMO10"))
            Picker("Type", selection: $kind) {
                Text("Pourcentage").tag("percent")
                Text("Montant fixe").tag("amount")
                Text("Carte cadeau").tag("giftcard")
            }
            TextField(kind == "percent" ? "Valeur (%)" : "Valeur (€)", value: $value, format: .number)
            TextField("Notes", text: $notes, axis: .vertical).lineLimit(2...4)
        }
    }
}

// MARK: - Inventaire (consommables)

struct ConsumablesView: View {
    @Environment(AppModel.self) private var model
    @State private var showingCreate = false

    private var items: [Consumable] { _ = model.dataVersion; return model.store.consumables() }

    var body: some View {
        Group {
            if items.isEmpty {
                StudioEmptyState(title: "Inventaire vide", systemImage: "shippingbox",
                                 message: "Consommables : câbles, supports, fournitures…")
            } else {
                List(items) { c in
                    StudioRow(icon: "shippingbox", title: c.name, subtitle: c.notes) {
                        Text("\(c.quantity.formatted()) \(c.unit ?? "")")
                            .font(.caption).monospacedDigit()
                            .foregroundStyle(c.lowStock ? .red : .secondary)
                    }
                    .contextMenu {
                        Button("−1") { adjust(c, -1) }
                        Button("+1") { adjust(c, 1) }
                        Button("Supprimer", role: .destructive) {
                            try? model.store.localDelete(table: "consumables", uuid: c.id)
                            Task { await model.syncNow() }
                        }
                    }
                }
            }
        }
        .navigationTitle("Inventaire")
        .toolbar { ToolbarItem { Button { showingCreate = true } label: { Label("Nouvel article", systemImage: "plus") } } }
        .modalCard(isPresented: $showingCreate) {
            ConsumableCreateSheet { payload in
                _ = try? model.store.localInsert(table: "consumables", payload: payload)
                Task { await model.syncNow() }
            }
        }
    }

    private func adjust(_ c: Consumable, _ delta: Double) {
        let q = max(0, c.quantity + delta)
        try? model.store.localUpdate(table: "consumables", uuid: c.id, changes: ["quantity": String(format: "%.2f", q)])
        Task { await model.syncNow() }
    }
}

struct ConsumableCreateSheet: View {
    let onCreate: ([String: Any]) -> Void
    @State private var name = ""
    @State private var quantity = 0.0
    @State private var unit = ""
    @State private var threshold = 0.0

    var body: some View {
        StudioFormSheet(
            title: "Nouvel article", confirmLabel: "Créer",
            confirmDisabled: name.trimmingCharacters(in: .whitespaces).isEmpty, height: 360,
            onConfirm: {
                var payload: [String: Any] = ["name": name, "quantity": String(format: "%.2f", quantity)]
                if !unit.isEmpty { payload["unit"] = unit }
                if threshold > 0 { payload["threshold"] = String(format: "%.2f", threshold) }
                onCreate(payload)
            }
        ) {
            TextField("Nom", text: $name, prompt: Text("Câbles XLR"))
            TextField("Quantité", value: $quantity, format: .number)
            TextField("Unité", text: $unit, prompt: Text("pièces, m, …"))
            TextField("Seuil d'alerte", value: $threshold, format: .number)
        }
    }
}

// MARK: - Livrables

struct DeliverablesView: View {
    @Environment(AppModel.self) private var model
    @State private var showingCreate = false

    private var items: [Deliverable] { _ = model.dataVersion; return model.store.deliverables() }
    private func projectName(_ id: Int?) -> String? {
        id.flatMap { pid in model.store.projects().first { $0.serverId == pid }?.name }
    }

    var body: some View {
        Group {
            if items.isEmpty {
                StudioEmptyState(title: "Aucun livrable", systemImage: "shippingbox.and.arrow.backward",
                                 message: "Bundles/exports livrés au client (masters, stems).")
            } else {
                List(items) { d in
                    StudioRow(icon: "shippingbox.and.arrow.backward", title: d.name,
                              subtitle: [projectName(d.projectId), deliverableStatusLabel(d.status)].compactMap { $0 }.joined(separator: " · ")) {
                        if let u = d.url, let url = URL(string: u) {
                            Link(destination: url) { Image(systemName: "arrow.up.right.square") }.buttonStyle(.plain)
                        }
                    }
                    .contextMenu {
                        Button("Marquer livré") { setStatus(d, "delivered") }
                        Button("Marquer approuvé") { setStatus(d, "approved") }
                        Button("Supprimer", role: .destructive) {
                            try? model.store.localDelete(table: "deliverables", uuid: d.id)
                            Task { await model.syncNow() }
                        }
                    }
                }
            }
        }
        .navigationTitle("Livrables")
        .toolbar { ToolbarItem { Button { showingCreate = true } label: { Label("Nouveau livrable", systemImage: "plus") } } }
        .modalCard(isPresented: $showingCreate) {
            DeliverableCreateSheet { payload in
                _ = try? model.store.localInsert(table: "deliverables", payload: payload)
                Task { await model.syncNow() }
            }
        }
    }

    private func setStatus(_ d: Deliverable, _ s: String) {
        try? model.store.localUpdate(table: "deliverables", uuid: d.id, changes: ["status": s])
        Task { await model.syncNow() }
    }
}

func deliverableStatusLabel(_ s: String) -> String {
    switch s {
    case "delivered": "Livré"
    case "approved": "Approuvé"
    default: "Brouillon"
    }
}

struct DeliverableCreateSheet: View {
    @Environment(AppModel.self) private var model
    let onCreate: ([String: Any]) -> Void
    @State private var name = ""
    @State private var projectServerId: Int?
    @State private var url = ""
    @State private var notes = ""

    var body: some View {
        StudioFormSheet(
            title: "Nouveau livrable", confirmLabel: "Créer",
            confirmDisabled: name.trimmingCharacters(in: .whitespaces).isEmpty, height: 400,
            onConfirm: {
                var payload: [String: Any] = ["name": name, "status": "draft"]
                if let projectServerId { payload["project_id"] = projectServerId }
                if !url.isEmpty { payload["url"] = url }
                if !notes.isEmpty { payload["notes"] = notes }
                onCreate(payload)
            }
        ) {
            TextField("Nom", text: $name, prompt: Text("Masters WAV — album"))
            Picker("Projet (optionnel)", selection: $projectServerId) {
                Text("Aucun").tag(nil as Int?)
                ForEach(model.store.projects().filter { $0.serverId != nil }) { p in Text(p.name).tag(p.serverId) }
            }
            TextField("Lien (URL)", text: $url, prompt: Text("https://…"))
            TextField("Notes", text: $notes, axis: .vertical).lineLimit(2...4)
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
