import SwiftUI
import RSMCore

/// Q2 — equipment inventory (offline-first CRUD) + talents roster.
enum EquipmentSheet: Identifiable {
    case create
    case detail(EquipmentItem)
    var id: String {
        switch self {
        case .create: return "create"
        case .detail(let item): return "detail-\(item.id)"
        }
    }
}

struct EquipmentView: View {
    @Environment(AppModel.self) private var model
    @State private var search = ""
    @State private var sheet: EquipmentSheet?

    private var items: [EquipmentItem] {
        _ = model.dataVersion
        let all = model.store.equipmentList()
        guard !search.isEmpty else { return all }
        return all.filter {
            $0.name.localizedCaseInsensitiveContains(search)
                || ($0.brand ?? "").localizedCaseInsensitiveContains(search)
                || ($0.category ?? "").localizedCaseInsensitiveContains(search)
        }
    }

    var body: some View {
        Group {
            if items.isEmpty && search.isEmpty {
                ContentUnavailableView("Aucun matériel", systemImage: "hifispeaker",
                                       description: Text("Ajoute ton inventaire avec le bouton +."))
            } else {
                List(items) { item in
                    HStack {
                        Image(systemName: categoryIcon(item.category)).foregroundStyle(.tint).frame(width: 22)
                        VStack(alignment: .leading, spacing: 2) {
                            Text(item.name).fontWeight(.medium)
                            HStack(spacing: 4) {
                                if let brand = item.brand { Text(brand) }
                                if let modelName = item.model { Text(modelName) }
                                if let location = item.location { Text("· \(location)") }
                            }
                            .font(.caption).foregroundStyle(.secondary)
                        }
                        Spacer()
                        if !item.isAvailable {
                            Text("Indisponible").font(.caption2)
                                .padding(.horizontal, 6).padding(.vertical, 1)
                                .background(.red.opacity(0.15), in: Capsule()).foregroundStyle(.red)
                        }
                        if let condition = item.condition {
                            Text(conditionLabel(condition)).font(.caption2)
                                .padding(.horizontal, 6).padding(.vertical, 1)
                                .background(.quaternary, in: Capsule())
                        }
                    }
                    .padding(.vertical, 2)
                    .contentShape(Rectangle())
                    .onTapGesture { sheet = .detail(item) }
                    .contextMenu {
                        Button(item.isAvailable ? "Marquer indisponible" : "Marquer disponible") {
                            try? model.store.localUpdate(table: "equipment", uuid: item.id, changes: ["is_available": !item.isAvailable])
                            Task { await model.syncNow() }
                        }
                        Button("Supprimer", role: .destructive) {
                            try? model.store.localDelete(table: "equipment", uuid: item.id)
                            Task { await model.syncNow() }
                        }
                    }
                }
                .searchable(text: $search, prompt: "Rechercher du matériel")
            }
        }
        .navigationTitle("Équipement")
        .toolbar {
            ToolbarItem {
                Button { sheet = .create } label: { Label("Ajouter", systemImage: "plus") }
            }
        }
        .modalCard(item: $sheet) { which in
            switch which {
            case .create:
                EquipmentCreateSheet { payload in
                    _ = try? model.store.localInsert(table: "equipment", payload: payload)
                    Task { await model.syncNow() }
                }
            case .detail(let item):
                EquipmentDetailSheet(item: item)
            }
        }
    }

    private func categoryIcon(_ category: String?) -> String {
        switch category?.lowercased() {
        case "microphone", "micro": "mic"
        case "console", "mixer": "slider.horizontal.3"
        case "monitor", "speaker": "hifispeaker"
        case "instrument": "guitars"
        case "outboard", "preamp": "rectangle.connected.to.line.below"
        default: "shippingbox"
        }
    }

    private func conditionLabel(_ condition: String) -> String {
        switch condition {
        case "excellent": "Excellent"
        case "good": "Bon"
        case "fair": "Moyen"
        case "poor": "Usé"
        default: condition.capitalized
        }
    }
}

struct EquipmentCreateSheet: View {
    @Environment(\.modalDismiss) private var dismiss
    let onCreate: ([String: Any]) -> Void

