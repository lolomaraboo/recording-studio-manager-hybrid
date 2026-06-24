import SwiftUI
import RSMCore

struct ClientsView: View {
    @Environment(AppModel.self) private var model
    @State private var search = ""
    @State private var selectedClientId: String?
    @State private var showingCreate = false

    private var clients: [Client] {
        _ = model.dataVersion // re-query when sync completes
        let all = model.store.clients()
        guard !search.isEmpty else { return all }
        return all.filter {
            $0.name.localizedCaseInsensitiveContains(search)
                || ($0.email ?? "").localizedCaseInsensitiveContains(search)
                || ($0.artistName ?? "").localizedCaseInsensitiveContains(search)
        }
    }

    var body: some View {
        HSplitView {
            List(clients, selection: $selectedClientId) { client in
                ClientRow(client: client).tag(client.id)
            }
            .frame(minWidth: 280, idealWidth: 320)
            .searchable(text: $search, placement: .sidebar, prompt: "Rechercher un client")
            .onAppear { consumeFocus() }
            .onChange(of: model.focusedEntity[.clients]) { consumeFocus() }

            Group {
                if let id = selectedClientId, let client = clients.first(where: { $0.id == id }) {
                    ClientDetailView(client: client, onDelete: {
                        try? model.store.localDelete(table: "clients", uuid: client.id)
                        selectedClientId = nil
                        Task { await model.syncNow() }
                    })
                } else {
                    ContentUnavailableView("Sélectionne un client", systemImage: "person.crop.circle")
                }
            }
            .frame(minWidth: 360, maxWidth: .infinity, maxHeight: .infinity)
        }
        .navigationTitle("Clients")
        .toolbar {
            ToolbarItem {
                Button {
                    showingCreate = true
                } label: {
                    Label("Nouveau client", systemImage: "person.badge.plus")
                }
            }
        }
        .modalCard(isPresented: $showingCreate) {
            ClientCreateSheet { payload in
                _ = try? model.store.localInsert(table: "clients", payload: payload)
                Task { await model.syncNow() }
            }
        }
    }

    private func consumeFocus() {
        if let uuid = model.focusedEntity[.clients] {
            selectedClientId = uuid
            search = ""
            model.focusedEntity[.clients] = nil
        }
    }
}

struct ClientRow: View {
    let client: Client

    var body: some View {
        HStack {
            Image(systemName: client.isCompany ? "building.2" : "person.crop.circle")
                .foregroundStyle(.tint)
            VStack(alignment: .leading, spacing: 2) {
                HStack(spacing: 4) {
                    Text(client.displayName).fontWeight(.medium)
                    if client.isVip {
                        Image(systemName: "star.fill").font(.caption2).foregroundStyle(.yellow)
                    }
                }
                if let email = client.email, !email.isEmpty {
                    Text(email).font(.caption).foregroundStyle(.secondary)
                }
            }
        }
        .padding(.vertical, 2)
    }
}

struct ClientDetailView: View {
    let client: Client
    let onDelete: () -> Void
    @Environment(AppModel.self) private var model
    @State private var confirmDelete = false
    @State private var showingEdit = false

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 16) {
                HStack {
                    Image(systemName: client.isCompany ? "building.2.crop.circle" : "person.crop.circle.fill")
                        .font(.system(size: 42)).foregroundStyle(.tint)
                    VStack(alignment: .leading) {
                        Text(client.displayName).font(.title2).bold()
                        Text(client.isCompany ? "Société" : "Individuel")
                            .font(.caption).foregroundStyle(.secondary)
                    }
                    Spacer()
                    Button { showingEdit = true } label: {
                        Label("Modifier", systemImage: "pencil")
                    }
                    Button(role: .destructive) { confirmDelete = true } label: {
                        Label("Supprimer", systemImage: "trash")
                    }
                }

                GroupBox("Contact") {
                    InfoRow(label: "Email", value: client.email)
                    InfoRow(label: "Téléphone", value: client.phone)
                    InfoRow(label: "Ville", value: client.city)
                    InfoRow(label: "Pays", value: client.country)
                }

                if let notes = client.notes, !notes.isEmpty {
                    GroupBox("Notes") {
                        Text(notes).frame(maxWidth: .infinity, alignment: .leading)
                    }
                }

                // ---- Tout ce qui concerne ce client ----
                if let serverId = client.serverId {
                    RelatedSection("Projets", items: model.store.projects(clientServerId: serverId)) { project in
                        RelatedRowContent(icon: "music.note.list", title: project.name, subtitle: project.artistName)
                    } onTap: { project in
                        model.open(.projects, entity: project.id)
                    }

                    RelatedSection("Sessions", items: model.store.sessions(clientServerId: serverId)) { session in
                        session.relatedRow
                    } onTap: { _ in
                        model.open(.sessions)
                    }

                    RelatedSection("Devis", items: model.store.quotes(clientServerId: serverId)) { quote in
                        RelatedRowContent(icon: "doc.plaintext", title: quote.number, subtitle: euro(quote.total))
                    } onTap: { quote in
                        model.open(.quotes, entity: quote.id)
                    }

                    RelatedSection("Factures", items: model.store.invoices(clientServerId: serverId)) { invoice in
                        RelatedRowContent(icon: "doc.text", title: invoice.number, subtitle: euro(invoice.total),
                                          badge: invoice.status == "paid" ? "Payée" : nil)
                    } onTap: { invoice in
                        model.open(.invoices, entity: invoice.id)
                    }

                    RelatedSection("Contrats", items: model.store.contracts(clientServerId: serverId)) { contract in
                        RelatedRowContent(icon: "signature", title: contract.title, subtitle: contract.number)
                    } onTap: { _ in
                        model.open(.contracts)
                    }
                }
            }
            .padding()
        }
        .confirmationDialog("Supprimer ce client ?", isPresented: $confirmDelete) {
            Button("Supprimer", role: .destructive) { onDelete() }
        }
        .modalCard(isPresented: $showingEdit) {
            ClientEditSheet(client: client) { changes in
                try? model.store.localUpdate(table: "clients", uuid: client.id, changes: changes)
                Task { await model.syncNow() }
            }
        }
    }
}

