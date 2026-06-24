import SwiftUI
import AVFoundation
import AppKit
import RSMCore

/// T2 — SoundCloud-style audio player: waveform, timestamped comments anchored
/// on the timeline, click-to-seek, add a comment at the current playhead.
///
/// Persistent & multi-presentation (like the assistant): the engine lives in
/// AppModel, so playback survives navigation and presentation changes. Shown
/// as a bottom bar (minimized), right-side panel, or its own window.
/// Comments persist to `track_comments` (offline-first), `timestamp` = seconds.
struct AudioPlayerView: View {
    @Environment(AppModel.self) private var model
    @Environment(\.openWindow) private var openWindow
    /// Compact = right panel / window; full = section view.
    var compact = false

    @State private var newComment = ""
    @State private var commentAtCurrentTime = false

    private var track: Track? { model.playerTrack }
    private var engine: AudioEngine { model.audioEngine }

    private var comments: [TrackCommentItem] {
        _ = model.dataVersion
        guard let serverId = track?.int("id") else { return [] }
        return model.store.trackComments(trackServerId: serverId)
    }

    private var storedURLs: [(label: String, url: String)] {
        guard let track else { return [] }
        return [("Master", track.string("master_url")),
                ("Mix final", track.string("final_mix_url")),
                ("Rough mix", track.string("rough_mix_url")),
                ("Démo", track.string("demo_url")),
                ("Fichier", track.string("file_url"))]
            .compactMap { label, url in url.map { (label, $0) } }
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            // Header with presentation controls
            HStack(spacing: 8) {
                Image(systemName: "waveform").foregroundStyle(.tint)
                VStack(alignment: .leading, spacing: 1) {
                    Text(track?.title ?? "Lecteur").font(.headline).lineLimit(1)
                    Text(model.playerSourceLabel).font(.caption2).foregroundStyle(.secondary)
                }
                Spacer()
                presentationMenu
            }

            if track == nil {
                Spacer()
                Text("Aucune piste sélectionnée").foregroundStyle(.secondary)
                    .frame(maxWidth: .infinity)
                Spacer()
            } else {
                playerBody
            }
        }
        .padding(compact ? 12 : 16)
    }

    private var presentationMenu: some View {
        HStack(spacing: 4) {
            Button { model.playerMode = .bar } label: { Image(systemName: "minus") }
                .help("Réduire en barre")
            Button { model.playerMode = .panel } label: { Image(systemName: "sidebar.right") }
                .help("Panneau latéral")
            Button {
                model.playerMode = .window
                openWindow(id: "player")
            } label: { Image(systemName: "macwindow") }
                .help("Fenêtre séparée")
            Button { model.closePlayer() } label: { Image(systemName: "xmark") }
                .help("Fermer le lecteur")
        }
        .buttonStyle(.borderless)
        .labelStyle(.iconOnly)
    }

    @ViewBuilder
    private var playerBody: some View {
        // Source picker
        if storedURLs.count > 1 {
            HStack(spacing: 6) {
                ForEach(storedURLs, id: \.label) { item in
                    Button(item.label) {
                        if let url = URL(string: item.url), let track {
                            model.loadPlayerAudio(for: track, urlOverride: url, label: item.label)
                        }
                    }
                    .buttonStyle(.bordered).controlSize(.small)
                }
                Button { pickLocalFile() } label: { Image(systemName: "folder") }
                    .buttonStyle(.bordered).controlSize(.small)
            }
        }

        WaveformView(
            samples: model.playerWaveform,
            progress: engine.duration > 0 ? engine.currentTime / engine.duration : 0,
            comments: comments,
            duration: engine.duration,
            loading: model.playerLoadingWaveform,
            onSeek: { fraction in engine.seek(to: fraction * engine.duration) }
        )
        .frame(height: compact ? 80 : 120)

        // Transport
        HStack(spacing: 14) {
            Button { engine.togglePlay() } label: {
                Image(systemName: engine.isPlaying ? "pause.circle.fill" : "play.circle.fill")
                    .font(.system(size: compact ? 30 : 36))
            }
            .buttonStyle(.plain)
            .disabled(!engine.isLoaded)

            Text("\(timeString(engine.currentTime)) / \(timeString(engine.duration))")
                .font(.callout.monospacedDigit()).foregroundStyle(.secondary)
            Spacer()
        }

        Divider()

        HStack(spacing: 6) {
            Toggle(isOn: $commentAtCurrentTime) { Image(systemName: "mappin.and.ellipse") }
                .toggleStyle(.button)
                .help(commentAtCurrentTime ? "Ancré à \(timeString(engine.currentTime))" : "Commentaire général")
            TextField(commentAtCurrentTime ? "Commentaire à \(timeString(engine.currentTime))…" : "Ajouter un commentaire…",
                      text: $newComment)
                .textFieldStyle(.roundedBorder)
                .onSubmit { addComment() }
            Button("OK") { addComment() }
                .disabled(newComment.trimmingCharacters(in: .whitespaces).isEmpty)
        }

        if comments.isEmpty {
            Text("Lance la lecture et ajoute un retour ancré dans le temps, façon SoundCloud.")
                .font(.caption).foregroundStyle(.secondary)
        } else {
            ScrollView {
                VStack(alignment: .leading, spacing: 0) {
                    ForEach(comments) { comment in
                        CommentRow(comment: comment, timeString: timeString) {
                            engine.seek(to: comment.timestampSeconds)
                        } onResolve: {
                            let newStatus = comment.status == "resolved" ? "open" : "resolved"
                            try? model.store.localUpdate(table: "track_comments", uuid: comment.id, changes: ["status": newStatus])
                            Task { await model.syncNow() }
                        }
                        Divider()
                    }
                }
            }
            .frame(maxHeight: compact ? .infinity : 200)
        }
    }

    private func pickLocalFile() {
        let panel = NSOpenPanel()
        panel.allowedContentTypes = [.audio]
        panel.allowsMultipleSelection = false
        guard panel.runModal() == .OK, let url = panel.url, let track else { return }
        model.loadPlayerAudio(for: track, urlOverride: url, label: url.lastPathComponent)
    }

    private func addComment() {
        let text = newComment.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !text.isEmpty, let trackServerId = track?.int("id") else { return }
        let timestamp = commentAtCurrentTime ? engine.currentTime : 0
        let author = model.config.userName ?? model.config.userEmail ?? "Studio"
        _ = try? model.store.localInsert(table: "track_comments", payload: [
            "track_id": trackServerId,
            "version_type": versionKey(for: model.playerSourceLabel),
            "author_id": model.config.userId,
            "author_name": author,
            "author_type": "staff",
            "content": text,
            "timestamp": String(format: "%.3f", timestamp),
            "status": "open",
        ])
        newComment = ""
        Task { await model.syncNow() }
    }

    private func versionKey(for label: String) -> String {
        switch label {
        case "Master": "master"
        case "Mix final": "finalMix"
        case "Rough mix": "roughMix"
        case "Démo": "demo"
        default: "finalMix"
        }
    }

    private func timeString(_ seconds: Double) -> String {
        guard seconds.isFinite, seconds >= 0 else { return "0:00" }
        let total = Int(seconds)
        return String(format: "%d:%02d", total / 60, total % 60)
    }
}

