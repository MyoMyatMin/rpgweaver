RPGWeaver is an AI-powered tool for generating structured RPG content (dialogues and quests) using Google Gemini.

## Setup

1. Create an environment file:

```
cp .env.local.example .env.local
```

2. Add your Google Gemini API key to `.env.local`:

```
GEMINI_API_KEY=your_api_key
```

3. Install dependencies and start the dev server:

```
npm install
npm run dev
```

Open http://localhost:3000

## API

- POST `/api/generate` with body matching `types/` definitions. Returns a `dialogue` or `quest` response structure.

## Tech

- Next.js App Router, TypeScript, Tailwind CSS
- Google Gemini model `gemini-1.5-flash-latest`

## Notes

- Basic in-memory rate limit and validation are applied server-side.