// MARK: - Edit sheet

struct ClientEditSheet: View {
    @Environment(\.modalDismiss) private var dismiss
    let client: Client
    let onSave: ([String: Any]) -> Void

    @State private var name = ""
    @State private var artistName = ""
    @State private var email = ""
    @State private var phone = ""
    @State private var city = ""
    @State private var notes = ""
    @State private var isVip = false

    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            Text("Modifier \(client.name)").font(.title3).bold().padding()
            Form {
                TextField("Nom", text: $name)
                if !client.isCompany {
                    TextField("Nom d'artiste", text: $artistName)
                }
                TextField("Email", text: $email)
                TextField("Téléphone", text: $phone)
                TextField("Ville", text: $city)
                TextField("Notes", text: $notes, axis: .vertical).lineLimit(3...6)
                Toggle("Client VIP", isOn: $isVip)
            }
            .formStyle(.grouped)

            HStack {
                Spacer()
                Button("Annuler") { dismiss() }.keyboardShortcut(.escape)
                Button("Enregistrer") {
                    onSave([
                        "name": name,
                        "artist_name": artistName.isEmpty ? NSNull() : artistName,
                        "email": email.isEmpty ? NSNull() : email,
                        "phone": phone.isEmpty ? NSNull() : phone,
                        "city": city.isEmpty ? NSNull() : city,
                        "notes": notes.isEmpty ? NSNull() : notes,
                        "is_vip": isVip,
                    ])
                    dismiss()
                }
                .keyboardShortcut(.return)
                .buttonStyle(.borderedProminent)
                .disabled(name.trimmingCharacters(in: .whitespaces).isEmpty)
            }
            .padding()
        }
        .frame(width: 440, height: 440)
        .onAppear {
            name = client.name
            artistName = client.artistName ?? ""
            email = client.email ?? ""
            phone = client.phone ?? ""
            city = client.city ?? ""
            notes = client.notes ?? ""
            isVip = client.isVip
        }
    }
}

struct InfoRow: View {
    let label: String
    let value: String?

    var body: some View {
        if let value, !value.isEmpty {
            HStack {
                Text(label).foregroundStyle(.secondary).frame(width: 90, alignment: .leading)
                Text(value).textSelection(.enabled)
                Spacer()
            }
            .font(.callout)
            .padding(.vertical, 1)
        }
    }
}

// MARK: - Create sheet

struct ClientCreateSheet: View {
    @Environment(\.modalDismiss) private var dismiss
    let onCreate: ([String: Any]) -> Void

    @State private var name = ""
    @State private var artistName = ""
    @State private var email = ""
    @State private var phone = ""
    @State private var isCompany = false
    @State private var isVip = false

    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            Text("Nouveau client").font(.title3).bold().padding()
            Form {
                Picker("Type", selection: $isCompany) {
                    Text("Individuel").tag(false)
                    Text("Société").tag(true)
                }
                .pickerStyle(.segmented)
                TextField(isCompany ? "Raison sociale" : "Nom", text: $name)
                if !isCompany {
                    TextField("Nom d'artiste", text: $artistName)
                }
                TextField("Email", text: $email)
                TextField("Téléphone", text: $phone)
                Toggle("Client VIP", isOn: $isVip)
            }
            .formStyle(.grouped)

            HStack {
                Spacer()
                Button("Annuler") { dismiss() }.keyboardShortcut(.escape)
                Button("Créer") {
                    var payload: [String: Any] = [
                        "name": name,
                        "type": isCompany ? "company" : "individual",
                        "is_vip": isVip,
                    ]
                    if !artistName.isEmpty { payload["artist_name"] = artistName }
                    if !email.isEmpty { payload["email"] = email }
                    if !phone.isEmpty { payload["phone"] = phone }
                    onCreate(payload)
                    dismiss()
                }
                .keyboardShortcut(.return)
                .buttonStyle(.borderedProminent)
                .disabled(name.trimmingCharacters(in: .whitespaces).isEmpty)
            }
            .padding()
        }
        .frame(width: 420, height: 360)
    }
}