// MARK: - Minimized bottom bar

struct MiniPlayerBar: View {
    @Environment(AppModel.self) private var model
    private var engine: AudioEngine { model.audioEngine }

    var body: some View {
        HStack(spacing: 12) {
            Image(systemName: "waveform").foregroundStyle(.tint)
            Button { engine.togglePlay() } label: {
                Image(systemName: engine.isPlaying ? "pause.fill" : "play.fill")
            }
            .buttonStyle(.plain)
            .disabled(!engine.isLoaded)

            Text(model.playerTrack?.title ?? "Lecteur").lineLimit(1).font(.callout)

            // Slim progress bar
            GeometryReader { geo in
                let progress = engine.duration > 0 ? engine.currentTime / engine.duration : 0
                ZStack(alignment: .leading) {
                    Capsule().fill(.quaternary).frame(height: 4)
                    Capsule().fill(Color.accentColor).frame(width: geo.size.width * progress, height: 4)
                }
                .frame(maxHeight: .infinity)
                .contentShape(Rectangle())
                .onTapGesture { location in
                    engine.seek(to: (location.x / geo.size.width) * engine.duration)
                }
            }
            .frame(height: 16)

            Text(timeString(engine.currentTime)).font(.caption.monospacedDigit()).foregroundStyle(.secondary)

            Button { model.playerMode = .panel } label: { Image(systemName: "sidebar.right") }
                .buttonStyle(.borderless).help("Agrandir en panneau")
            Button { model.closePlayer() } label: { Image(systemName: "xmark") }
                .buttonStyle(.borderless).help("Fermer")
        }
        .padding(.horizontal, 12).padding(.vertical, 6)
        .background(.bar)
    }

