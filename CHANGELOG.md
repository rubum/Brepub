# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

### Added
- **AI Chat Interface**: Implemented a comprehensive AI-powered explanation feature.
    - Users can now select text in the book and choose "Explain with AI".
    - Opens a resizable modal with an interactive chat interface.
    - Supports contextual follow-up questions in a conversational format.
- **Gemini API Integration**:
    - Integrated Google's `gemini-3-flash-preview` model for detailed text analysis.
    - Added `GeminiService` to handle stateful chat sessions.
    - Added API Key input field in the Settings panel for user configuration.
- **Rich Text Rendering**:
    - Implemented Markdown support using `marked` library.
    - AI responses now feature styled headings, lists, code blocks, and divider lines.
    - Added specific typography styles for better readability of long explanations.

### Changed
- **UI/UX Enhancements**:
    - Converted the static explanation modal into a dynamic chat window.
    - Increased AI message bubble width to 98% of the container for better display of detailed content.
    - Improved styling of the Selection Menu with glassmorphism effects.
    - Added clear visual distinction between User and AI message bubbles.
- **Settings**:
    - Persistent storage for the Gemini API Key.

### Fixed
- Fixed an issue where the text selection menu would not appear reliably.
- Fixed a bug where empty text contexts were sometimes sent to the API.
- Fixed CSS nesting issues that broke chat UI styling.
