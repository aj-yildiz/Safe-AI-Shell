# 📂 Safe AI Shell

> **Ask → Get Command → See Results — all local, zero uploads.**

**Folder Insights AI** pairs AI-powered shell command generation with instant, local file system analysis.
Choose a folder, describe your goal, and get:

1. An AI-suggested shell command (OpenAI / Anthropic).
2. Real results executed locally in your browser.

<img width="1512" height="812" alt="Screenshot 2025-08-10 at 01 06 11" src="https://github.com/user-attachments/assets/f0583298-e933-484a-9887-586dc1735377" />


---

## Highlights

* 🤖 **Smart Commands** — Natural language → precise shell commands.
* 🔒 **Privacy-First** — File contents never leave your device.
* ⚡ **Real-Time Results** — Side-by-side AI suggestions + local execution.
* 🛡️ **Built-In Safety** — Detects and warns against destructive commands.
* 📊 **Export & History** — Download CSVs, revisit recent queries.

---

## Example Prompts

* **Large Files** — `find files >50MB depth 2`
* **Count by Extension** — `count files by extension`
* **Text Search** — `search for TODO in .js files`

---

## Quick Start

```bash
git clone <repo>
cd folder-insights-ai
npm run install:all
# Add your OPENAI_API_KEY to server/.env :)) 
npm run dev
``

---

## Security

* No uploads — all analysis runs locally.
* API keys remain server-side, never exposed to the browser.
* Risk assessment blocks unsafe commands before execution.
