import SwiftUI
import RSMCore

struct SettingsView: View {
    @Environment(AppModel.self) private var model

    @State private var baseURL = ""
    @State private var orgId = ""
    @State private var userId = ""
    @State private var confirmReset = false
    @State private var showingLogin = false

    // Inline editors (TVA / types de tâches)
    @State private var newVatName = ""
    @State private var newVatRate = ""
    @State private var newTaskName = ""
    @State private var newTaskRate = ""
    @State private var newTaskCategory = "billable"
    @State private var currencyCode = Money.defaultCode
    @State private var fxRates: [String: String] = Money.rates.mapValues { String($0) }
    @State private var isRefreshingRates = false
    @State private var ratesError: String?

    private func saveRate(_ code: String, _ text: String) {
        var r = Money.rates
        let cleaned = text.replacingOccurrences(of: ",", with: ".")
        if let v = Double(cleaned), v > 0 { r[code] = v } else { r[code] = nil }
        Money.rates = r
        model.dataVersion += 1
    }

    @MainActor
    private func refreshRates() async {
        isRefreshingRates = true
        ratesError = nil
        defer { isRefreshingRates = false }
        let ok = await Money.refreshRates(base: currencyCode)
        if ok {
            fxRates = Money.rates.mapValues { String(format: "%.4f", $0) }
            model.dataVersion += 1
        } else {
            ratesError = "Impossible de récupérer les taux (hors ligne ?). Saisie manuelle possible."
        }
    }

    private var vatRows: [[String: Any]] {
        _ = model.dataVersion
        return ((try? model.store.rows(table: "vat_rates")) ?? [])
            .sorted { (($0["name"] as? String) ?? "") < (($1["name"] as? String) ?? "") }
    }
    private var taskTypes: [TaskType] {
        _ = model.dataVersion
        return model.store.taskTypes()
    }

