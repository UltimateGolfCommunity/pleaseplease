import AppKit
import AVFoundation

let source = URL(fileURLWithPath: CommandLine.arguments[1])
let outputDirectory = URL(fileURLWithPath: CommandLine.arguments[2], isDirectory: true)
try FileManager.default.createDirectory(at: outputDirectory, withIntermediateDirectories: true)

let asset = AVURLAsset(url: source)
let duration = try await asset.load(.duration)
let tracks = try await asset.loadTracks(withMediaType: .video)
guard let track = tracks.first else { fatalError("No video track found.") }
let naturalSize = try await track.load(.naturalSize)
let transform = try await track.load(.preferredTransform)
print("duration=\(CMTimeGetSeconds(duration)) size=\(naturalSize) transform=\(transform)")

let generator = AVAssetImageGenerator(asset: asset)
generator.appliesPreferredTrackTransform = true
generator.requestedTimeToleranceBefore = .zero
generator.requestedTimeToleranceAfter = .zero
let points = [0.0, 0.15, 0.3, 0.45, 0.6, 0.75, 0.9].map { $0 * CMTimeGetSeconds(duration) }
for (index, seconds) in points.enumerated() {
  let image = try generator.copyCGImage(at: CMTime(seconds: seconds, preferredTimescale: 600), actualTime: nil)
  let representation = NSBitmapImageRep(cgImage: image)
  let destination = outputDirectory.appendingPathComponent(String(format: "reference-%02d.png", index + 1))
  try representation.representation(using: .png, properties: [:])?.write(to: destination)
  print(destination.path)
}
