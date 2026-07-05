import SwiftUI
import RSMCore

struct ClientsView: View {
    @Environment(AppModel.self) private var model
    @State private var search = ""
    @State private var selectedClientId: String?
    @State private var showingCreate = false
    @State private var showingImport = false

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
                    showingImport = true
                } label: {
                    Label("Importer des contacts", systemImage: "person.crop.circle.badge.plus")
                }
            }
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
        .modalCard(isPresented: $showingImport) {
            ContactsImportSheet { contacts in
                for c in contacts {
                    var payload: [String: Any] = ["name": c.name, "type": "individual"]
                    if let email = c.email { payload["email"] = email }
                    if let phone = c.phone { payload["phone"] = phone }
                    _ = try? model.store.localInsert(table: "clients", payload: payload)
                }
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

    private var hasArtistProfile: Bool {
        !(client.biography ?? "").isEmpty || !client.genres.isEmpty || !client.instruments.isEmpty
            || !(client.yearsActive ?? "").isEmpty || !(client.notableWorks ?? "").isEmpty
            || !(client.awardsRecognition ?? "").isEmpty
    }
    private var hasIndustryInfo: Bool {
        !(client.recordLabel ?? "").isEmpty || !(client.distributor ?? "").isEmpty
            || !(client.managerContact ?? "").isEmpty || !(client.publisher ?? "").isEmpty
            || !(client.performanceRightsSociety ?? "").isEmpty
    }

    // Client 360 metrics (at-a-glance), computed from the local cache.
    private struct Client360 { let due: Double; let revenue: Double; let upcoming: Int; let activeProjects: Int }
    private var metrics: Client360 {
        _ = model.dataVersion
        guard let sid = client.serverId else { return .init(due: 0, revenue: 0, upcoming: 0, activeProjects: 0) }
        let invs = model.store.invoices(clientServerId: sid)
        let due = invs.filter { $0.status == "sent" || $0.status == "overdue" }.reduce(0.0) { $0 + (Double($1.total) ?? 0) }
        let rev = invs.filter { $0.status == "paid" }.reduce(0.0) { $0 + (Double($1.total) ?? 0) }
        let now = Date()
        let upcoming = model.store.sessions(clientServerId: sid).filter { ($0.startTime ?? .distantPast) >= now && $0.status != "cancelled" }.count
        let active = model.store.projects(clientServerId: sid).filter { !["completed", "delivered", "archived"].contains($0.status) }.count
        return .init(due: due, revenue: rev, upcoming: upcoming, activeProjects: active)
    }

    private func curSym(_ c: String) -> String {
        switch c.uppercased() {
        case "EUR": return "€"; case "USD", "CAD", "AUD": return "$"; case "GBP": return "£"
        case "CHF": return "CHF"; case "JPY": return "¥"; default: return c.uppercased()
        }
    }
    private func money(_ v: Double) -> String { "\(String(format: "%.0f", v)) \(curSym(client.currency))" }

    @ViewBuilder private func kpi(_ label: String, _ value: String, _ color: Color) -> some View {
        VStack(alignment: .leading, spacing: 2) {
            Text(label).font(.caption).foregroundStyle(.secondary)
            Text(value).font(.title3).bold().foregroundStyle(color)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(10)
        .background(Color(nsColor: .controlBackgroundColor))
        .clipShape(RoundedRectangle(cornerRadius: 8))
    }

    private func togglePortal() {
        try? model.store.localUpdate(table: "clients", uuid: client.id, changes: ["portal_access": !client.portalAccess])
        Task { await model.syncNow() }
    }

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 16) {
                HStack {
                    Image(systemName: client.isCompany ? "building.2.crop.circle" : "person.crop.circle.fill")
                        .font(.system(size: 42)).foregroundStyle(.tint)
                    VStack(alignment: .leading) {
                        HStack(spacing: 6) {
                            Text(client.displayName).font(.title2).bold()
                            if client.isVip {
                                Image(systemName: "star.fill").foregroundStyle(.yellow)
                            }
                        }
                        Text(client.isCompany ? "Société" : "Individuel")
                            .font(.caption).foregroundStyle(.secondary)
                    }
                    Spacer()
                    Button { togglePortal() } label: {
                        Label(client.portalAccess ? "Portail activé" : "Activer portail",
                              systemImage: client.portalAccess ? "person.badge.key.fill" : "person.badge.key")
                    }
                    .help(client.portalAccess ? "Le client peut accéder à son espace en ligne. Cliquer pour désactiver."
                                              : "Donner au client l'accès à son espace en ligne.")
                    Button { showingEdit = true } label: {
                        Label("Modifier", systemImage: "pencil")
                    }
                    Button(role: .destructive) { confirmDelete = true } label: {
                        Label("Supprimer", systemImage: "trash")
                    }
                }

                // ---- Client 360 : coup d'œil ----
                HStack(spacing: 12) {
                    kpi("Solde dû", money(metrics.due), metrics.due > 0 ? .orange : .gray)
                    kpi("CA total", money(metrics.revenue), .primary)
                    kpi("Sessions à venir", "\(metrics.upcoming)", .primary)
                    kpi("Projets actifs", "\(metrics.activeProjects)", .primary)
                }

                GroupBox("Contact") {
                    InfoRow(label: "Email", value: client.email)
                    InfoRow(label: "Téléphone", value: client.phone)
                    InfoRow(label: "Adresse", value: client.street ?? client.address)
                    InfoRow(label: "Ville", value: [client.postalCode, client.city].compactMap { $0 }.joined(separator: " "))
                    InfoRow(label: "Région", value: client.region)
                    InfoRow(label: "Pays", value: client.country)
                }

                // ---- Profil artiste ----
                if hasArtistProfile {
                    GroupBox("Profil artiste") {
                        if let bio = client.biography, !bio.isEmpty {
                            VStack(alignment: .leading, spacing: 2) {
                                Text("Biographie").font(.caption).foregroundStyle(.secondary)
                                Text(bio).frame(maxWidth: .infinity, alignment: .leading).textSelection(.enabled)
                            }
                            .padding(.vertical, 2)
                        }
                        if !client.genres.isEmpty {
                            InfoRow(label: "Genres", value: client.genres.joined(separator: ", "))
                        }
                        if !client.instruments.isEmpty {
                            InfoRow(label: "Instruments", value: client.instruments.joined(separator: ", "))
                        }
                        InfoRow(label: "Années actives", value: client.yearsActive)
                        InfoRow(label: "Œuvres notables", value: client.notableWorks)
                        InfoRow(label: "Récompenses", value: client.awardsRecognition)
                    }
                }

                // ---- Liens ----
                if !client.streamingLinks.isEmpty {
                    GroupBox("Liens") {
                        FlowLinks(links: client.streamingLinks)
                    }
                }

                // ---- Industrie musicale ----
                if hasIndustryInfo {
                    GroupBox("Industrie musicale") {
                        InfoRow(label: "Label", value: client.recordLabel)
                        InfoRow(label: "Distributeur", value: client.distributor)
                        InfoRow(label: "Manager", value: client.managerContact)
                        InfoRow(label: "Éditeur", value: client.publisher)
                        InfoRow(label: "Sté de droits", value: client.performanceRightsSociety)
                    }
                }

                // ---- Commercial ----
                if client.defaultDepositPercent != nil || client.portalAccess {
                    GroupBox("Commercial") {
                        if let pct = client.defaultDepositPercent {
                            InfoRow(label: "Acompte défaut", value: "\(Int(pct)) %")
                        }
                        InfoRow(label: "Portail client", value: client.portalAccess ? "Activé" : "Désactivé")
                    }
                }

                if !client.customFields.isEmpty {
                    GroupBox("Champs personnalisés") {
                        ForEach(Array(client.customFields.enumerated()), id: \.offset) { _, field in
                            InfoRow(label: field.label, value: field.value)
                        }
                    }
                }

                if let notes = client.notes, !notes.isEmpty {
                    GroupBox("Notes") {
                        Text(notes).frame(maxWidth: .infinity, alignment: .leading).textSelection(.enabled)
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
    let client: Client
    let onSave: ([String: Any]) -> Void

    @State private var f: [String: String] = [:]
    @State private var isVip = false
    @State private var portalAccess = false
    @State private var currency = "EUR"
    @State private var customFields: [ClientCustomField] = []

    /// Scalar (text/varchar) columns edited through the shared string dictionary.
    private let textKeys = [
        "name", "artist_name", "email", "phone", "street", "postal_code", "city",
        "region", "country", "biography", "years_active", "notable_works",
        "awards_recognition", "spotify_url", "apple_music_url", "youtube_url",
        "soundcloud_url", "bandcamp_url", "deezer_url", "tidal_url",
        "amazon_music_url", "audiomack_url", "beatport_url", "other_platforms_url",
        "record_label", "distributor", "manager_contact", "publisher",
        "performance_rights_society", "avatar_url", "logo_url",
        "default_deposit_percent", "notes",
    ]

    private func b(_ key: String) -> Binding<String> {
        Binding(get: { f[key] ?? "" }, set: { f[key] = $0 })
    }

    var body: some View {
        StudioFormSheet(
            title: "Modifier \(client.name)", confirmLabel: "Enregistrer",
            confirmDisabled: (f["name"] ?? "").trimmingCharacters(in: .whitespaces).isEmpty,
            height: 640,
            onConfirm: { save() }
        ) {
                Section("Identité") {
                    TextField("Nom", text: b("name"))
                    if !client.isCompany { TextField("Nom d'artiste", text: b("artist_name")) }
                    Toggle("Client VIP", isOn: $isVip)
                }
                Section("Contact") {
                    TextField("Email", text: b("email"))
                    TextField("Téléphone", text: b("phone"))
                    TextField("Adresse", text: b("street"))
                    TextField("Code postal", text: b("postal_code"))
                    TextField("Ville", text: b("city"))
                    TextField("Région", text: b("region"))
                    TextField("Pays", text: b("country"))
                }
                Section("Profil artiste") {
                    TextField("Biographie", text: b("biography"), axis: .vertical).lineLimit(3...8)
                    TextField("Genres (séparés par des virgules)", text: b("genres"))
                    TextField("Instruments (séparés par des virgules)", text: b("instruments"))
                    TextField("Années actives", text: b("years_active"))
                    TextField("Œuvres notables", text: b("notable_works"), axis: .vertical).lineLimit(2...4)
                    TextField("Récompenses", text: b("awards_recognition"), axis: .vertical).lineLimit(2...4)
                }
                Section("Liens") {
                    TextField("Spotify", text: b("spotify_url"))
                    TextField("Apple Music", text: b("apple_music_url"))
                    TextField("YouTube", text: b("youtube_url"))
                    TextField("SoundCloud", text: b("soundcloud_url"))
                    TextField("Bandcamp", text: b("bandcamp_url"))
                    TextField("Deezer", text: b("deezer_url"))
                    TextField("Tidal", text: b("tidal_url"))
                    TextField("Amazon Music", text: b("amazon_music_url"))
                    TextField("Audiomack", text: b("audiomack_url"))
                    TextField("Beatport", text: b("beatport_url"))
                    TextField("Autres plateformes", text: b("other_platforms_url"))
                }
                Section("Industrie musicale") {
                    TextField("Label", text: b("record_label"))
                    TextField("Distributeur", text: b("distributor"))
                    TextField("Manager", text: b("manager_contact"))
                    TextField("Éditeur", text: b("publisher"))
                    TextField("Société de droits", text: b("performance_rights_society"))
                }
                Section("Image") {
                    TextField(client.isCompany ? "URL du logo" : "URL de l'avatar",
                              text: b(client.isCompany ? "logo_url" : "avatar_url"))
                }
                Section("Commercial") {
                    TextField("Acompte par défaut (%)", text: b("default_deposit_percent"))
                    Picker("Devise de facturation", selection: $currency) {
                        ForEach(Money.supported, id: \.code) { c in Text(c.label).tag(c.code) }
                    }
                    Toggle("Accès portail client", isOn: $portalAccess)
                }
                Section("Champs personnalisés") {
                    ForEach($customFields) { $field in
                        HStack {
                            TextField("Libellé", text: $field.label)
                            TextField("Valeur", text: $field.value)
                        }
                    }
                    .onDelete { customFields.remove(atOffsets: $0) }
                    Button {
                        customFields.append(ClientCustomField(label: "", value: ""))
                    } label: {
                        Label("Ajouter un champ", systemImage: "plus.circle")
                    }
                }
                Section("Notes") {
                    TextField("Notes", text: b("notes"), axis: .vertical).lineLimit(2...6)
                }
        }
        .onAppear(perform: load)
    }

    private func load() {
        for k in textKeys { f[k] = client.string(k) ?? "" }
        f["genres"] = client.genres.joined(separator: ", ")
        f["instruments"] = client.instruments.joined(separator: ", ")
        if let p = client.defaultDepositPercent { f["default_deposit_percent"] = String(Int(p)) }
        isVip = client.isVip
        portalAccess = client.portalAccess
        currency = client.currency
        customFields = client.customFields.map { ClientCustomField(label: $0.label, value: $0.value) }
    }

    private func save() {
        var c: [String: Any] = ["is_vip": isVip, "portal_access": portalAccess, "currency": currency]
        for k in textKeys where k != "default_deposit_percent" {
            let v = (f[k] ?? "").trimmingCharacters(in: .whitespacesAndNewlines)
            if k == "name" { c[k] = v } else { c[k] = v.isEmpty ? NSNull() : v }
        }
        c["genres"] = csvToArray(f["genres"])
        c["instruments"] = csvToArray(f["instruments"])
        let dep = (f["default_deposit_percent"] ?? "").trimmingCharacters(in: .whitespaces)
        c["default_deposit_percent"] = dep.isEmpty ? NSNull() : dep
        let cf: [[String: Any]] = customFields
            .map { (label: $0.label.trimmingCharacters(in: .whitespacesAndNewlines),
                    value: $0.value.trimmingCharacters(in: .whitespacesAndNewlines)) }
            .filter { !$0.label.isEmpty || !$0.value.isEmpty }
            .map { ["label": $0.label, "type": "text", "value": $0.value] }
        c["custom_fields"] = cf
        onSave(c)
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

// MARK: - Link display helpers

/// Wrapping grid of clickable streaming/web links.
struct FlowLinks: View {
    let links: [(label: String, url: String)]
    private let cols = [GridItem(.adaptive(minimum: 110), spacing: 8)]

    var body: some View {
        LazyVGrid(columns: cols, alignment: .leading, spacing: 8) {
            ForEach(links, id: \.label) { link in
                if let u = URL(string: link.url) {
                    Link(destination: u) {
                        Label(link.label, systemImage: "link")
                            .font(.caption)
                            .padding(.horizontal, 8).padding(.vertical, 4)
                            .background(Color.accentColor.opacity(0.12), in: Capsule())
                    }
                    .buttonStyle(.plain)
                } else {
                    Text(link.label).font(.caption).foregroundStyle(.secondary)
                }
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(.vertical, 2)
    }
}

/// One editable custom-field row (label + value) in the client edit sheet.
struct ClientCustomField: Identifiable {
    let id = UUID()
    var label: String
    var value: String
}

/// "a, b, c" → ["a", "b", "c"] (trimmed, empties dropped). Returns [] when blank.
func csvToArray(_ s: String?) -> [String] {
    (s ?? "")
        .split(separator: ",")
        .map { $0.trimmingCharacters(in: .whitespacesAndNewlines) }
        .filter { !$0.isEmpty }
}

// MARK: - Create sheet

struct ClientCreateSheet: View {
    let onCreate: ([String: Any]) -> Void

    @State private var name = ""
    @State private var artistName = ""
    @State private var email = ""
    @State private var phone = ""
    @State private var city = ""
    @State private var country = ""
    @State private var genres = ""
    @State private var biography = ""
    @State private var spotifyUrl = ""
    @State private var isCompany = false
    @State private var isVip = false
    @State private var currency = Money.defaultCode

    var body: some View {
        StudioFormSheet(
            title: "Nouveau client", confirmLabel: "Créer",
            confirmDisabled: name.trimmingCharacters(in: .whitespaces).isEmpty,
            height: 600,
            onConfirm: {
                var payload: [String: Any] = [
                    "name": name,
                    "type": isCompany ? "company" : "individual",
                    "is_vip": isVip,
                    "currency": currency,
                ]
                if !artistName.isEmpty { payload["artist_name"] = artistName }
                if !email.isEmpty { payload["email"] = email }
                if !phone.isEmpty { payload["phone"] = phone }
                if !city.isEmpty { payload["city"] = city }
                if !country.isEmpty { payload["country"] = country }
                if !biography.isEmpty { payload["biography"] = biography }
                if !spotifyUrl.isEmpty { payload["spotify_url"] = spotifyUrl }
                let g = csvToArray(genres)
                if !g.isEmpty { payload["genres"] = g }
                onCreate(payload)
            }
        ) {
            Section {
                Picker("Type", selection: $isCompany) {
                    Text("Individuel").tag(false)
                    Text("Société").tag(true)
                }
                .pickerStyle(.segmented)
                TextField(isCompany ? "Raison sociale" : "Nom", text: $name)
                if !isCompany {
                    TextField("Nom d'artiste", text: $artistName)
                }
                Toggle("Client VIP", isOn: $isVip)
            }
            Section("Contact") {
                TextField("Email", text: $email)
                TextField("Téléphone", text: $phone)
                TextField("Ville", text: $city)
                TextField("Pays", text: $country)
            }
            Section("Facturation") {
                Picker("Devise", selection: $currency) {
                    ForEach(Money.supported, id: \.code) { c in Text(c.label).tag(c.code) }
                }
                Text("Les factures de ce client seront émises dans cette devise.")
                    .font(.caption).foregroundStyle(.secondary)
            }
            Section("Profil artiste") {
                TextField("Genres (séparés par des virgules)", text: $genres)
                TextField("Biographie", text: $biography, axis: .vertical).lineLimit(2...5)
                TextField("Spotify", text: $spotifyUrl)
            }
        }
    }
}

// MARK: - Import from macOS Contacts

struct ContactsImportSheet: View {
    @Environment(\.modalDismiss) private var dismiss
    let onImport: ([MacContact]) -> Void

    @State private var contacts: [MacContact] = []
    @State private var selected: Set<String> = []
    @State private var loading = true
    @State private var search = ""

    private var filtered: [MacContact] {
        guard !search.isEmpty else { return contacts }
        return contacts.filter {
            $0.name.localizedCaseInsensitiveContains(search)
                || ($0.email ?? "").localizedCaseInsensitiveContains(search)
        }
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            Text("Importer des contacts").font(.title3).bold().padding()

            if loading {
                VStack { Spacer(); ProgressView("Lecture des contacts…"); Spacer() }
                    .frame(maxWidth: .infinity)
            } else if contacts.isEmpty {
                VStack(spacing: 8) {
                    Spacer()
                    Image(systemName: "person.crop.circle.badge.exclamationmark")
                        .font(.largeTitle).foregroundStyle(.secondary)
                    Text("Aucun contact accessible.").foregroundStyle(.secondary)
                    Text("Vérifie l'autorisation dans Réglages › Confidentialité › Contacts.")
                        .font(.caption).foregroundStyle(.secondary).multilineTextAlignment(.center)
                    Spacer()
                }
                .frame(maxWidth: .infinity).padding()
            } else {
                TextField("Rechercher", text: $search)
                    .textFieldStyle(.roundedBorder).padding(.horizontal)
                HStack {
                    Button(selected.count == filtered.count ? "Tout désélectionner" : "Tout sélectionner") {
                        if selected.count == filtered.count { selected.removeAll() }
                        else { selected = Set(filtered.map(\.id)) }
                    }
                    .font(.caption)
                    Spacer()
                    Text("\(selected.count) sélectionné(s)").font(.caption).foregroundStyle(.secondary)
                }
                .padding(.horizontal).padding(.top, 6)
                List(filtered) { c in
                    Button {
                        if selected.contains(c.id) { selected.remove(c.id) } else { selected.insert(c.id) }
                    } label: {
                        HStack {
                            Image(systemName: selected.contains(c.id) ? "checkmark.circle.fill" : "circle")
                                .foregroundStyle(selected.contains(c.id) ? Color.accentColor : Color.secondary)
                            VStack(alignment: .leading, spacing: 1) {
                                Text(c.name)
                                let sub = [c.email, c.phone].compactMap { $0 }.joined(separator: " · ")
                                if !sub.isEmpty {
                                    Text(sub).font(.caption).foregroundStyle(.secondary)
                                }
                            }
                            Spacer()
                        }
                    }
                    .buttonStyle(.plain)
                }
            }

            HStack {
                Spacer()
                Button("Annuler") { dismiss() }.keyboardShortcut(.escape)
                Button("Importer (\(selected.count))") {
                    onImport(contacts.filter { selected.contains($0.id) })
                    dismiss()
                }
                .keyboardShortcut(.return).buttonStyle(.borderedProminent)
                .disabled(selected.isEmpty)
            }
            .padding()
        }
        .frame(width: 480, height: 560)
        .task {
            contacts = await SystemImport.contacts()
            loading = false
        }
    }
}
