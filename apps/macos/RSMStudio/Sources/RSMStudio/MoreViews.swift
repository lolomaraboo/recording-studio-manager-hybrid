import SwiftUI
import RSMCore

// ============================================================================
// R3 — remaining modules: Salles, Services, Contrats, Dépenses, Équipe, Temps
// ============================================================================

// MARK: - Salles

struct RoomsView: View {
    @Environment(AppModel.self) private var model
    @State private var showingCreate = false

    private var rooms: [Room] {
        _ = model.dataVersion
        return model.store.roomsList()
    }

    var body: some View {
        List(rooms) { room in
            HStack {
                Image(systemName: "door.left.hand.open").foregroundStyle(.tint)
                VStack(alignment: .leading, spacing: 2) {
                    Text(room.name).fontWeight(.medium)
                    if let desc = room.string("description"), !desc.isEmpty {
                        Text(desc).font(.caption).foregroundStyle(.secondary)
                    }
                }
                Spacer()
                if let rate = room.string("hourly_rate") {
                    Text("\(euro(rate))/h").font(.caption).foregroundStyle(.secondary)
                }
                Button {
                    model.open(.calendar)
                } label: {
                    Image(systemName: "calendar").help("Voir le planning")
                }
                .buttonStyle(.borderless)
            }
            .padding(.vertical, 2)
            .contextMenu {
                Button("Sessions de cette salle") {
                    model.open(.sessions)
                }
                Button("Supprimer", role: .destructive) {
                    try? model.store.localDelete(table: "rooms", uuid: room.id)
                    Task { await model.syncNow() }
                }
            }
        }
        .navigationTitle("Salles")
        .toolbar {
            ToolbarItem {
                Button { showingCreate = true } label: { Label("Ajouter", systemImage: "plus") }
            }
        }
        .modalCard(isPresented: $showingCreate) {
            RoomCreateSheet { payload in
                _ = try? model.store.localInsert(table: "rooms", payload: payload)
                Task { await model.syncNow() }
            }
        }
    }
}

struct RoomCreateSheet: View {
    let onCreate: ([String: Any]) -> Void

    @State private var name = ""
    @State private var description = ""
    @State private var hourlyRate = 0.0

    var body: some View {
        StudioFormSheet(
            title: "Nouvelle salle", confirmLabel: "Créer",
            confirmDisabled: name.trimmingCharacters(in: .whitespaces).isEmpty,
            height: 300,
            onConfirm: {
                var payload: [String: Any] = ["name": name]
                if !description.isEmpty { payload["description"] = description }
                if hourlyRate > 0 { payload["hourly_rate"] = String(format: "%.2f", hourlyRate) }
                onCreate(payload)
            }
        ) {
            TextField("Nom", text: $name, prompt: Text("Studio A"))
            TextField("Description", text: $description)
            TextField("Tarif horaire €", value: $hourlyRate, format: .number)
        }
    }
}

// MARK: - Services (catalogue)

struct ServicesView: View {
    @Environment(AppModel.self) private var model
    @State private var showingCreate = false

    private var services: [ServiceItem] {
        _ = model.dataVersion
        return model.store.services()
    }

    var body: some View {
        Group {
            if services.isEmpty {
                StudioEmptyState(title: "Catalogue vide", systemImage: "list.star",
                                 message: "Tes prestations types, réutilisables dans les devis et factures.")
            } else {
                List(services) { service in
                    HStack {
                        Image(systemName: "list.star").foregroundStyle(.tint)
                        VStack(alignment: .leading, spacing: 2) {
                            Text(service.name).fontWeight(.medium)
                                .foregroundStyle(service.isActive ? .primary : .secondary)
                            if let category = service.category {
                                Text(category).font(.caption).foregroundStyle(.secondary)
                            }
                        }
                        Spacer()
                        Text(euro(service.unitPrice)).monospacedDigit()
                    }
                    .padding(.vertical, 2)
                    .contextMenu {
                        Button(service.isActive ? "Désactiver" : "Activer") {
                            try? model.store.localUpdate(table: "service_catalog", uuid: service.id, changes: ["is_active": !service.isActive])
                            Task { await model.syncNow() }
                        }
                        Button("Supprimer", role: .destructive) {
                            try? model.store.localDelete(table: "service_catalog", uuid: service.id)
                            Task { await model.syncNow() }
                        }
                    }
                }
            }
        }
        .navigationTitle("Services")
        .toolbar {
            ToolbarItem {
                Button { showingCreate = true } label: { Label("Ajouter", systemImage: "plus") }
            }
        }
        .modalCard(isPresented: $showingCreate) {
            ServiceCreateSheet { payload in
                _ = try? model.store.localInsert(table: "service_catalog", payload: payload)
                Task { await model.syncNow() }
            }
        }
    }
}

