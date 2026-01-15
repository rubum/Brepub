# Brepub - Modern EPUB Reader (Web & macOS)

Brepub is a fast, continuous-scrolling EPUB reader. It is built as a **responsive web application** (using Vite & epub.js) that can be run in any browser, and includes a **native Swift wrapper** for a seamless, frameless desktop experience on macOS.

## Features

- **Cross-Platform Web Reader**: Runs in any modern browser.
- **Native macOS App**: optional frameless window wrapper with custom drag support and native traffic light controls.
- **Continuous Reading**: Vertical scrolling flow for a better reading experience.
- **Customizable**: Adjustable font settings, themes (Light/Dark), and layout controls.

## Prerequisites

1.  **Node.js & npm**: Required to run the web application.
2.  **Xcode / Swift** (Optional): Only required if you want to build the native macOS desktop app.

## Getting Started

### 1. Clone the Repository

```bash
git clone git@github.com:rubum/Brepub.git
cd Brepub
```

### 2. Run as Web App (Any OS)

You can run Brepub purely as a web application on macOS, Windows, or Linux.

```bash
npm install
npm run dev
```

Open `http://localhost:5173` in your browser.

### 3. Run with Helper Script

We provide a convenience script that handles dependency installation and starting the local web server.

**Run Web App Only:**
```bash
./run_brepub.sh
```
This checks for npm, installs dependencies, and starts the Vite server at `http://localhost:5173`.

**Run as Native macOS App:**
```bash
./run_brepub.sh --native
```
This does everything above, PLUS it checks for `swiftc`, compiles the native wrapper, and launches the macOS application.

**Note**: The `--native` option requires `swiftc` (Xcode Command Line Tools) to be installed.

## Project Structure

*   `src/`: Application source code (`main.js`, `settings.js`, `ui.js`, `reader.js`, `style.css`).
*   `index.html`: Web entry point.
*   `native-macos/`: Swift source files for the native window wrapper.
*   `run_brepub.sh`: Automation script for building and running.
*   `Brepub.app/`: The output macOS application bundle.