    @State private var name = ""
    @State private var brand = ""
    @State private var modelName = ""
    @State private var category = "microphone"
    @State private var location = ""

    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            Text("Nouveau matériel").font(.title3).bold().padding()
            Form {
                TextField("Nom", text: $name, prompt: Text("Neumann U87 Ai"))
                TextField("Marque", text: $brand)
                TextField("Modèle", text: $modelName)
                Picker("Catégorie", selection: $category) {
                    Text("Micro").tag("microphone")
                    Text("Console").tag("console")
                    Text("Enceintes").tag("monitor")
                    Text("Périphérique").tag("outboard")
                    Text("Instrument").tag("instrument")
                    Text("Autre").tag("other")
                }
                TextField("Emplacement", text: $location, prompt: Text("Studio A"))
            }
            .formStyle(.grouped)
            HStack {
                Spacer()
                Button("Annuler") { dismiss() }.keyboardShortcut(.escape)
                Button("Ajouter") {
                    var payload: [String: Any] = ["name": name, "category": category]
                    if !brand.isEmpty { payload["brand"] = brand }
                    if !modelName.isEmpty { payload["model"] = modelName }
                    if !location.isEmpty { payload["location"] = location }
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

// MARK: - Equipment detail (reverse links)

struct EquipmentDetailSheet: View {
    @Environment(\.modalDismiss) private var dismiss
    @Environment(AppModel.self) private var model
    let item: EquipmentItem

    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            HStack {
                VStack(alignment: .leading, spacing: 2) {
                    Text(item.name).font(.title3).bold()
                    Text([item.brand, item.model, item.serialNumber.map { "n° \($0)" }]
                        .compactMap { $0 }.joined(separator: " · "))
                        .font(.caption).foregroundStyle(.secondary)
                }
                Spacer()
            }
            .padding()

            ScrollView {
                VStack(alignment: .leading, spacing: 12) {
                    if let serverId = item.int("id") {
                        RelatedSection("Sessions utilisant ce matériel",
                                       items: model.store.sessions(equipmentServerId: serverId),
                                       emptyText: "Jamais réservé sur une session.") { session in
                            session.relatedRow
                        } onTap: { _ in
                            dismiss()
                            model.open(.sessions)
                        }
                    }
                    if let notes = item.notes, !notes.isEmpty {
                        GroupBox("Notes") { Text(notes).frame(maxWidth: .infinity, alignment: .leading) }
                    }
                }
                .padding(.horizontal)
            }

            HStack {
                Spacer()
                Button("Fermer") { dismiss() }.keyboardShortcut(.escape)
            }
            .padding()
        }
        .frame(width: 440, height: 380)
    }
}

// MARK: - Talents

enum TalentSheet: Identifiable {
    case create
    case detail(Talent)
    var id: String {
        switch self {
        case .create: return "create"
        case .detail(let t): return "detail-\(t.id)"
        }
    }
}

struct TalentsView: View {
    @Environment(AppModel.self) private var model
    @State private var sheet: TalentSheet?

    private var talents: [Talent] {
        _ = model.dataVersion
        return model.store.talents()
    }

    var body: some View {
        Group {
            if talents.isEmpty {
                ContentUnavailableView("Aucun talent", systemImage: "music.mic",
                                       description: Text("Musiciens et intervenants de session."))
            } else {
                List(talents) { talent in
                    HStack {
                        Image(systemName: "music.mic").foregroundStyle(.tint)
                        VStack(alignment: .leading, spacing: 2) {
                            Text(talent.displayName).fontWeight(.medium)
                            HStack(spacing: 4) {
                                Text(typeLabel(talent.talentType))
                                if let instrument = talent.primaryInstrument { Text("· \(instrument)") }
                                if let email = talent.email { Text("· \(email)") }
                            }
                            .font(.caption).foregroundStyle(.secondary)
                        }
                        Spacer()
                        if let rate = talent.hourlyRate {
                            Text("\(euro(rate))/h").font(.caption).foregroundStyle(.secondary)
                        }
                    }
                    .padding(.vertical, 2)
                    .contentShape(Rectangle())
                    .onTapGesture { sheet = .detail(talent) }
                    .contextMenu {
                        Button("Supprimer", role: .destructive) {
                            try? model.store.localDelete(table: "musicians", uuid: talent.id)
                            Task { await model.syncNow() }
                        }
                    }
                }
            }
        }
        .navigationTitle("Talents")
        .toolbar {
            ToolbarItem {
                Button { sheet = .create } label: { Label("Ajouter", systemImage: "plus") }
            }
        }
        .modalCard(item: $sheet) { which in
            switch which {
            case .create:
                TalentCreateSheet { payload in
                    _ = try? model.store.localInsert(table: "musicians", payload: payload)
                    Task { await model.syncNow() }
                }
            case .detail(let talent):
                TalentDetailSheet(talent: talent)
            }
        }
    }

