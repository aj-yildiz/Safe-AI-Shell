# Folder Insights AI

> Pick a folder → ask a goal → get an AI-suggested command + real local results. No uploads.

Folder Insights AI is a privacy-focused tool that combines AI-powered command generation with local file system analysis. Simply select a folder, describe what you want to find, and get both an AI-suggested shell command and real results executed locally in your browser.

![Demo Screenshot Placeholder](docs/demo-screenshot.png)
*Screenshot coming soon - record with QuickTime and convert with `ffmpeg -i screen-recording.mov -vf "fps=10,scale=800:-1:flags=lanczos" demo.gif`*

## ✨ Features

- 🤖 **AI Command Generation**: Get expert shell commands from OpenAI or Anthropic
- 🔒 **Privacy First**: No file contents leave your browser - server only for AI
- 🎯 **Smart Intent Parsing**: Automatically understands and executes your goals
- ⚡ **Real-time Results**: See actual results alongside AI suggestions
- 🛡️ **Risk Assessment**: Built-in safety checks for dangerous commands
- 📱 **Modern UI**: Clean, dark-mode interface with keyboard shortcuts
- 📊 **Export Results**: Download findings as CSV files
- 🕐 **History Tracking**: Remember your last 10 queries

### Supported Intents

| Intent | Example Goals | What It Does |
|--------|---------------|--------------|
| **Large Files** | "find files >50MB depth 2" | Finds files above size threshold |
| **Count by Extension** | "count files by extension" | Groups files by type with totals |
| **Text Search** | "search for TODO in .js files" | Searches file contents for patterns |

## 🚀 Quick Start

### 1. Install Dependencies
```bash
git clone <repository-url>
cd folder-insights-ai
npm run install:all
```

### 2. Configure OpenAI API Key
```bash
cp env.example server/.env
# Edit server/.env and add your OpenAI API key:
echo "OPENAI_API_KEY=sk-your-actual-key-here" >> server/.env
```

> **Get your OpenAI API key from:** https://platform.openai.com/api-keys

### 3. Start Development
```bash
npm run dev
```

Open http://localhost:5173 in Chrome, Edge, or another Chromium-based browser.

## 🔧 Development

### Project Structure
```
folder-insights-ai/
├── client/                 # React + Vite + TypeScript frontend
│   ├── src/
│   │   ├── components/     # UI components
│   │   ├── lib/           # Utilities (fs, api, storage, intent)
│   │   └── types.ts       # TypeScript definitions
│   └── package.json
├── server/                # Node + Express + TypeScript backend
│   ├── src/
│   │   ├── ai-providers/  # OpenAI & Anthropic integrations
│   │   ├── routes/        # API endpoints
│   │   ├── risk-assessment.ts  # Command safety analysis
│   │   └── index.ts       # Server entry point
│   └── package.json
├── package.json           # Root workspace scripts
└── README.md
```

### Available Scripts

**Root:**
- `npm run dev` - Start both client and server
- `npm run install:all` - Install all dependencies
- `npm run build` - Build both applications
- `npm run test` - Run server tests

**Client (cd client/):**
- `npm run dev` - Vite dev server (port 5173)
- `npm run build` - Production build
- `npm run preview` - Preview production build

**Server (cd server/):**
- `npm run dev` - Development server with hot reload (port 8787)
- `npm run build` - TypeScript compilation
- `npm run start` - Production server
- `npm run test` - Run tests with Vitest

### Browser Compatibility

This app requires the **File System Access API**, which is currently supported in:
- ✅ Chrome 86+
- ✅ Edge 86+
- ✅ Other Chromium-based browsers
- ❌ Firefox, Safari (not yet supported)

## 🔐 Security & Privacy

### Privacy Guarantee
- **No file contents are uploaded** - all file analysis happens in your browser
- **Only your text goals** are sent to AI providers for command generation
- **No persistent storage** on the server - everything is stateless

### API Key Security
- ✅ **Never exposed to frontend** - keys stay on server only
- ✅ **Not logged** - validation without exposing values
- ✅ **Gitignore protection** - .env files excluded from version control
- ✅ **Environment isolation** - loaded via process.env only
- ✅ **Format validation** - checks key format without exposing content

