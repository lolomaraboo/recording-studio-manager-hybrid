import SwiftUI
import RSMCore

struct LoginSheet: View {
    @Environment(\.modalDismiss) private var dismiss
    @Environment(AppModel.self) private var model

    @State private var email = ""
    @State private var password = ""
    @State private var isLoading = false
    @State private var errorMessage: String?

    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            HStack {
                Image(systemName: "person.badge.key")
                    .font(.title2).foregroundStyle(.tint)
                Text("Connexion au studio").font(.title3).bold()
            }
            .padding()

            Form {
                TextField("Email", text: $email)
                    .textContentType(.username)
                SecureField("Mot de passe", text: $password)
                    .textContentType(.password)
                if let errorMessage {
                    Text(errorMessage).font(.caption).foregroundStyle(.red)
                }
            }
            .formStyle(.grouped)
            .disabled(isLoading)

            HStack {
                Spacer()
                Button("Annuler") { dismiss() }.keyboardShortcut(.escape)
                Button {
                    Task { await login() }
                } label: {
                    if isLoading { ProgressView().controlSize(.small) } else { Text("Se connecter") }
                }
                .keyboardShortcut(.return)
                .buttonStyle(.borderedProminent)
                .disabled(email.isEmpty || password.isEmpty || isLoading)
            }
            .padding()
        }
        .frame(width: 380, height: 260)
    }

    private func login() async {
        isLoading = true
        errorMessage = nil
        defer { isLoading = false }
        do {
            let result = try await AuthService.login(baseURL: model.config.baseURL, email: email, password: password)
            var config = model.config
            // Switching organization? Drop the local cache (different tenant).
            if config.organizationId != result.organizationId {
                try? model.store.reset()
            }
            config.authMode = "account"
            config.userId = result.userId
            config.organizationId = result.organizationId
            config.userEmail = result.userEmail
            config.userName = result.userName
            config.organizationName = result.organizationName
            model.config = config
            await model.syncNow()
            dismiss()
        } catch {
            errorMessage = error.localizedDescription
        }
    }
}