    private func timeString(_ seconds: Double) -> String {
        guard seconds.isFinite, seconds >= 0 else { return "0:00" }
        let total = Int(seconds)
        return String(format: "%d:%02d", total / 60, total % 60)
    }
}

// MARK: - Waveform view (bars + progress + comment pins)

struct WaveformView: View {
    let samples: [Float]
    let progress: Double
    let comments: [TrackCommentItem]
    let duration: Double
    let loading: Bool
    let onSeek: (Double) -> Void

    var body: some View {
        GeometryReader { geo in
            ZStack(alignment: .leading) {
                if loading {
                    ProgressView("Analyse de la forme d'onde…")
                        .frame(maxWidth: .infinity, maxHeight: .infinity)
                } else if samples.isEmpty {
                    RoundedRectangle(cornerRadius: 6).fill(.quaternary)
                        .overlay(Text("Charge un fichier audio").font(.caption).foregroundStyle(.secondary))
                } else {
                    // Bars
                    HStack(alignment: .center, spacing: 1) {
                        ForEach(Array(samples.enumerated()), id: \.offset) { index, sample in
                            let played = Double(index) / Double(samples.count) <= progress
                            RoundedRectangle(cornerRadius: 1)
                                .fill(played ? Color.accentColor : Color.secondary.opacity(0.35))
                                .frame(height: max(2, CGFloat(sample) * geo.size.height))
                        }
                    }
                    .frame(maxHeight: .infinity)

                    // Playhead
                    Rectangle().fill(.primary).frame(width: 1.5)
                        .offset(x: geo.size.width * progress)

                    // Comment pins
                    ForEach(comments) { comment in
                        if duration > 0 {
                            let x = geo.size.width * (comment.timestampSeconds / duration)
                            Image(systemName: "mappin.circle.fill")
                                .font(.caption)
                                .foregroundStyle(comment.status == "resolved" ? .green : .orange)
                                .offset(x: x - 6, y: -geo.size.height / 2 + 6)
                                .help("\(comment.authorName): \(comment.content)")
                        }
                    }
                }
            }
            .contentShape(Rectangle())
            .onTapGesture { location in
                onSeek(min(max(location.x / geo.size.width, 0), 1))
            }
        }
    }
}

struct CommentRow: View {
    let comment: TrackCommentItem
    let timeString: (Double) -> String
    let onSeek: () -> Void
    let onResolve: () -> Void

    var body: some View {
        HStack(alignment: .top, spacing: 8) {
            Button {
                onSeek()
            } label: {
                Text(timeString(comment.timestampSeconds))
                    .font(.caption.monospacedDigit())
                    .padding(.horizontal, 6).padding(.vertical, 2)
                    .background(.tint.opacity(0.15), in: Capsule())
            }
            .buttonStyle(.plain)

            VStack(alignment: .leading, spacing: 1) {
                HStack(spacing: 4) {
                    Text(comment.authorName).font(.caption).bold()
                    if comment.status == "resolved" {
                        Image(systemName: "checkmark.circle.fill").font(.caption2).foregroundStyle(.green)
                    }
                }
                Text(comment.content).font(.callout)
                    .strikethrough(comment.status == "resolved")
            }
            Spacer()
            Button {
                onResolve()
            } label: {
                Image(systemName: comment.status == "resolved" ? "arrow.uturn.backward" : "checkmark")
                    .font(.caption)
            }
            .buttonStyle(.borderless)
            .help(comment.status == "resolved" ? "Rouvrir" : "Marquer résolu")
        }
        .padding(.vertical, 6)
    }
}

// MARK: - AVFoundation playback engine

@Observable
final class AudioEngine {
    private var player: AVPlayer?
    private var timeObserver: Any?
    private var endObserver: NSObjectProtocol?

    var isPlaying = false
    var isLoaded = false
    var currentTime: Double = 0
    var duration: Double = 0

    func load(url: URL) {
        stop()
        let item = AVPlayerItem(url: url)
        let player = AVPlayer(playerItem: item)
        self.player = player
        isLoaded = true
        currentTime = 0
        duration = 0

        // Duration (async)
        Task { [weak self] in
            let asset = item.asset
            if let d = try? await asset.load(.duration) {
                let seconds = CMTimeGetSeconds(d)
                await MainActor.run { self?.duration = seconds.isFinite ? seconds : 0 }
            }
        }

        // Playhead updates
        let interval = CMTime(seconds: 0.05, preferredTimescale: 600)
        timeObserver = player.addPeriodicTimeObserver(forInterval: interval, queue: .main) { [weak self] time in
            self?.currentTime = CMTimeGetSeconds(time)
        }

        endObserver = NotificationCenter.default.addObserver(forName: .AVPlayerItemDidPlayToEndTime, object: item, queue: .main) { [weak self] _ in
            self?.isPlaying = false
            self?.player?.seek(to: .zero)
            self?.currentTime = 0
        }
    }

