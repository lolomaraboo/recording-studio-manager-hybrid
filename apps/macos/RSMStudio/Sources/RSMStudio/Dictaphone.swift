import Foundation
import Speech
import AVFoundation

/// Dictaphone — on-device live transcription of the microphone (Speech +
/// AVAudioEngine). The resulting transcript is sent to the RSM assistant.
/// Note: Apple's Voice Memos app exposes no API for its recordings, so RSM
/// records directly here. Permissions: NSMicrophoneUsageDescription +
/// NSSpeechRecognitionUsageDescription (declared in Info.plist).
@MainActor
final class Dictaphone: ObservableObject {
    @Published var transcript = ""
    @Published var isRecording = false
    @Published var isTranscribing = false
    @Published var error: String?

    private let engine = AVAudioEngine()
    private var request: SFSpeechAudioBufferRecognitionRequest?
    private var task: SFSpeechRecognitionTask?
    private let recognizer = SFSpeechRecognizer(locale: Locale(identifier: "fr-FR"))

    func toggle() { if isRecording { _ = stop() } else { start() } }

    func start() {
        error = nil
        transcript = ""
        SFSpeechRecognizer.requestAuthorization { [weak self] status in
            Task { @MainActor in
                guard let self else { return }
                guard status == .authorized else {
                    self.error = "Reconnaissance vocale non autorisée (Réglages › Confidentialité)."
                    return
                }
                self.beginAudio()
            }
        }
    }

    private func beginAudio() {
        guard let recognizer, recognizer.isAvailable else {
            error = "Reconnaissance vocale indisponible."
            return
        }
        let request = SFSpeechAudioBufferRecognitionRequest()
        request.shouldReportPartialResults = true
        self.request = request

        let input = engine.inputNode
        let format = input.outputFormat(forBus: 0)
        input.installTap(onBus: 0, bufferSize: 1024, format: format) { [weak self] buffer, _ in
            self?.request?.append(buffer)
        }
        engine.prepare()
        do {
            try engine.start()
        } catch {
            self.error = error.localizedDescription
            input.removeTap(onBus: 0)
            return
        }
        isRecording = true
        task = recognizer.recognitionTask(with: request) { [weak self] result, _ in
            guard let self, let result else { return }
            Task { @MainActor in self.transcript = result.bestTranscription.formattedString }
        }
    }

    /// Transcribes an existing audio file (imported file or Voice Memos
    /// recording). On-device recognition is used when available so long phone
    /// recordings aren't truncated by the 1-minute server limit.
    func transcribeFile(_ url: URL) async -> String {
        isTranscribing = true
        error = nil
        defer { isTranscribing = false }

        guard FileManager.default.fileExists(atPath: url.path) else {
            error = "Fichier audio introuvable."
            return ""
        }
        let authorized = await withCheckedContinuation { (c: CheckedContinuation<Bool, Never>) in
            SFSpeechRecognizer.requestAuthorization { c.resume(returning: $0 == .authorized) }
        }
        guard authorized else {
            error = "Reconnaissance vocale non autorisée (Réglages › Confidentialité › Reconnaissance vocale)."
            return ""
        }
        guard let recognizer, recognizer.isAvailable else {
            error = "Reconnaissance vocale indisponible pour le français."
            return ""
        }

        // 1) On-device first (no network, no 1-minute limit → handles long calls).
        if recognizer.supportsOnDeviceRecognition {
            let r = await recognize(url, recognizer: recognizer, onDevice: true)
            if !r.text.isEmpty { return r.text }
        }
        // 2) Fallback: server-based recognition.
        let r2 = await recognize(url, recognizer: recognizer, onDevice: false)
        if r2.text.isEmpty {
            error = "Transcription vide" + (r2.error.map { " : \($0)" } ?? " (aucune parole reconnue).")
        }
        return r2.text
    }

    private func recognize(_ url: URL, recognizer: SFSpeechRecognizer, onDevice: Bool)
        async -> (text: String, error: String?) {
        let request = SFSpeechURLRecognitionRequest(url: url)
        request.shouldReportPartialResults = false
        request.requiresOnDeviceRecognition = onDevice
        return await withCheckedContinuation { (cont: CheckedContinuation<(text: String, error: String?), Never>) in
            var done = false
            recognizer.recognitionTask(with: request) { result, err in
                if let result, result.isFinal {
                    if !done { done = true; cont.resume(returning: (result.bestTranscription.formattedString, nil)) }
                } else if let err {
                    if !done { done = true; cont.resume(returning: ("", err.localizedDescription)) }
                }
            }
        }
    }

    /// Stops recording and returns the final transcript.
    @discardableResult
    func stop() -> String {
        if engine.isRunning {
            engine.stop()
            engine.inputNode.removeTap(onBus: 0)
        }
        request?.endAudio()
        task?.cancel()
        task = nil
        request = nil
        isRecording = false
        return transcript
    }
}
