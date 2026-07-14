# AshleyAi Server

A custom Node.js/Express chatbot API server, documented with an OpenAPI 3.0
spec and Swagger UI, backed by the Anthropic Claude API.

## Features

- `POST /api/chat` — send a message, get an AI-generated reply
- Session support — pass a `sessionId` to keep conversation history server-side
- Stateless mode — pass your own `history` array instead
- `GET /docs` — interactive Swagger UI built from `openapi.yaml`
- `GET /openapi.json` — raw OpenAPI spec (importable into Postman, etc.)
- `GET /api/health` — health check
- Basic rate limiting (30 req/min per IP by default)

## Setup

```bash
npm install
cp .env.example .env
# then edit .env and set ANTHROPIC_API_KEY
npm start
```

Server starts on `http://localhost:3000` by default.

- Swagger UI: http://localhost:3000/docs
- Raw spec: http://localhost:3000/openapi.json

## Example usage

New conversation (server creates a sessionId for you):

```bash
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Hi Ashley, who are you?"}'
```

Response:

```json
{
  "sessionId": "b3b3f5a0-1234-4a5b-9c9c-abcdef123456",
  "reply": "Hi! I'm Ashley, your AI assistant...",
  "history": [ ... ],
  "usage": { "inputTokens": 12, "outputTokens": 34 }
}
```

Continue the same conversation:

```bash
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "What did I just ask you?", "sessionId": "b3b3f5a0-1234-4a5b-9c9c-abcdef123456"}'
```

Fetch or delete a session:

```bash
curl http://localhost:3000/api/sessions/b3b3f5a0-1234-4a5b-9c9c-abcdef123456
curl -X DELETE http://localhost:3000/api/sessions/b3b3f5a0-1234-4a5b-9c9c-abcdef123456
```

## Project structure

```
ashleyai-server/
├── server.js              # Express app entry point
├── openapi.yaml            # OpenAPI 3.0 spec (source of truth for /docs)
├── routes/
│   ├── chat.js              # /api/chat and /api/sessions/:id routes
│   └── sessionStore.js      # in-memory session store
├── package.json
├── .env.example
└── README.md
```

## Notes for production use

- Swap the in-memory `sessionStore.js` for Redis or a database — sessions
  are currently lost on server restart and won't scale across instances.
- Add authentication (API keys, JWT, etc.) in front of `/api/*` — this
  starter has none.
- Tighten CORS (`cors()` is wide open) and rate limits for your use case.
- Consider streaming responses (SSE) if you want token-by-token replies.