    func togglePlay() {
        guard let player else { return }
        if isPlaying { player.pause() } else { player.play() }
        isPlaying.toggle()
    }

    func seek(to seconds: Double) {
        guard let player, seconds.isFinite else { return }
        player.seek(to: CMTime(seconds: max(0, seconds), preferredTimescale: 600))
        currentTime = seconds
    }

    func stop() {
        player?.pause()
        if let timeObserver { player?.removeTimeObserver(timeObserver) }
        timeObserver = nil
        if let endObserver { NotificationCenter.default.removeObserver(endObserver) }
        endObserver = nil
        player = nil
        isPlaying = false
        isLoaded = false
    }
}

// MARK: - Waveform generation (AVAssetReader → RMS buckets)

enum WaveformGenerator {
    /// Returns normalized 0…1 amplitudes. Empty on failure (remote/unreadable
    /// files) — the UI shows a flat placeholder but playback still works.
    static func generate(from url: URL, buckets: Int) async -> [Float] {
        let asset = AVURLAsset(url: url)
        guard let track = try? await asset.loadTracks(withMediaType: .audio).first,
              let reader = try? AVAssetReader(asset: asset) else { return [] }

        let settings: [String: Any] = [
            AVFormatIDKey: kAudioFormatLinearPCM,
            AVLinearPCMBitDepthKey: 16,
            AVLinearPCMIsBigEndianKey: false,
            AVLinearPCMIsFloatKey: false,
            AVLinearPCMIsNonInterleaved: false,
        ]
        let output = AVAssetReaderTrackOutput(track: track, outputSettings: settings)
        guard reader.canAdd(output) else { return [] }
        reader.add(output)
        guard reader.startReading() else { return [] }

        // Streaming RMS: fold samples into fixed-size blocks as they arrive so
        // the full decoded PCM NEVER sits in RAM (a 1 h hi-res file used to
        // allocate >1 GB here and could exhaust the machine's memory).
        let blockSize = 4096
        var blockRMS: [Float] = []   // ~1 float / 4096 samples → a few hundred KB max
        var sumSquares: Float = 0
        var count = 0

        while reader.status == .reading, let buffer = output.copyNextSampleBuffer() {
            if Task.isCancelled { reader.cancelReading(); return [] }
            guard let blockBuffer = CMSampleBufferGetDataBuffer(buffer) else { continue }
            let length = CMBlockBufferGetDataLength(blockBuffer)
            var data = Data(count: length)
            data.withUnsafeMutableBytes { ptr in
                _ = CMBlockBufferCopyDataBytes(blockBuffer, atOffset: 0, dataLength: length, destination: ptr.baseAddress!)
            }
            data.withUnsafeBytes { (ptr: UnsafeRawBufferPointer) in
                for sample in ptr.bindMemory(to: Int16.self) {
                    let v = Float(sample) / Float(Int16.max)
                    sumSquares += v * v
                    count += 1
                    if count == blockSize {
                        blockRMS.append((sumSquares / Float(count)).squareRoot())
                        sumSquares = 0
                        count = 0
                    }
                }
            }
            CMSampleBufferInvalidate(buffer)
        }
        if count > 0 { blockRMS.append((sumSquares / Float(count)).squareRoot()) }

        guard !blockRMS.isEmpty else { return [] }
        // Re-bucket block-level RMS into the requested resolution
        // (RMS of RMS values over equal-size blocks ≈ RMS of the raw samples).
        let bucketSize = max(1, blockRMS.count / buckets)
        var result: [Float] = []
        result.reserveCapacity(buckets)
        var index = 0
        while index < blockRMS.count {
            let end = min(index + bucketSize, blockRMS.count)
            var sum: Float = 0
            for i in index..<end { sum += blockRMS[i] * blockRMS[i] }
            result.append((sum / Float(end - index)).squareRoot())
            index += bucketSize
        }
        // Normalize to 0…1
        let maxVal = result.max() ?? 1
        return maxVal > 0 ? result.map { min(1, $0 / maxVal) } : result
    }
}
