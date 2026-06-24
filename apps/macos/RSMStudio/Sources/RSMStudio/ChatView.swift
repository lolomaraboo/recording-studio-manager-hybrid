import SwiftUI
import RSMCore

// MARK: - Shared chat state (one conversation across page, panel and window)

@Observable @MainActor
final class ChatStore {
    struct ChatMessage: Identifiable, Equatable {
        let id = UUID()
        let role: Role
        var text: String
        enum Role { case user, assistant, error }
    }

    var thread: [ChatMessage] = []
    var sessionId: String?
    var isThinking = false

    func reset() {
        thread = []
        sessionId = nil
    }

    func send(_ rawMessage: String, model: AppModel) {
        let message = rawMessage.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !message.isEmpty, !isThinking else { return }
        thread.append(ChatMessage(role: .user, text: message))
        isThinking = true

        Task {
            do {
                let api = APIClient(config: model.config)
                let result = try await api.aiChat(message: message, sessionId: sessionId)
                sessionId = result.sessionId
                thread.append(ChatMessage(role: .assistant, text: result.response))
                await model.syncNow() // the assistant may have created/changed records
            } catch {
                thread.append(ChatMessage(role: .error, text: "Assistant indisponible : \(error.localizedDescription)"))
            }
            isThinking = false
        }
    }
}

// MARK: - Chat UI (used full-page, in the right inspector and in its own window)

/// P3b — Assistant IA, branché sur le routeur tRPC `ai.chat` existant
/// (RAG Qdrant + actions métier côté serveur). Conversation multi-tours.
struct ChatView: View {
    @Environment(AppModel.self) private var model
    /// Compact layout (inspector panel): smaller paddings, no big empty state.
    var compact = false

    @State private var input = ""
    @FocusState private var inputFocused: Bool

    private var chat: ChatStore { model.chat }

    var body: some View {
        VStack(spacing: 0) {
            if chat.thread.isEmpty {
                emptyState
            } else {
                ScrollViewReader { proxy in
                    ScrollView {
                        LazyVStack(alignment: .leading, spacing: 12) {
                            ForEach(chat.thread) { message in
                                ChatBubble(message: message)
                                    .id(message.id)
                            }
                            if chat.isThinking {
                                HStack(spacing: 8) {
                                    ProgressView().controlSize(.small)
                                    Text("L'assistant réfléchit…").font(.caption).foregroundStyle(.secondary)
                                }
                                .id("thinking")
                            }
                        }
                        .padding(compact ? 8 : 16)
                    }
                    .onChange(of: chat.thread) {
                        withAnimation { proxy.scrollTo(chat.thread.last?.id, anchor: .bottom) }
                    }
                    .onChange(of: chat.isThinking) {
                        if chat.isThinking { withAnimation { proxy.scrollTo("thinking", anchor: .bottom) } }
                    }
                }
            }

            Divider()
            HStack(spacing: 8) {
                TextField("Demande-moi n'importe quoi…", text: $input, axis: .vertical)
                    .textFieldStyle(.plain)
                    .lineLimit(1...4)
                    .focused($inputFocused)
                    .onSubmit { send() }
                Button {
                    send()
                } label: {
                    Image(systemName: "arrow.up.circle.fill").font(.title2)
                }
                .buttonStyle(.plain)
                .foregroundStyle(input.isEmpty || chat.isThinking ? Color.secondary : Color.accentColor)
                .disabled(input.trimmingCharacters(in: .whitespaces).isEmpty || chat.isThinking)
            }
            .padding(compact ? 8 : 10)
        }
        .navigationTitle("Assistant")
        .toolbar {
            ToolbarItem {
                Button {
                    chat.reset()
                } label: {
                    Label("Nouvelle conversation", systemImage: "square.and.pencil")
                }
                .disabled(chat.thread.isEmpty)
            }
        }
        .onAppear { inputFocused = true }
    }

    private var emptyState: some View {
        VStack(spacing: compact ? 8 : 14) {
            Spacer()
            Image(systemName: "sparkles")
                .font(.system(size: compact ? 26 : 40)).foregroundStyle(.tint)
            if !compact {
                Text("Assistant du studio").font(.title3).bold()
                Text("Il connaît tes clients, sessions, projets et factures,\net peut agir pour toi.")
                    .multilineTextAlignment(.center)
                    .foregroundStyle(.secondary)
            }
            VStack(alignment: .leading, spacing: 6) {
                SuggestionButton(text: "Quelles sont mes sessions cette semaine ?") { ask($0) }
                SuggestionButton(text: "Résume l'activité du studio") { ask($0) }
                SuggestionButton(text: "Quelles factures sont impayées ?") { ask($0) }
            }
            Spacer()
        }
        .frame(maxWidth: .infinity)
    }

    private func ask(_ text: String) {
        input = text
        send()
    }

    private func send() {
        chat.send(input, model: model)
        input = ""
    }
}

struct SuggestionButton: View {
    let text: String
    let action: (String) -> Void

    var body: some View {
        Button {
            action(text)
        } label: {
            HStack {
                Image(systemName: "arrow.turn.down.right").font(.caption2)
                Text(text)
            }
            .font(.callout)
            .padding(.horizontal, 10).padding(.vertical, 5)
            .background(.quaternary, in: Capsule())
        }
        .buttonStyle(.plain)
    }
}

struct ChatBubble: View {
    let message: ChatStore.ChatMessage

    var body: some View {
        HStack {
            if message.role == .user { Spacer(minLength: 40) }
            VStack(alignment: .leading, spacing: 2) {
                Text(message.text)
                    .textSelection(.enabled)
                    .padding(.horizontal, 12).padding(.vertical, 8)
                    .background(background, in: RoundedRectangle(cornerRadius: 12))
                    .foregroundStyle(message.role == .user ? Color.white : Color.primary)
            }
            if message.role != .user { Spacer(minLength: 40) }
        }
    }

    private var background: AnyShapeStyle {
        switch message.role {
        case .user: AnyShapeStyle(Color.accentColor)
        case .assistant: AnyShapeStyle(.quaternary)
        case .error: AnyShapeStyle(Color.red.opacity(0.15))
        }
    }
}

// MARK: - Floating bubble (web-app style "minimized" assistant)

struct FloatingAssistantButton: View {
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            Image(systemName: "sparkles")
                .font(.title3)
                .foregroundStyle(.white)
                .frame(width: 44, height: 44)
                .background(Circle().fill(Color.accentColor).shadow(radius: 4, y: 2))
        }
        .buttonStyle(.plain)
        .padding(16)
        .help("Ouvrir l'assistant (⇧⌘A)")
    }
}
