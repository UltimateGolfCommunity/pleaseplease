import AppKit
import AVFoundation
import CoreVideo

let root = URL(fileURLWithPath: CommandLine.arguments.dropFirst().first ?? FileManager.default.currentDirectoryPath)
let outputDirectory = root.appendingPathComponent("app-store-screenshots/2026-09-09/app-preview-video")
let outputURL = outputDirectory.appendingPathComponent("ugc-country-club-app-preview.mp4")
let scenes: [(path: String, seconds: Double)] = [
  ("2026-09-09/iphone-65-promotional/preview-title-01.png", 2.8),
  ("2026-09-09/current-ugc-screens/01-home.png", 3.8),
  ("2026-09-09/iphone-65-promotional/preview-title-02.png", 2.4),
  ("2026-09-09/current-ugc-screens/02-profile.png", 3.8),
  ("2026-09-09/iphone-65-promotional/preview-title-03.png", 2.4),
  ("2026-09-09/iphone-65-promotional/crossville-cup-scores-raw.png", 4.2),
  ("2026-09-09/iphone-65-promotional/preview-title-04.png", 2.4),
  ("2026-09-09/current-ugc-screens/04-member-card.png", 3.8)
]
let images = scenes.compactMap { scene -> CGImage? in
  let url = root.appendingPathComponent("app-store-screenshots/").appendingPathComponent(scene.path)
  return NSImage(contentsOf: url)?.cgImage(forProposedRect: nil, context: nil, hints: nil)
}

guard images.count == scenes.count else { fatalError("One or more preview scenes were not found.") }
try FileManager.default.createDirectory(at: outputDirectory, withIntermediateDirectories: true)
try? FileManager.default.removeItem(at: outputURL)

// App Store Connect's current portrait App Preview requirement.
let width = 886
let height = 1920
let fps: Int32 = 30
let transitionDuration = 0.40
let totalSeconds = scenes.reduce(0) { $0 + $1.seconds }
let totalFrames = Int(totalSeconds * Double(fps))

let writer = try AVAssetWriter(outputURL: outputURL, fileType: .mp4)
let videoInput = AVAssetWriterInput(mediaType: .video, outputSettings: [
  AVVideoCodecKey: AVVideoCodecType.h264,
  AVVideoWidthKey: width,
  AVVideoHeightKey: height,
  AVVideoCompressionPropertiesKey: [AVVideoAverageBitRateKey: 12_000_000, AVVideoProfileLevelKey: AVVideoProfileLevelH264HighAutoLevel]
])
videoInput.expectsMediaDataInRealTime = false
let attributes: [String: Any] = [
  kCVPixelBufferPixelFormatTypeKey as String: kCVPixelFormatType_32BGRA,
  kCVPixelBufferWidthKey as String: width,
  kCVPixelBufferHeightKey as String: height,
  kCVPixelBufferCGImageCompatibilityKey as String: true,
  kCVPixelBufferCGBitmapContextCompatibilityKey as String: true
]
let adaptor = AVAssetWriterInputPixelBufferAdaptor(assetWriterInput: videoInput, sourcePixelBufferAttributes: attributes)
guard writer.canAdd(videoInput) else { fatalError("Could not add video input.") }
writer.add(videoInput)
guard writer.startWriting() else { throw writer.error ?? NSError(domain: "preview", code: 1) }
writer.startSession(atSourceTime: .zero)

func draw(_ image: CGImage, progress: CGFloat, alpha: CGFloat, verticalOffset: CGFloat = 0, in context: CGContext) {
  let baseScale = max(CGFloat(width) / CGFloat(image.width), CGFloat(height) / CGFloat(image.height))
  let scale = baseScale * (1 + 0.035 * progress)
  let drawWidth = CGFloat(image.width) * scale
  let drawHeight = CGFloat(image.height) * scale
  let x = (CGFloat(width) - drawWidth) / 2 + 6 * progress
  let y = (CGFloat(height) - drawHeight) / 2 - 10 * progress + verticalOffset
  context.saveGState()
  context.setAlpha(alpha)
  context.interpolationQuality = .high
  context.draw(image, in: CGRect(x: x, y: y, width: drawWidth, height: drawHeight))
  context.restoreGState()
}

for frame in 0..<totalFrames {
  while !videoInput.isReadyForMoreMediaData { Thread.sleep(forTimeInterval: 0.002) }
  var pixelBuffer: CVPixelBuffer?
  guard CVPixelBufferPoolCreatePixelBuffer(nil, adaptor.pixelBufferPool!, &pixelBuffer) == kCVReturnSuccess, let buffer = pixelBuffer else {
    fatalError("Could not create frame buffer.")
  }
  CVPixelBufferLockBaseAddress(buffer, [])
  guard let context = CGContext(
    data: CVPixelBufferGetBaseAddress(buffer), width: width, height: height,
    bitsPerComponent: 8, bytesPerRow: CVPixelBufferGetBytesPerRow(buffer),
    space: CGColorSpaceCreateDeviceRGB(), bitmapInfo: CGImageAlphaInfo.noneSkipFirst.rawValue | CGBitmapInfo.byteOrder32Little.rawValue
  ) else { fatalError("Could not create drawing context.") }
  context.setFillColor(NSColor.black.cgColor)
  context.fill(CGRect(x: 0, y: 0, width: width, height: height))

  let time = Double(frame) / Double(fps)
  var elapsed = 0.0
  var index = images.count - 1
  for candidate in scenes.indices {
    if time < elapsed + scenes[candidate].seconds {
      index = candidate
      break
    }
    elapsed += scenes[candidate].seconds
  }
  let withinScreen = time - elapsed
  let progress = CGFloat(withinScreen / scenes[index].seconds)
  var outgoingAlpha: CGFloat = 1
  var outgoingOffset: CGFloat = 0
  var incoming: (index: Int, fade: CGFloat)?
  if withinScreen > scenes[index].seconds - transitionDuration && index + 1 < images.count {
    let fade = CGFloat((withinScreen - (scenes[index].seconds - transitionDuration)) / transitionDuration)
    outgoingAlpha = 1 - fade * 0.45
    outgoingOffset = -46 * fade
    incoming = (index + 1, fade)
  }
  draw(images[index], progress: progress, alpha: outgoingAlpha, verticalOffset: outgoingOffset, in: context)
  if let incoming {
    draw(images[incoming.index], progress: 0, alpha: incoming.fade, verticalOffset: 68 * (1 - incoming.fade), in: context)
  }
  CVPixelBufferUnlockBaseAddress(buffer, [])
  let presentationTime = CMTime(value: CMTimeValue(frame), timescale: fps)
  guard adaptor.append(buffer, withPresentationTime: presentationTime) else { throw writer.error ?? NSError(domain: "preview", code: 2) }
}

videoInput.markAsFinished()
await writer.finishWriting()
guard writer.status == .completed else { throw writer.error ?? NSError(domain: "preview", code: 3) }
print(outputURL.path)