    private func typeLabel(_ type: String) -> String {
        switch type {
        case "producer": "Producteur"
        case "engineer": "Ingé son"
        case "songwriter": "Auteur"
        case "arranger": "Arrangeur"
        default: "Musicien"
        }
    }
}

// MARK: - Talent detail (reverse links)

struct TalentDetailSheet: View {
    @Environment(\.modalDismiss) private var dismiss
    @Environment(AppModel.self) private var model
    let talent: Talent

    @State private var editing = false
    @State private var f: [String: String] = [:]
    @State private var talentType = "musician"

    private let textKeys = [
        "name", "stage_name", "primary_instrument", "email", "phone",
        "website", "spotify_url", "bio", "notes", "image_url", "hourly_rate",
    ]
    private func b(_ key: String) -> Binding<String> {
        Binding(get: { f[key] ?? "" }, set: { f[key] = $0 })
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            HStack {
                VStack(alignment: .leading, spacing: 2) {
                    Text(talent.displayName).font(.title3).bold()
                    Text([talent.primaryInstrument, talent.email].compactMap { $0 }.joined(separator: " · "))
                        .font(.caption).foregroundStyle(.secondary)
                }
                Spacer()
                if !editing {
                    Button { startEdit() } label: { Label("Modifier", systemImage: "pencil") }
                }
            }
            .padding()

            if editing { editForm } else { detailScroll }

            HStack {
                Spacer()
                if editing {
                    Button("Annuler") { editing = false }.keyboardShortcut(.escape)
                    Button("Enregistrer") { save() }
                        .keyboardShortcut(.return).buttonStyle(.borderedProminent)
                        .disabled((f["name"] ?? "").trimmingCharacters(in: .whitespaces).isEmpty)
                } else {
                    Button("Fermer") { dismiss() }.keyboardShortcut(.escape)
                }
            }
            .padding()
        }
        .frame(width: 460, height: editing ? 600 : 420)
    }

    private var detailScroll: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 12) {
                if let bio = talent.bio, !bio.isEmpty {
                    GroupBox("Bio") {
                        Text(bio).frame(maxWidth: .infinity, alignment: .leading).textSelection(.enabled)
                    }
                }
                if !talent.instruments.isEmpty || !talent.genres.isEmpty
                    || talent.hourlyRate != nil || talent.phone != nil {
                    GroupBox("Profil") {
                        if !talent.instruments.isEmpty {
                            InfoRow(label: "Instruments", value: talent.instruments.joined(separator: ", "))
                        }
                        if !talent.genres.isEmpty {
                            InfoRow(label: "Genres", value: talent.genres.joined(separator: ", "))
                        }
                        InfoRow(label: "Tarif horaire", value: talent.hourlyRate.map { "\($0) €" })
                        InfoRow(label: "Téléphone", value: talent.phone)
                    }
                }
                let links: [(label: String, url: String)] =
                    [("Site web", talent.website), ("Spotify", talent.spotifyUrl)]
                    .compactMap { (l, u) in (u?.isEmpty == false) ? (l, u!) : nil }
                if !links.isEmpty {
                    GroupBox("Liens") { FlowLinks(links: links) }
                }
                if let notes = talent.notes, !notes.isEmpty {
                    GroupBox("Notes") {
                        Text(notes).frame(maxWidth: .infinity, alignment: .leading).textSelection(.enabled)
                    }
                }
                if let serverId = talent.int("id") {
                    RelatedSection("Projets crédités",
                                   items: model.store.projects(talentServerId: serverId),
                                   emptyText: "Aucun crédit sur un projet pour l'instant.") { project in
                        RelatedRowContent(icon: "music.note.list", title: project.name, subtitle: project.artistName)
                    } onTap: { project in
                        dismiss()
                        model.open(.projects, entity: project.id)
                    }
                }
            }
            .padding(.horizontal)
        }
    }

    private var editForm: some View {
        Form {
            Section("Identité") {
                TextField("Nom", text: b("name"))
                TextField("Nom de scène", text: b("stage_name"))
                Picker("Type", selection: $talentType) {
                    Text("Musicien").tag("musician")
                    Text("Producteur").tag("producer")
                    Text("Ingé son").tag("engineer")
                    Text("Auteur").tag("songwriter")
                    Text("Arrangeur").tag("arranger")
                }
            }
            Section("Contact") {
                TextField("Email", text: b("email"))
                TextField("Téléphone", text: b("phone"))
            }
            Section("Profil") {
                TextField("Instrument principal", text: b("primary_instrument"))
                TextField("Instruments (séparés par des virgules)", text: b("instruments"))
                TextField("Genres (séparés par des virgules)", text: b("genres"))
                TextField("Tarif horaire €", text: b("hourly_rate"))
                TextField("Bio", text: b("bio"), axis: .vertical).lineLimit(2...6)
            }
            Section("Liens & image") {
                TextField("Site web", text: b("website"))
                TextField("Spotify", text: b("spotify_url"))
                TextField("URL image", text: b("image_url"))
            }
            Section("Notes") {
                TextField("Notes", text: b("notes"), axis: .vertical).lineLimit(2...5)
            }
        }
        .formStyle(.grouped)
    }

    private func startEdit() {
        for k in textKeys { f[k] = talent.string(k) ?? "" }
        f["instruments"] = talent.instruments.joined(separator: ", ")
        f["genres"] = talent.genres.joined(separator: ", ")
        talentType = talent.talentType
        editing = true
    }

    private func save() {
        var c: [String: Any] = ["talent_type": talentType]
        for k in textKeys {
            let v = (f[k] ?? "").trimmingCharacters(in: .whitespacesAndNewlines)
            if k == "name" { c[k] = v } else { c[k] = v.isEmpty ? NSNull() : v }
        }
        c["instruments"] = csvToArray(f["instruments"])
        c["genres"] = csvToArray(f["genres"])
        try? model.store.localUpdate(table: "musicians", uuid: talent.id, changes: c)
        Task { await model.syncNow() }
        editing = false
    }
}

