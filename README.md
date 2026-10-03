# Song Guessing Game

This song guessing game is a Spotify-powered music challenge. It picks a random song from your liked tracks, starts playback, and asks you to identify the song title and artist while the track plays.

The project is split into:

- a React + TypeScript frontend in `client/`
- a FastAPI + Spotipy backend in `server/`

## Features

- Starts a random song from your Spotify liked songs
- Lets you pause, resume, and seek through playback
- Shows the current track progress while you listen
- Lets you guess the song title and artist
- Evaluates guesses loosely, ignoring punctuation and capitalization
- Uses Spotify OAuth for authentication and playback permissions

## Tech stack

- Frontend: React, Vite, Material UI
- Backend: FastAPI, Spotipy, Uvicorn
- Auth: Spotify OAuth
- Data flow: local browser UI calling the FastAPI API, which controls a Spotify Web API session

## Repository structure

```text
.
├── client/                 # React frontend
│   ├── src/               # UI and API client logic
│   ├── package.json       # Vite app scripts and dependencies
│   └── index.html
├── server/                # FastAPI backend
│   ├── src/               # Application code, routers, and Spotify integrations
│   ├── main.py            # Entrypoint for the API server
│   ├── pyproject.toml     # Python dependencies
│   └── uv.lock
├── .gitignore             # Ignored local files such as credentials and dependencies
├── credentials.json       # Local Spotify app credentials (not committed)
└── README.md
```

## Prerequisites

Before running the app, make sure you have:

- Node.js 20+ and npm
- Python 3.9+
- A Spotify Developer app with a client ID and client secret
- Access to a Spotify account with liked songs

## Spotify setup

1. Create or open a Spotify app in the Spotify Developer Dashboard:
   https://developer.spotify.com/dashboard
2. Add a redirect URI such as:
   `http://127.0.0.1:8888/callback`
3. Create a root-level `credentials.json` file in this repo with the exact values from your app:

```json
{
  "client_id": "YOUR_CLIENT_ID",
  "client_secret": "YOUR_CLIENT_SECRET",
  "redirect_uri": "http://127.0.0.1:8888/callback"
}
```

The file is intentionally ignored by Git via `.gitignore`, so your credentials stay local.

## Running the app

### 1) Start the backend

```bash
cd server
uv sync
uv run uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

The API will be available at:

- http://127.0.0.1:8000/docs
- http://127.0.0.1:8000/openapi.json

### 2) Start the frontend

Open a second terminal and run:

```bash
cd client
npm install
npm run dev
```

Then open the local Vite URL shown in the terminal, usually:

- http://localhost:5173

## Backend API

The FastAPI backend exposes endpoints for the game flow, including:

- `POST /start-random-song` — begin a round with a random liked song
- `PUT /pause-song` — pause current playback
- `PUT /resume-song` — resume current playback
- `PUT /move-to-timestamp` — seek to a percentage of the current song
- `GET /currently-playing-song` — fetch the active track metadata
- `GET /current-song-timestamp` — fetch playback progress information

## Notes

- The app expects a Spotify device to be available for playback.
- The first time the app authenticates, Spotify may prompt for consent and redirect you back to your configured callback.
- This project is designed for local use and is not production-hardened for deployment.

## Development helpers

The client includes an API type generation script:

```bash
cd client
npm run generate:api-types
```

This generates TypeScript types from the OpenAPI schema, which can be useful when the backend changes.
