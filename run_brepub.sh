#!/bin/bash

# Exit on error
set -e

# Parse arguments
BUILD_NATIVE=false

for arg in "$@"; do
    case $arg in
        --native)
        BUILD_NATIVE=true
        shift
        ;;
    esac
done

# Cleanup function to kill background processes
cleanup() {
    echo "Stopping Vite server..."
    if [ ! -z "$VITE_PID" ]; then
        kill $VITE_PID
    fi
    exit
}

# Trap SIGINT and SIGTERM
trap cleanup SIGINT SIGTERM

echo "Checking prerequisites..."
if ! command -v npm &> /dev/null; then
    echo "Error: npm is not installed based on your path"
    exit 1
fi

echo "Setting up Web App..."
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install
fi

echo "Starting Vite server..."
npm run dev -- --port 5173 &
VITE_PID=$!

# Wait for Vite to be ready
echo "Waiting for localhost:5173..."
while ! curl -s http://localhost:5173 > /dev/null; do
    sleep 1
done
echo "Vite server is ready."

if [ "$BUILD_NATIVE" = true ]; then
    if ! command -v swiftc &> /dev/null; then
        echo "Error: swiftc is not installed. Is Xcode installed?"
        cleanup
        exit 1
    fi

    echo "Bundling Swift App..."

    APP_NAME="Brepub"
    APP_BUNDLE="$APP_NAME.app"
    CONTENTS="$APP_BUNDLE/Contents"
    MACOS="$CONTENTS/MacOS"
    RESOURCES="$CONTENTS/Resources"

    # Create directory structure
    mkdir -p "$MACOS"
    mkdir -p "$RESOURCES"

    # Create Info.plist
    cat > "$CONTENTS/Info.plist" <<EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>CFBundleExecutable</key>
    <string>$APP_NAME</string>
    <key>CFBundleIdentifier</key>
    <string>com.example.$APP_NAME</string>
    <key>CFBundleName</key>
    <string>$APP_NAME</string>
    <key>CFBundleShortVersionString</key>
    <string>1.0</string>
    <key>CFBundleVersion</key>
    <string>1</string>
    <key>CFBundlePackageType</key>
    <string>APPL</string>
    <key>LSMinimumSystemVersion</key>
    <string>14.0</string>
    <key>NSPrincipalClass</key>
    <string>NSApplication</string>
    <key>NSAppTransportSecurity</key>
    <dict>
        <key>NSAllowsArbitraryLoads</key>
        <true/>
    </dict>
    <key>NSHumanReadableCopyright</key>
    <string>Copyright © 2024. All rights reserved.</string>
</dict>
</plist>
EOF

    # Compile Swift sources
    echo "Compiling Swift sources..."
    swiftc native-macos/*.swift \
        -o "$MACOS/$APP_NAME" \
        -target arm64-apple-macosx14.0 \
        -sdk $(xcrun --show-sdk-path)

    echo "Build complete. Launching $APP_NAME..."

    # Run the app
    open "$APP_BUNDLE"
    
    echo "App is running. Press Ctrl+C to stop the web server and exit."
else
    echo "Web App is running at http://localhost:5173. Press Ctrl+C to stop."
fi

# Wait for user to stop the script
wait $VITE_PID
