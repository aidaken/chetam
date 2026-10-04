# Chetam

Personal AI assistant you text. Knows your goals, watches your day, finishes follow-through after you approve.

## Quick start

```bash
bun install
bun run seed
bun run dev
```

- Chat: http://localhost:3000  
- Notebook: http://localhost:3000/notebook  
- Health: http://localhost:3000/api/health  

See **[MANUAL.md](./MANUAL.md)** for env vars and demo test steps.

## Stack

| Layer | Tool |
| --- | --- |
| Agent | Mastra |
| DB / memory | Neon Postgres |
| Model | Neon AI Gateway via OpenAI SDK (`/v1`) |
| Web search | Exa (`exa-js`) |
| Email | AgentMail (approval + allowlist) |
| Calendar / Drive | Seeded interface (Executor-ready) |
| Channel | Web chat; Sendblue adapter stub |
