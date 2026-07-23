import CoreGraphics
import Foundation
import ImageIO
import UniformTypeIdentifiers

struct AtlasLevel: Codable {
    let x: Int
    let y: Int
    let w: Int
    let h: Int
}

struct AtlasEntry: Codable {
    let assetId: String
    let url: String
    let width: Int
    let height: Int
    let levels: [String: AtlasLevel]
}

struct AtlasManifest: Codable {
    let schemaVersion: String
    let generatedBy: String
    let sourceRoot: String
    let outputRoot: String
    let tileSize: Int
    let columns: Int
    let rows: Int
    let fileCount: Int
    let entries: [AtlasEntry]
}

let arguments = CommandLine.arguments
func argument(_ name: String, fallback: String) -> String {
    guard let index = arguments.firstIndex(of: name), index + 1 < arguments.count else { return fallback }
    return arguments[index + 1]
}

let sourceRoot = URL(fileURLWithPath: argument("--source", fallback: "public/assets/buildings-runtime-384"), isDirectory: true)
let outputRoot = URL(fileURLWithPath: argument("--out", fallback: "public/assets/buildings-runtime-atlas"), isDirectory: true)
let tileSize = Int(argument("--size", fallback: "384")) ?? 384
let columns = 3
let rows = 3
let fileManager = FileManager.default
try fileManager.createDirectory(at: outputRoot, withIntermediateDirectories: true)

let directories = try fileManager.contentsOfDirectory(at: sourceRoot, includingPropertiesForKeys: [.isDirectoryKey], options: [.skipsHiddenFiles])
    .filter { (try? $0.resourceValues(forKeys: [.isDirectoryKey]).isDirectory) == true }
    .sorted { $0.lastPathComponent < $1.lastPathComponent }

let colorSpace = CGColorSpaceCreateDeviceRGB()
var entries: [AtlasEntry] = []

for directory in directories {
    var images: [Int: CGImage] = [:]
    for level in 0..<9 {
        let url = directory.appendingPathComponent("level-\(level).png")
        guard let source = CGImageSourceCreateWithURL(url as CFURL, nil),
              let image = CGImageSourceCreateImageAtIndex(source, 0, nil) else {
            throw NSError(domain: "LittleEarAtlas", code: 1, userInfo: [NSLocalizedDescriptionKey: "Missing or unreadable \(url.path)"])
        }
        images[level] = image
    }

    guard let context = CGContext(
        data: nil,
        width: tileSize * columns,
        height: tileSize * rows,
        bitsPerComponent: 8,
        bytesPerRow: tileSize * columns * 4,
        space: colorSpace,
        bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue,
    ) else { throw NSError(domain: "LittleEarAtlas", code: 2) }
    context.clear(CGRect(x: 0, y: 0, width: tileSize * columns, height: tileSize * rows))

    var levels: [String: AtlasLevel] = [:]
    for level in 0..<9 {
        let column = level % columns
        let row = level / columns
        // CGContext's origin is bottom-left; manifest coordinates are top-left.
        let drawRect = CGRect(x: column * tileSize, y: (rows - 1 - row) * tileSize, width: tileSize, height: tileSize)
        if let image = images[level] { context.draw(image, in: drawRect) }
        levels[String(level)] = AtlasLevel(x: column * tileSize, y: row * tileSize, w: tileSize, h: tileSize)
    }

    let atlasURL = outputRoot.appendingPathComponent("\(directory.lastPathComponent).png")
    guard let destination = CGImageDestinationCreateWithURL(atlasURL as CFURL, UTType.png.identifier as CFString, 1, nil),
          let atlasImage = context.makeImage() else { throw NSError(domain: "LittleEarAtlas", code: 3) }
    CGImageDestinationAddImage(destination, atlasImage, nil)
    guard CGImageDestinationFinalize(destination) else { throw NSError(domain: "LittleEarAtlas", code: 4) }
    entries.append(AtlasEntry(
        assetId: directory.lastPathComponent,
        url: "/assets/buildings-runtime-atlas/\(directory.lastPathComponent).png",
        width: tileSize * columns,
        height: tileSize * rows,
        levels: levels,
    ))
}

let manifest = AtlasManifest(
    schemaVersion: "runtime-artwork-atlas.v1",
    generatedBy: "tools/art-pipeline/build-runtime-artwork-atlases.swift",
    sourceRoot: sourceRoot.path,
    outputRoot: outputRoot.path,
    tileSize: tileSize,
    columns: columns,
    rows: rows,
    fileCount: entries.count,
    entries: entries,
)
let encoder = JSONEncoder()
encoder.outputFormatting = [.prettyPrinted, .sortedKeys]
try encoder.encode(manifest).write(to: outputRoot.appendingPathComponent("runtime-artwork-atlas-manifest.json"))
print("Runtime artwork atlases: \(entries.count) files, 252 frames -> \(outputRoot.path)")