### Risk Assessment
The server includes comprehensive safety checks:

- **Blocklist patterns**: Detects destructive commands (`rm -rf`, `dd of=/dev/*`, etc.)
- **Risk levels**: Commands are classified as low/medium/high risk
- **Safer alternatives**: High-risk commands get safer equivalents
- **Force flag detection**: Warns about `--force` and `-f` usage

### Example Risk Classifications

| Risk Level | Examples | Mitigations |
|------------|----------|-------------|
| **Low** | `find`, `ls`, `grep`, `cat` | None needed |
| **Medium** | `chmod`, `sudo find`, `curl \| bash` | Remove dangerous flags |
| **High** | `rm -rf`, `dd`, `shutdown`, fork bombs | Provide echo alternatives |

## 🎮 Usage Examples

### Example Prompts for Each Intent

**Large Files:**
```
find files >100MB depth 3
big files over 50 megabytes
files larger than 200MB in depth 2
```

**Count by Extension:**
```
count files by extension
breakdown by file type
group files by extension depth 2
```

**Text Search:**
```
search for "TODO" in .js files
find text containing "password" 
files with "FIXME" in .py depth 3
```

### Keyboard Shortcuts
- `Cmd/Ctrl + Enter` - Submit prompt
- `Esc` - Focus input field
- History sidebar shows recent queries

## 🛠️ API Reference

### POST /api/generate

Generate a shell command from a natural language goal.

**Request:**
```json
{
  "goal": "find files >50MB depth 2",
  "shell": "bash"
}
```

**Response:**
```json
{
  "command": "find . -maxdepth 2 -type f -size +50M -ls",
  "explanation": "Finds files larger than 50MB within 2 directory levels",
  "riskLevel": "low",
  "saferAlternative": null,
  "shell": "bash"
}
```

**Error Response:**
```json
{
  "error": "Invalid request",
  "code": "VALIDATION_ERROR",
  "details": [...]
}
```

## 🧪 Testing

Run the test suite:
```bash
cd server
npm test
```

Tests cover:
- Risk assessment patterns
- Schema validation
- AI response parsing
- Error handling

## 📝 Environment Variables

### Server (.env)
```bash
# Required: OpenAI API key
OPENAI_API_KEY=sk-your-openai-key-here

# Optional: Alternative AI provider
# ANTHROPIC_API_KEY=sk-ant-your-anthropic-key-here

# Optional: Server configuration
PORT=8787
NODE_ENV=development
```

## 🚢 Deployment

### Production Build
```bash
npm run build
```

### Docker (example)
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 8787
CMD ["npm", "start"]
```

### Environment Setup
- Set `NODE_ENV=production`
- Configure CORS for your domain
- Use HTTPS in production
- Set up proper logging

## 🗺️ Roadmap

- [ ] **Authentication system** - User accounts and API limits  
- [ ] **Multi-folder support** - Compare across directories
- [ ] **Team sharing** - Collaborate on folder analysis
- [ ] **Warp terminal plugin** - Native integration
- [ ] **Firefox/Safari support** - When File System Access API available
- [ ] **Advanced filters** - Date ranges, file types, custom patterns
- [ ] **Saved searches** - Bookmark frequently used queries
- [ ] **Result visualization** - Charts and graphs for insights

## 📄 License

MIT License - see LICENSE file for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 🚀 GitHub Setup

To push this project to GitHub:

```bash
# Initialize git repository
git init

# Add all files
git add .

# Initial commit
git commit -m "Initial commit: Folder Insights AI v1.0"

# Add remote repository
git remote add origin https://github.com/yourusername/folder-insights-ai.git

# Push to main branch
git branch -M main
git push -u origin main
```

## 📞 Support

- 🐛 **Bug reports**: Open an issue with reproduction steps
- 💡 **Feature requests**: Describe your use case in an issue
- 📖 **Documentation**: Check this README and code comments
- 💬 **Questions**: Start a discussion in the repo

---

**Built with:** React, TypeScript, Vite, Tailwind CSS, Node.js, Express, OpenAI, Anthropic

*No files were harmed in the making of this analysis tool.* 🛡️