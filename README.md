# Doc Harbour Frontend

React interface for the Doc Harbour document assistant.

## Pages

- Overview: upload, list, and delete PDF, DOCX, and TXT documents.
- Ask documents: continue the single saved chat thread and inspect source excerpts; history survives a page refresh and backend restart.
- Settings: select a provider, fetch its model catalog and available free-model guidance, set a model and owner contact link.

Model discovery currently supports Google Gemini, Groq, and OpenRouter. The backend calls provider catalog endpoints using the API key entered in the settings page. OpenRouter model pricing is filtered live; Groq model availability is live but exact rate limits are account-specific; Gemini free eligibility is limited to a maintained model catalog and may vary by account. OpenAI and Anthropic are supported for paid BYOK, but do not have a general free API tier.

## Run locally

Requirements: Node.js 20+ and the backend running at `http://127.0.0.1:8000`.

```powershell
npm install
npm run dev
```

Open the URL printed by Vite, usually `http://localhost:5173`. The development server proxies `/api` to the backend. Set `VITE_API_PROXY` before starting Vite to use another backend address.

## Production build

Set `VITE_API_BASE` to your backend URL, then run:

```powershell
npm run build
npm run preview
```

Build output is in `dist/`. Configure backend CORS for the deployed frontend origin. Provider API keys are sent to the backend and stored encrypted in PostgreSQL; never put them in frontend environment variables or browser storage.

