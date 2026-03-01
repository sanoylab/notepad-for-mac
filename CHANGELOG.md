# Changelog

All notable changes to Notepad for Mac will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.0.0] - 2024-01-01

### Added
- Classic Windows Notepad UI faithfully recreated for macOS
- Full **File** menu: New, Open, Save, Save As, Print
- Full **Edit** menu: Undo, Cut, Copy, Paste, Delete, Select All, Time/Date
- **Find** dialog with Match Case and Wrap Around options
- **Find Next** (F3) shortcut
- **Replace** dialog with Replace and Replace All
- **Go To Line** dialog
- **Format** menu: Word Wrap toggle, Font picker
- Font picker with family, style, and size — persisted across sessions
- **View** menu: Status Bar toggle, Zoom In / Zoom Out / Restore Default Zoom
- Status bar showing current line and column number
- Unsaved changes guard — prompts Save / Don't Save / Cancel on New, Open, and Exit
- `.txt` file association — double-clicking a text file in Finder opens it in the app
- Window state persistence (size, position, maximized) across sessions
- Universal binary DMG — native on Apple Silicon (arm64) and Intel (x64)
- GitHub Actions workflow for automated DMG release on version tag push
