// swift-tools-version:5.10
// RSM Studio — native macOS client for Recording Studio Manager
// Phase M1: app skeleton + offline-first sync engine (see .planning/macos-native/)
import PackageDescription

let package = Package(
    name: "RSMStudio",
    platforms: [.macOS(.v14)],
    dependencies: [
        // Vendored (apps/macos/vendor) — release tarball, no 600 MB git clone,
        // and the app builds fully offline.
        .package(path: "../vendor/GRDB.swift"),
    ],
    targets: [
        .target(
            name: "RSMCore",
            dependencies: [.product(name: "GRDB", package: "GRDB.swift")]
        ),
        .executableTarget(
            name: "RSMStudio",
            dependencies: ["RSMCore"]
        ),
        .testTarget(
            name: "RSMCoreTests",
            dependencies: ["RSMCore"]
        ),
    ]
)
