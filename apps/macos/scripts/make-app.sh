#!/bin/bash
# ============================================================================
# make-app.sh — package RSM Studio as a distributable .app bundle (Phase M5)
#
#   ./make-app.sh            → apps/macos/dist/RSM Studio.app (ad-hoc signed)
#
# Notes:
#   - Ad-hoc signature: runs on this Mac and via "right-click > Open" on
#     others. Public distribution needs a Developer ID certificate +
#     notarization (see M5-SUMMARY).
#   - Sparkle auto-updates: planned, requires a hosting URL for appcast.
# ============================================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MACOS_DIR="$(dirname "$SCRIPT_DIR")"
PKG_DIR="$MACOS_DIR/RSMStudio"
DIST_DIR="$MACOS_DIR/dist"
# Assemble in /tmp: Documents/iCloud re-adds extended attributes that codesign
# rejects; we sign in /tmp then move the signed bundle into dist/.
BUILD_APP_DIR="$(mktemp -d)"
APP="$BUILD_APP_DIR/RSM Studio.app"
FINAL_APP="$DIST_DIR/RSM Studio.app"
VERSION="${RSM_VERSION:-0.1.0}"

echo "🔨 Building release binary..."
cd "$PKG_DIR"
swift build -c release

echo "📦 Assembling bundle..."
rm -rf "$APP"
mkdir -p "$APP/Contents/MacOS" "$APP/Contents/Resources"

cp "$PKG_DIR/.build/release/RSMStudio" "$APP/Contents/MacOS/RSM Studio"

cat > "$APP/Contents/Info.plist" <<PLIST
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>CFBundleName</key><string>RSM Studio</string>
    <key>CFBundleDisplayName</key><string>RSM Studio</string>
    <key>CFBundleIdentifier</key><string>com.rsm.studio</string>
    <key>CFBundleVersion</key><string>${VERSION}</string>
    <key>CFBundleShortVersionString</key><string>${VERSION}</string>
    <key>CFBundleExecutable</key><string>RSM Studio</string>
    <key>CFBundlePackageType</key><string>APPL</string>
    <key>CFBundleIconFile</key><string>AppIcon</string>
    <key>LSMinimumSystemVersion</key><string>14.0</string>
    <key>NSHighResolutionCapable</key><true/>
    <key>NSAppTransportSecurity</key>
    <dict>
        <key>NSAllowsLocalNetworking</key><true/>
    </dict>
    <key>NSHumanReadableCopyright</key><string>© 2026 Recording Studio Manager</string>
</dict>
</plist>
PLIST

echo "🎨 Generating icon..."
ICONSET="$(mktemp -d)/AppIcon.iconset"
mkdir -p "$ICONSET"
swift "$SCRIPT_DIR/make-icon.swift" "$ICONSET/icon_1024.png" > /dev/null
for SIZE in 16 32 64 128 256 512; do
  sips -z $SIZE $SIZE "$ICONSET/icon_1024.png" --out "$ICONSET/icon_${SIZE}x${SIZE}.png" > /dev/null
  DOUBLE=$((SIZE * 2))
  sips -z $DOUBLE $DOUBLE "$ICONSET/icon_1024.png" --out "$ICONSET/icon_${SIZE}x${SIZE}@2x.png" > /dev/null
done
mv "$ICONSET/icon_1024.png" "$ICONSET/icon_512x512@2x.png" 2>/dev/null || true
iconutil -c icns "$ICONSET" -o "$APP/Contents/Resources/AppIcon.icns"

echo "✍️  Signing (ad-hoc)..."
xattr -cr "$APP"   # strip extended attributes (codesign rejects them)
codesign --force --deep -s - "$APP"

mkdir -p "$DIST_DIR"
rm -rf "$FINAL_APP"
mv "$APP" "$FINAL_APP"
rmdir "$BUILD_APP_DIR" 2>/dev/null || true

echo "✅ $FINAL_APP"
echo "   Lancer : open \"$FINAL_APP\""