struct TalentCreateSheet: View {
    @Environment(\.modalDismiss) private var dismiss
    let onCreate: ([String: Any]) -> Void

    @State private var name = ""
    @State private var stageName = ""
    @State private var talentType = "musician"
    @State private var instrument = ""
    @State private var instruments = ""
    @State private var genres = ""
    @State private var email = ""
    @State private var phone = ""
    @State private var website = ""
    @State private var spotifyUrl = ""
    @State private var bio = ""
    @State private var hourlyRate = 0.0

    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            Text("Nouveau talent").font(.title3).bold().padding()
            Form {
                Section("Identité") {
                    TextField("Nom", text: $name)
                    TextField("Nom de scène", text: $stageName)
                    Picker("Type", selection: $talentType) {
                        Text("Musicien").tag("musician")
                        Text("Producteur").tag("producer")
                        Text("Ingé son").tag("engineer")
                        Text("Auteur").tag("songwriter")
                        Text("Arrangeur").tag("arranger")
                    }
                }
                Section("Contact") {
                    TextField("Email", text: $email)
                    TextField("Téléphone", text: $phone)
                }
                Section("Profil") {
                    TextField("Instrument principal", text: $instrument)
                    TextField("Instruments (séparés par des virgules)", text: $instruments)
                    TextField("Genres (séparés par des virgules)", text: $genres)
                    TextField("Tarif horaire €", value: $hourlyRate, format: .number)
                    TextField("Bio", text: $bio, axis: .vertical).lineLimit(2...5)
                }
                Section("Liens") {
                    TextField("Site web", text: $website)
                    TextField("Spotify", text: $spotifyUrl)
                }
            }
            .formStyle(.grouped)
            HStack {
                Spacer()
                Button("Annuler") { dismiss() }.keyboardShortcut(.escape)
                Button("Ajouter") {
                    var payload: [String: Any] = ["name": name, "talent_type": talentType]
                    if !stageName.isEmpty { payload["stage_name"] = stageName }
                    if !instrument.isEmpty { payload["primary_instrument"] = instrument }
                    if !email.isEmpty { payload["email"] = email }
                    if !phone.isEmpty { payload["phone"] = phone }
                    if !website.isEmpty { payload["website"] = website }
                    if !spotifyUrl.isEmpty { payload["spotify_url"] = spotifyUrl }
                    if !bio.isEmpty { payload["bio"] = bio }
                    if hourlyRate > 0 { payload["hourly_rate"] = String(format: "%.2f", hourlyRate) }
                    let ins = csvToArray(instruments)
                    if !ins.isEmpty { payload["instruments"] = ins }
                    let g = csvToArray(genres)
                    if !g.isEmpty { payload["genres"] = g }
                    onCreate(payload)
                    dismiss()
                }
                .keyboardShortcut(.return)
                .buttonStyle(.borderedProminent)
                .disabled(name.trimmingCharacters(in: .whitespaces).isEmpty)
            }
            .padding()
        }
        .frame(width: 460, height: 600)
    }
}
