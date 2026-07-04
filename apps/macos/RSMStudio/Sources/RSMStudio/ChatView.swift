import SwiftUI
import AppKit
import UniformTypeIdentifiers
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
    @StateObject private var dictaphone = Dictaphone()
    @State private var showingMemos = false
    @State private var showingNotes = false

    private var chat: ChatStore { model.chat }

    var body: some View {
        VStack(spacing: 0) {
            // Compact side-panel header (the panel has no toolbar of its own).
            if compact {
                HStack(spacing: 6) {
                    Image(systemName: "sparkles").foregroundStyle(.tint)
                    Text("Assistant").font(.headline)
                    Spacer()
                    Button { chat.reset() } label: {
                        Image(systemName: "square.and.pencil")
                    }
                    .buttonStyle(.plain).foregroundStyle(.secondary)
                    .disabled(chat.thread.isEmpty)
                    .help("Nouvelle conversation")
                    Button { model.chatPanelOpen = false } label: {
                        Image(systemName: "xmark")
                    }
                    .buttonStyle(.plain).foregroundStyle(.secondary)
                    .help("Fermer le panneau")
                }
                .padding(.horizontal, 10).padding(.vertical, 8)
                Divider()
            }

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

            if let micError = dictaphone.error {
                Text(micError).font(.caption).foregroundStyle(.red)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .padding(.horizontal, compact ? 8 : 10)
            }
            if dictaphone.isTranscribing {
                HStack(spacing: 6) {
                    ProgressView().controlSize(.small)
                    Text("Transcription en cours…").font(.caption).foregroundStyle(.secondary)
                }
                .frame(maxWidth: .infinity, alignment: .leading)
                .padding(.horizontal, compact ? 8 : 10)
            }
            Divider()
            HStack(spacing: 8) {
                Menu {
                    Button { importFile() } label: {
                        Label("Choisir un fichier audio…", systemImage: "folder")
                    }
                    Button { showingMemos = true } label: {
                        Label("Depuis Dictaphone…", systemImage: "mic.square")
                    }
                    Button { showingNotes = true } label: {
                        Label("Depuis Notes (appels)…", systemImage: "note.text")
                    }
                } label: {
                    Image(systemName: "tray.and.arrow.down.fill").font(.title3)
                }
                .menuStyle(.borderlessButton)
                .menuIndicator(.hidden)
                .frame(width: 22)
                .disabled(chat.isThinking || dictaphone.isTranscribing)
                .help("Importer un enregistrement à transcrire (fichier ou Dictaphone)")

                Button {
                    micToggle()
                } label: {
                    Image(systemName: dictaphone.isRecording ? "stop.circle.fill" : "mic.circle.fill")
                        .font(.title2)
                        .symbolEffect(.pulse, isActive: dictaphone.isRecording)
                }
                .buttonStyle(.plain)
                .foregroundStyle(dictaphone.isRecording ? Color.red : Color.accentColor)
                .disabled(chat.isThinking)
                .help(dictaphone.isRecording ? "Arrêter et envoyer à l'assistant" : "Dicter une conversation")

                TextField(dictaphone.isRecording ? "Dictée en cours…" : "Demande-moi n'importe quoi…", text: $input, axis: .vertical)
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
        // Opaque background so the main content doesn't bleed through the
        // side panel (the panel is attached via safeAreaInset).
        .background(compact ? AnyShapeStyle(Color(nsColor: .windowBackgroundColor)) : AnyShapeStyle(.clear))
        .onChange(of: dictaphone.transcript) {
            if dictaphone.isRecording { input = dictaphone.transcript }
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
        .modalCard(isPresented: $showingMemos) {
            VoiceMemosSheet { url in transcribeAndSend(url) }
        }
        .modalCard(isPresented: $showingNotes) {
            NotesRecordingsSheet { noteId, fileName in transcribeNote(noteId, fileName) }
        }
    }

    private var emptyState: some View {
        VStack(spacing: compact ? 10 : 14) {
            // Full-page centers vertically; the compact side panel top-aligns so
            // the suggestions sit just under the header instead of floating in a
            // large blank area.
            if !compact { Spacer() }
            if compact {
                Text("Quelques idées pour démarrer")
                    .font(.caption).foregroundStyle(.secondary)
                    .frame(maxWidth: .infinity, alignment: .leading)
            } else {
                Image(systemName: "sparkles")
                    .font(.system(size: 40)).foregroundStyle(.tint)
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
            .frame(maxWidth: .infinity, alignment: compact ? .leading : .center)
            Spacer()
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: compact ? .top : .center)
        .padding(compact ? 12 : 0)
    }

    private func ask(_ text: String) {
        input = text
        send()
    }

    private func send() {
        chat.send(input, model: model)
        input = ""
    }

    /// Mic button: start dictation, or stop and send the transcript straight to
    /// the assistant.
    private func micToggle() {
        if dictaphone.isRecording {
            input = dictaphone.stop()
            send()
        } else {
            dictaphone.start()
        }
    }

    /// Pick any audio file, transcribe it, send to the assistant.
    private func importFile() {
        let panel = NSOpenPanel()
        panel.allowedContentTypes = [.audio]
        panel.allowsMultipleSelection = false
        panel.canChooseDirectories = false
        guard panel.runModal() == .OK, let url = panel.url else { return }
        transcribeAndSend(url)
    }

    /// Transcribe an audio file (imported or Voice Memos) and send the text to
    /// the assistant as a client-conversation transcript.
    private func transcribeAndSend(_ url: URL) {
        Task {
            let text = await dictaphone.transcribeFile(url)
            let trimmed = text.trimmingCharacters(in: .whitespacesAndNewlines)
            guard !trimmed.isEmpty else { return }
            chat.send("Transcription d'une conversation client :\n\n\(trimmed)", model: model)
        }
    }

    /// Export a Notes call recording's audio, transcribe it, send to the assistant.
    private func transcribeNote(_ noteId: String, _ fileName: String) {
        Task {
            dictaphone.isTranscribing = true
            guard let url = await SystemImport.exportNoteAudio(noteId: noteId, fileName: fileName) else {
                dictaphone.isTranscribing = false
                dictaphone.error = "Impossible d'extraire l'audio de cette note."
                return
            }
            let text = await dictaphone.transcribeFile(url)
            let trimmed = text.trimmingCharacters(in: .whitespacesAndNewlines)
            guard !trimmed.isEmpty else { return }
            chat.send("Transcription d'un appel client (Notes) :\n\n\(trimmed)", model: model)
        }
    }
}

// MARK: - Voice Memos picker

struct VoiceMemosSheet: View {
    @Environment(\.modalDismiss) private var dismiss
    let onPick: (URL) -> Void

    @State private var memos: [VoiceMemo] = []
    @State private var loading = true

    private static let df: DateFormatter = {
        let f = DateFormatter(); f.locale = Locale(identifier: "fr_FR")
        f.dateFormat = "EEE d MMM yyyy, HH:mm"; return f
    }()

    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            Text("Enregistrements Dictaphone").font(.title3).bold().padding()
            if loading {
                VStack { Spacer(); ProgressView(); Spacer() }.frame(maxWidth: .infinity)
            } else if memos.isEmpty {
                VStack(spacing: 8) {
                    Spacer()
                    Image(systemName: "waveform.slash").font(.largeTitle).foregroundStyle(.secondary)
                    Text("Aucun enregistrement trouvé.").foregroundStyle(.secondary)
                    Spacer()
                }
                .frame(maxWidth: .infinity).padding()
            } else {
                List(memos) { m in
                    Button {
                        onPick(m.url)
                        dismiss()
                    } label: {
                        HStack {
                            Image(systemName: "waveform").foregroundStyle(.tint)
                            VStack(alignment: .leading, spacing: 1) {
                                Text(m.name)
                                Text(Self.df.string(from: m.date)).font(.caption).foregroundStyle(.secondary)
                            }
                            Spacer()
                            Image(systemName: "text.bubble").foregroundStyle(.secondary)
                        }
                    }
                    .buttonStyle(.plain)
                }
            }
            HStack {
                Spacer()
                Button("Fermer") { dismiss() }.keyboardShortcut(.escape)
            }
            .padding()
        }
        .frame(width: 460, height: 520)
        .task {
            memos = SystemImport.voiceMemos()
            loading = false
        }
    }
}

// MARK: - Notes call recordings picker

struct NotesRecordingsSheet: View {
    @Environment(\.modalDismiss) private var dismiss
    let onPick: (String, String) -> Void   // note id, attachment file name

    @State private var recordings: [NoteRecording] = []
    @State private var loading = true

    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            Text("Enregistrements d'appels (Notes)").font(.title3).bold().padding()
            if loading {
                VStack { Spacer(); ProgressView("Lecture des notes…"); Spacer() }
                    .frame(maxWidth: .infinity)
            } else if recordings.isEmpty {
                VStack(spacing: 8) {
                    Spacer()
                    Image(systemName: "note.text").font(.largeTitle).foregroundStyle(.secondary)
                    Text("Aucun enregistrement audio dans Notes.").foregroundStyle(.secondary)
                    Text("Autorise l'accès à Notes si macOS le demande.")
                        .font(.caption).foregroundStyle(.secondary).multilineTextAlignment(.center)
                    Spacer()
                }
                .frame(maxWidth: .infinity).padding()
            } else {
                List(recordings) { r in
                    Button {
                        onPick(r.id, r.attachment)
                        dismiss()
                    } label: {
                        HStack {
                            Image(systemName: "phone.bubble").foregroundStyle(.tint)
                            VStack(alignment: .leading, spacing: 1) {
                                Text(r.title)
                                Text(r.attachment + (r.date.isEmpty ? "" : " · \(r.date)"))
                                    .font(.caption).foregroundStyle(.secondary).lineLimit(1)
                            }
                            Spacer()
                        }
                    }
                    .buttonStyle(.plain)
                }
            }
            HStack {
                Spacer()
                Button("Fermer") { dismiss() }.keyboardShortcut(.escape)
            }
            .padding()
        }
        .frame(width: 480, height: 520)
        .task {
            recordings = await SystemImport.noteRecordings()
            loading = false
        }
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
