// Generates the RSM Studio app icon (1024×1024 PNG) — run: swift make-icon.swift <output.png>
import AppKit

let size = CGFloat(1024)
let image = NSImage(size: NSSize(width: size, height: size))
image.lockFocus()

// Background: rounded rect, studio-dark gradient
let inset = size * 0.05
let rect = NSRect(x: inset, y: inset, width: size - 2 * inset, height: size - 2 * inset)
let path = NSBezierPath(roundedRect: rect, xRadius: size * 0.18, yRadius: size * 0.18)
let gradient = NSGradient(colors: [
    NSColor(calibratedRed: 0.13, green: 0.15, blue: 0.23, alpha: 1),
    NSColor(calibratedRed: 0.05, green: 0.06, blue: 0.10, alpha: 1),
])!
gradient.draw(in: path, angle: -90)

// Accent waveform bars
let accent = NSColor(calibratedRed: 0.36, green: 0.56, blue: 0.98, alpha: 1)
let barWidth = size * 0.055
let gap = size * 0.035
let heights: [CGFloat] = [0.22, 0.38, 0.55, 0.42, 0.62, 0.35, 0.5, 0.28]
let totalWidth = CGFloat(heights.count) * barWidth + CGFloat(heights.count - 1) * gap
var x = (size - totalWidth) / 2
for h in heights {
    let barHeight = size * h * 0.7
    let barRect = NSRect(x: x, y: (size - barHeight) / 2, width: barWidth, height: barHeight)
    let barPath = NSBezierPath(roundedRect: barRect, xRadius: barWidth / 2, yRadius: barWidth / 2)
    accent.withAlphaComponent(0.55 + 0.45 * h / 0.62).setFill()
    barPath.fill()
    x += barWidth + gap
}

image.unlockFocus()

guard let tiff = image.tiffRepresentation,
      let rep = NSBitmapImageRep(data: tiff),
      let png = rep.representation(using: .png, properties: [:]) else {
    fatalError("PNG generation failed")
}
let output = CommandLine.arguments.count > 1 ? CommandLine.arguments[1] : "icon.png"
try! png.write(to: URL(fileURLWithPath: output))
print("Icon written to \(output)")