struct ServiceCreateSheet: View {
    let onCreate: ([String: Any]) -> Void

    @State private var name = ""
    @State private var category = ""
    @State private var unitPrice = 0.0

    var body: some View {
        StudioFormSheet(
            title: "Nouveau service", confirmLabel: "Créer",
            confirmDisabled: name.trimmingCharacters(in: .whitespaces).isEmpty || unitPrice <= 0,
            height: 300,
            onConfirm: {
                var payload: [String: Any] = ["name": name, "unit_price": String(format: "%.2f", unitPrice)]
                if !category.isEmpty { payload["category"] = category }
                onCreate(payload)
            }
        ) {
            TextField("Nom", text: $name, prompt: Text("Heure de studio — enregistrement"))
            TextField("Catégorie", text: $category, prompt: Text("Enregistrement, Mix, Mastering…"))
            TextField("Prix unitaire €", value: $unitPrice, format: .number)
        }
    }
}

// MARK: - Contrats

struct ContractsView: View {
    @Environment(AppModel.self) private var model

    private var contracts: [Contract] {
        _ = model.dataVersion
        return model.store.contracts()
    }

    var body: some View {
        Group {
            if contracts.isEmpty {
                StudioEmptyState(title: "Aucun contrat", systemImage: "signature",
                                 message: "Les contrats créés côté web apparaîtront ici.")
            } else {
                List(contracts) { contract in
                    HStack {
                        Image(systemName: "signature").foregroundStyle(.tint)
                        VStack(alignment: .leading, spacing: 2) {
                            Text(contract.title).fontWeight(.medium)
                            HStack(spacing: 4) {
                                Text(contract.number).monospaced()
                                if let client = contract.clientId.flatMap({ model.store.clientsByServerId()[$0] }) {
                                    Text("· \(client.name)")
                                }
                            }
                            .font(.caption).foregroundStyle(.secondary)
                        }
                        Spacer()
                        if let value = contract.value {
                            Text(euro(value)).monospacedDigit()
                        }
                        ContractStatusBadge(status: contract.status)
                    }
                    .padding(.vertical, 2)
                    .contextMenu {
                        if let client = contract.clientId.flatMap({ model.store.clientsByServerId()[$0] }) {
                            Button("Voir le client : \(client.name)") {
                                model.open(.clients, entity: client.id)
                            }
                        }
                        if let project = contract.projectId.flatMap({ id in model.store.projects().first { $0.serverId == id } }) {
                            Button("Voir le projet : \(project.name)") {
                                model.open(.projects, entity: project.id)
                            }
                        }
                    }
                }
            }
        }
        .navigationTitle("Contrats")
    }
}

struct ContractStatusBadge: View {
    let status: String

    var body: some View {
        let (label, color): (String, Color) = switch status {
        case "sent": ("Envoyé", .blue)
        case "signed": ("Signé", .green)
        case "expired": ("Expiré", .secondary)
        case "cancelled": ("Annulé", .secondary)
        default: ("Brouillon", .orange)
        }
        return Text(label).font(.caption2)
            .padding(.horizontal, 6).padding(.vertical, 1)
            .background(color.opacity(0.15), in: Capsule())
            .foregroundStyle(color)
    }
}

// MARK: - Dépenses

struct ExpensesView: View {
    @Environment(AppModel.self) private var model
    @State private var showingCreate = false

    private var expenses: [Expense] {
        _ = model.dataVersion
        return model.store.expenses()
    }

    private var total: Double {
        expenses.compactMap { Double($0.amount) }.reduce(0, +)
    }

