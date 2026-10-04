# Chetam — setup & test

## Env vars (see `.env.example`)

| Variable | Required | Purpose |
| --- | --- | --- |
| `DATABASE_URL` | yes | Neon Postgres |
| `NEON_AI_GATEWAY_BASE_URL` | yes | Bare gateway host (no `/v1`) |
| `NEON_AI_GATEWAY_TOKEN` | yes | Gateway API token |
| `LLM_MODEL` | no | Default `gpt-5-mini` |
| `DEMO_USER_ID` | no | Seeded demo user UUID |
| `EXA_API_KEY` | for gifts | Exa search |
| `AGENTMAIL_API_KEY` | for email | AgentMail SDK |
| `AGENTMAIL_INBOX_USERNAME` | no | Default `chetam` |
| `EMAIL_ENABLED` | yes for send | Must be exact string `true` |
| `EMAIL_ALLOWLIST` | yes for send | Comma-separated recipients |
| `CALENDAR_PROVIDER` | no | `seeded` (default) or `executor` (TODO) |
| `DRIVE_PROVIDER` | no | `seeded` (default) or `executor` (TODO) |
| `GOOGLE_ROUTES_API_KEY` | no | Else Travel selector minutes |
| `NEXT_PUBLIC_APP_URL` | for iMessage | Public base URL |
| `SENDBLUE_*` | optional | iMessage provider |

LLM calls use the official OpenAI SDK / AI SDK against  
`${NEON_AI_GATEWAY_BASE_URL}/v1` with `NEON_AI_GATEWAY_TOKEN`.  
There is **no** `OPENAI_API_KEY` path.

## Bootstrap

```bash
bun install
bun run seed
bun run dev
```

- Chat: http://localhost:3000  
- Notebook: http://localhost:3000/notebook  
- Health: http://localhost:3000/api/health  

## Test steps

1. `curl -s localhost:3000/api/health | jq` — expect `ok: true` when gateway, Exa, AgentMail, DB are good.
2. **Morning briefing** → reply `yes` — calendar blocks + Sam email (allowlisted only).
3. **Block app time** → `yes` — Thursday 2–5 proposed/created in seeded calendar.
4. **Dad's birthday** → `yes` — Exa gift titles+URLs (no hardcoded Amazon search links).
5. Set Travel to **65 min** → **Leave now** → `yes` — late email to allowlisted address.
6. Open **/notebook** — goals, memories (Forget), nudges, action log with reasons.

## Safety

- Emails send only after approval **and** `EMAIL_ENABLED=true` **and** recipient ∈ `EMAIL_ALLOWLIST`.
- Otherwise the send is logged as would-have-sent (no secrets in logs).

## Manual / on-site

- Neon AI Gateway must be enabled on the org plan (or health LLM check fails).
- Executor Calendar/Drive: set provider flags later; interface is ready, live impl not built.
- iMessage: point Sendblue webhook to `/api/imessage/webhook`.
