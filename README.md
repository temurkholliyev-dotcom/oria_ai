# Nia AI

## Local run

```powershell
Copy-Item .env.example .env
npm.cmd install
npm.cmd start
```

Open `http://localhost:4173`.

## Deploy on Render

1. Push this folder to a GitHub repository.
2. In Render, choose **New > Blueprint** and select the repository.
3. Add `GEMINI_API_KEY` in the service environment variables.
4. Deploy. Render uses `render.yaml`, starts `npm start`, and checks `/api/health`.