    var body: some View {
        Form {
            Section("Compte") {
                if model.config.isAccountMode {
                    LabeledContent("Connecté en tant que", value: model.config.userName ?? model.config.userEmail ?? "?")
                    LabeledContent("Studio", value: model.config.organizationName ?? "Organisation \(model.config.organizationId)")
                    Button("Se déconnecter", role: .destructive) {
                        AuthService.logout(baseURL: model.config.baseURL)
                        var config = model.config
                        config.authMode = nil
                        config.userName = nil
                        config.userEmail = nil
                        config.organizationName = nil
                        model.config = config
                    }
                } else {
                    Text("Mode développement (en-têtes de test).")
                        .font(.caption).foregroundStyle(.secondary)
                    Button("Se connecter avec un compte…") { showingLogin = true }
                }
            }

            Section("Serveur") {
                TextField("URL du serveur", text: $baseURL, prompt: Text("http://localhost:3001"))
                if !model.config.isAccountMode {
                    TextField("Organisation (ID)", text: $orgId)
                    TextField("Utilisateur (ID)", text: $userId)
                }
                Button("Appliquer") {
                    var config = model.config
                    config.baseURL = baseURL.trimmingCharacters(in: .whitespaces)
                    if !config.isAccountMode {
                        config.organizationId = Int(orgId) ?? config.organizationId
                        config.userId = Int(userId) ?? config.userId
                    }
                    model.config = config
                }
                .disabled(baseURL.isEmpty)
            }

            Section("Synchronisation") {
                LabeledContent("État") {
                    switch model.phase {
                    case .idle: Text("Synchronisé")
                    case .syncing: Text("En cours…")
                    case .offline: Text("Hors ligne — les modifications locales seront poussées au retour du réseau")
                    case .error(let e): Text(e).foregroundStyle(.red)
                    }
                }
                LabeledContent("Mutations en attente", value: "\(model.pendingCount)")
                Button("Synchroniser maintenant") {
                    Task { await model.syncNow() }
                }
            }

            Section("Devise") {
                Picker("Devise du studio", selection: $currencyCode) {
                    ForEach(Money.supported, id: \.code) { c in
                        Text(c.label).tag(c.code)
                    }
                }
                .onChange(of: currencyCode) { Money.defaultCode = currencyCode; model.dataVersion += 1 }
                Text("Devise de référence : affichage des montants et base des conversions.")
                    .font(.caption).foregroundStyle(.secondary)
            }

            Section("Taux de change (vers \(currencyCode))") {
                HStack {
                    Button {
                        Task { await refreshRates() }
                    } label: {
                        Label(isRefreshingRates ? "Actualisation…" : "Actualiser automatiquement",
                              systemImage: "arrow.triangle.2.circlepath")
                    }
                    .disabled(isRefreshingRates)
                    if isRefreshingRates { ProgressView().controlSize(.small) }
                    Spacer()
                    if let d = Money.lastRatesRefresh {
                        Text("Maj : \(d.formatted(date: .abbreviated, time: .shortened))")
                            .font(.caption2).foregroundStyle(.secondary)
                    }
                }
                if let ratesError { Text(ratesError).font(.caption).foregroundStyle(.red) }
                ForEach(Money.supported.filter { $0.code != currencyCode }, id: \.code) { c in
                    HStack {
                        Text(c.label)
                        Spacer()
                        Text("1 \(c.code) =").font(.caption).foregroundStyle(.secondary)
                        TextField("taux", text: Binding(
                            get: { fxRates[c.code] ?? "" },
                            set: { fxRates[c.code] = $0; saveRate(c.code, $0) }
                        ))
                        .frame(width: 70).multilineTextAlignment(.trailing)
                        Text(currencyCode).font(.caption).foregroundStyle(.secondary)
                    }
                }
                Text("« Actualiser » récupère les taux du jour en ligne. Tu peux aussi les saisir à la main. Une devise sans taux reste comptée séparément dans les rapports.")
                    .font(.caption).foregroundStyle(.secondary)
            }

            Section("TVA") {
                ForEach(Array(vatRows.enumerated()), id: \.offset) { _, row in
                    HStack {
                        Text((row["name"] as? String) ?? "TVA")
                        if isDefault(row["is_default"]) {
                            Text("défaut").font(.caption2)
                                .padding(.horizontal, 5).padding(.vertical, 1)
                                .background(.blue.opacity(0.15), in: Capsule())
                        }
                        Spacer()
                        Text(rateLabel(row["rate"])).foregroundStyle(.secondary)
                        if let uuid = row["sync_uuid"] as? String {
                            Button(role: .destructive) {
                                try? model.store.localDelete(table: "vat_rates", uuid: uuid)
                                Task { await model.syncNow() }
                            } label: { Image(systemName: "trash") }
                            .buttonStyle(.borderless)
                        }
                    }
                }
                HStack {
                    TextField("Nom (ex. TVA 20%)", text: $newVatName)
                    TextField("Taux %", text: $newVatRate).frame(width: 80)
                    Button("Ajouter") { addVat() }
                        .disabled(newVatName.isEmpty || newVatRate.isEmpty)
                }
            }

            Section("Types de tâches") {
                ForEach(taskTypes) { t in
                    HStack {
                        Text(t.name)
                        Text(t.category == "billable" ? "facturable" : "non fact.").font(.caption2)
                            .padding(.horizontal, 5).padding(.vertical, 1)
                            .background((t.category == "billable" ? Color.green : Color.gray).opacity(0.15), in: Capsule())
                        Spacer()
                        Text("\(t.hourlyRate) €/h").foregroundStyle(.secondary)
                        Button(role: .destructive) {
                            try? model.store.localDelete(table: "task_types", uuid: t.id)
                            Task { await model.syncNow() }
                        } label: { Image(systemName: "trash") }
                        .buttonStyle(.borderless)
                    }
                }
                HStack {
                    TextField("Nom", text: $newTaskName)
                    TextField("€/h", text: $newTaskRate).frame(width: 70)
                    Picker("", selection: $newTaskCategory) {
                        Text("Facturable").tag("billable")
                        Text("Non").tag("non_billable")
                    }
                    .labelsHidden().frame(width: 120)
                    Button("Ajouter") { addTaskType() }
                        .disabled(newTaskName.isEmpty)
                }
            }

            Section("Données locales") {
                Button("Réinitialiser le cache local (re-télécharge tout)", role: .destructive) {
                    confirmReset = true
                }
            }
        }
        .formStyle(.grouped)
        .navigationTitle("Réglages")
        .modalCard(isPresented: $showingLogin) { LoginSheet() }
        .onAppear {
            baseURL = model.config.baseURL
            orgId = String(model.config.organizationId)
            userId = String(model.config.userId)
        }
        .confirmationDialog("Effacer le cache local ?", isPresented: $confirmReset) {
            Button("Effacer et resynchroniser", role: .destructive) {
                Task { await model.resetLocalData() }
            }
        } message: {
            Text("Les modifications locales non synchronisées seront perdues.")
        }
    }

    private func isDefault(_ v: Any?) -> Bool {
        if let b = v as? Bool { return b }
        if let i = v as? Int { return i != 0 }
        return false
    }

    private func rateLabel(_ v: Any?) -> String {
        if let s = v as? String, let d = Double(s) { return "\(Int(d)) %" }
        if let d = v as? Double { return "\(Int(d)) %" }
        if let i = v as? Int { return "\(i) %" }
        return "—"
    }

    private func addVat() {
        let r = Double(newVatRate.replacingOccurrences(of: ",", with: "."))
        guard !newVatName.isEmpty, let rate = r else { return }
        _ = try? model.store.localInsert(table: "vat_rates", payload: [
            "name": newVatName,
            "rate": String(format: "%.2f", rate),
            "is_default": false,
            "is_active": true,
        ])
        newVatName = ""; newVatRate = ""
        Task { await model.syncNow() }
    }

    private func addTaskType() {
        guard !newTaskName.isEmpty else { return }
        let rate = Double(newTaskRate.replacingOccurrences(of: ",", with: ".")) ?? 0
        _ = try? model.store.localInsert(table: "task_types", payload: [
            "name": newTaskName,
            "category": newTaskCategory,
            "hourly_rate": String(format: "%.2f", rate),
        ])
        newTaskName = ""; newTaskRate = ""
        Task { await model.syncNow() }
    }
}
