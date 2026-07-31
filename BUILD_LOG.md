# Build Log

This document summarizes what was built, the AI tools and processes utilized, and the key technical insights gained during the development process.

---

## 1. What was Built

### A. Dynamic Google Gemini API Integration
* **Direct Google Gemini API Endpoint Integration**: Added support for standard Google Gemini API keys (`GEMINI_API_KEY`) from Google AI Studio. 
* **Dynamic Provider Switching**: Modified the server functions to dynamically choose the Google Gemini OpenAI-compatible provider if `GEMINI_API_KEY` is present, or fall back to the Lovable AI Gateway if `LOVABLE_API_KEY` is set.
* **Model Configuration**: Exposed `GEMINI_MODEL` (defaulting to `gemini-2.5-flash`) for custom model selection.

### B. Simplified Database Migration Setup
* **Automated Database Setup Script**: Developed a standalone database utility (`scripts/setup-db.js`) that automatically loads connection strings (`SUPABASE_DB_URL`) from the `.env` file and pushes migrations using the Supabase CLI.
* **Unified Scripts**: Added a `"db:push"` script to `package.json` to make running schema deployments simple: `npm run db:push`.

### C. Input Validation & Robust UI States
* **Profile & Workspace Editing**: Required name strings to have at least 2 characters, preventing database updates with empty or whitespace-only names.
* **Project Creation**: Validated names (min 2 characters), descriptions, and added checks for valid deadlines.
* **Task & Kanban Operations**: Checked task title lengths (min 2 characters) and added visual saving states.
* **Comment System**: Prevented empty comments and added characters constraints.

---

## 2. AI Tools and Process

### AI Assistant Used
* **Antigravity AI Agent** powered by Google DeepMind's Gemini.

### Tools & Methods
* **Codebase Exploration**: Used `list_dir` and `grep_search` to map the workspace layout and locate where server functions and configuration files reside.
* **Secure File Modifications**: Used `replace_file_content` to apply surgical modifications (keeping comments and docstrings intact) without introducing formatting issues.
* **Task Management & Execution**: Proposed background terminal execution via `run_command` and monitored task progress using `manage_task` to run `npm install` and verify the compilation.

---

## 3. What Was Learned

### SSR & Server Functions in TanStack Start
* **Import Protection**: Segregating server-only libraries (like `@ai-sdk/openai-compatible` or private keys) from components is critical in TanStack Start. Loading them inside `createServerFn` or dynamically via `await import(...)` prevents client-side bundler errors.

### Supabase CLI Portability
* Using `supabase db push --db-url` bypasses the interactive login (`supabase login`) and linking (`supabase link`) requirements, making it perfect for automated setups, local testing, and CI/CD pipelines.

### Native Node.js Environment Files
* Utilizing Node.js 20's native `--env-file=.env` flag removes the need for package dependencies like `dotenv` for standalone utilities, minimizing node_modules overhead.
