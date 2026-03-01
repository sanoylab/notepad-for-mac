# Notepad for Mac

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![GitHub release](https://img.shields.io/github/v/release/sanoylab/notepad-for-mac)](https://github.com/sanoylab/notepad-for-mac/releases/latest)

A faithful clone of classic Windows Notepad, built for macOS with Electron.

---

## About

Notepad for Mac brings the simplicity and familiarity of Windows Notepad to macOS. No frills, no bloat — just a fast, lightweight text editor that opens instantly and stays out of your way.

- Pixel-faithful recreation of Windows Notepad menus and behavior
- Find / Replace / Go To line
- Word Wrap toggle
- Font picker (persisted across sessions)
- Status bar with line/column indicator
- `.txt` file association (double-click in Finder)
- Universal binary — native on both Intel and Apple Silicon

---

## Screenshots

> _Screenshots coming soon._

---

## Getting Started

### Prerequisites

- macOS 11+
- Node.js 18+ and npm

### Development

```bash
# Install dependencies
npm install

# Run in development mode
npm start
```

### Build

```bash
npm run build
```

The `.dmg` installer will be output to `dist/`.

---

## Contributing

Contributions are welcome! Please open an issue or pull request on [GitHub](https://github.com/sanoylab/notepad-for-mac).

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/my-feature`)
3. Commit your changes
4. Push and open a pull request

---

## License

MIT — see [LICENSE](LICENSE) for details.
