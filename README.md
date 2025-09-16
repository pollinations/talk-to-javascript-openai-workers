# Voice-Controlled Web Interface

This project enables voice-controlled web page manipulation through real-time audio communication. The application allows users to change page colors and interact with web elements using voice commands.


## Develop

Copy [.dev.vars.example](./.dev.vars.example) to `.dev.vars` and fill out your OpenAI API Key.

Install your dependencies

```bash
npm install
```

Run local server

```bash
npm run dev
```

## Deploy

Upload your secret

```bash
npx wrangler secret put OPENAI_API_KEY
```

```bash
npm run deploy
```
