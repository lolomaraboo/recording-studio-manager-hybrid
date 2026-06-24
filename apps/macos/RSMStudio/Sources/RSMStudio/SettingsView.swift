import SwiftUI
import RSMCore

struct SettingsView: View {
    @Environment(AppModel.self) private var model

    @State private var baseURL = ""
    @State private var orgId = ""
    @State private var userId = ""
    @State private var confirmReset = false
    @State private var showingLogin = false

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
}