    var body: some View {
        Group {
            if expenses.isEmpty {
                StudioEmptyState(title: "Aucune dépense", systemImage: "cart",
                                 message: "Suis les achats et frais du studio.")
            } else {
                List {
                    Section("Total : \(total.formatted(.currency(code: "EUR").locale(Locale(identifier: "fr_FR"))))") {
                        ForEach(expenses) { expense in
                            HStack {
                                Image(systemName: "cart").foregroundStyle(.tint)
                                VStack(alignment: .leading, spacing: 2) {
                                    Text(expense.description).fontWeight(.medium)
                                    HStack(spacing: 4) {
                                        if let category = expense.category { Text(category) }
                                        if let vendor = expense.vendor { Text("· \(vendor)") }
                                    }
                                    .font(.caption).foregroundStyle(.secondary)
                                }
                                Spacer()
                                Text(euro(expense.amount)).monospacedDigit()
                            }
                            .padding(.vertical, 2)
                            .contextMenu {
                                if let project = expense.projectId.flatMap({ id in model.store.projects().first { $0.serverId == id } }) {
                                    Button("Voir le projet : \(project.name)") {
                                        model.open(.projects, entity: project.id)
                                    }
                                }
                                Button("Supprimer", role: .destructive) {
                                    try? model.store.localDelete(table: "expenses", uuid: expense.id)
                                    Task { await model.syncNow() }
                                }
                            }
                        }
                    }
                }
            }
        }
        .navigationTitle("Dépenses")
        .toolbar {
            ToolbarItem {
                Button { showingCreate = true } label: { Label("Ajouter", systemImage: "plus") }
            }
        }
        .modalCard(isPresented: $showingCreate) {
            ExpenseCreateSheet { payload in
                _ = try? model.store.localInsert(table: "expenses", payload: payload)
                Task { await model.syncNow() }
            }
        }
    }
}

struct ExpenseCreateSheet: View {
    @Environment(AppModel.self) private var model
    let onCreate: ([String: Any]) -> Void

    @State private var description = ""
    @State private var category = "equipment"
    @State private var vendor = ""
    @State private var amount = 0.0
    @State private var projectServerId: Int?

    private static let isoFormatter = ISO8601DateFormatter()

    var body: some View {
        StudioFormSheet(
            title: "Nouvelle dépense", confirmLabel: "Créer",
            confirmDisabled: description.trimmingCharacters(in: .whitespaces).isEmpty || amount <= 0,
            height: 420,
            onConfirm: {
                var payload: [String: Any] = [
                    "description": description,
                    "category": category,
                    "amount": String(format: "%.2f", amount),
                    "expense_date": Self.isoFormatter.string(from: Date()),
                ]
                if !vendor.isEmpty { payload["vendor"] = vendor }
                if let projectServerId { payload["project_id"] = projectServerId }
                onCreate(payload)
            }
        ) {
            TextField("Description", text: $description)
            Picker("Catégorie", selection: $category) {
                Text("Matériel").tag("equipment")
                Text("Logiciel").tag("software")
                Text("Maintenance").tag("maintenance")
                Text("Loyer/Charges").tag("rent")
                Text("Sous-traitance").tag("freelance")
                Text("Autre").tag("other")
            }
            TextField("Fournisseur", text: $vendor)
            TextField("Montant €", value: $amount, format: .number)
            Picker("Projet (optionnel)", selection: $projectServerId) {
                Text("Aucun").tag(nil as Int?)
                ForEach(model.store.projects().filter { $0.serverId != nil }) { project in
                    Text(project.name).tag(project.serverId)
                }
            }
        }
    }
}

// MARK: - Équipe

struct TeamView: View {
    @Environment(AppModel.self) private var model

    private var members: [Member] {
        _ = model.dataVersion
        return model.store.cachedMembers()
    }

    var body: some View {
        List {
            Section("Membres (\(members.count))") {
                ForEach(members) { member in
                    HStack {
                        Image(systemName: member.role == "owner" ? "crown" : "person")
                            .foregroundStyle(.tint)
                        VStack(alignment: .leading, spacing: 2) {
                            Text(member.name).fontWeight(.medium)
                            Text(member.email).font(.caption).foregroundStyle(.secondary)
                        }
                        Spacer()
                        Text(member.role == "owner" ? "Propriétaire" : member.role.capitalized)
                            .font(.caption).foregroundStyle(.secondary)
                    }
                    .padding(.vertical, 2)
                }
            }

            Section {
                Text("Le suivi du temps est dans la section Temps. Inviter un membre se fait depuis le web (email + rôle) ; l'app liste l'équipe et permet l'assignation sur les sessions.")
                    .font(.caption).foregroundStyle(.secondary)
            }
        }
        .navigationTitle("Équipe")
    }
}
