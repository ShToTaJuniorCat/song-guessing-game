from __future__ import annotations

import json
import time
from collections.abc import Callable, Iterator
from contextlib import contextmanager
from pathlib import Path
from threading import Lock

import requests
import spotipy
from spotipy.oauth2 import SpotifyOAuth

CLIENT_IDLE_TIMEOUT_SECONDS = 15 * 60


def create_spotify_client() -> tuple[spotipy.Spotify, requests.Session]:
    credentials_path = Path(__file__).resolve().parents[2] / "credentials.json"
    credentials = json.loads(credentials_path.read_text(encoding="utf-8"))
    auth_manager = SpotifyOAuth(
        client_id=credentials["client_id"],
        client_secret=credentials["client_secret"],
        redirect_uri=credentials["redirect_uri"],
        scope="user-library-read user-modify-playback-state",
    )
    requests_session = requests.Session()
    spotify = spotipy.Spotify(
        auth_manager=auth_manager,
        requests_session=requests_session,
    )
    return spotify, requests_session


class SpotifyClientManager:
    def __init__(
        self,
        *,
        client_factory: Callable[
            [], tuple[spotipy.Spotify, requests.Session]
        ] = create_spotify_client,
        idle_timeout_seconds: float = CLIENT_IDLE_TIMEOUT_SECONDS,
    ) -> None:
        self._client_factory = client_factory
        self._idle_timeout_seconds = idle_timeout_seconds
        self._request_lock = Lock()
        self._state_lock = Lock()
        self._spotify_client: spotipy.Spotify | None = None
        self._requests_session: requests.Session | None = None
        self._active_requests = 0
        self._last_used_at: float | None = None

    @contextmanager
    def use_client(self) -> Iterator[spotipy.Spotify]:
        with self._request_lock:
            with self._state_lock:
                spotify_client = self._spotify_client
                if spotify_client is None:
                    spotify_client, self._requests_session = self._client_factory()
                    self._spotify_client = spotify_client
                self._active_requests += 1

            try:
                yield spotify_client
            finally:
                with self._state_lock:
                    self._active_requests -= 1
                    self._last_used_at = time.monotonic()

    def close_if_idle(self) -> None:
        with self._state_lock:
            if self._spotify_client is None or self._active_requests > 0:
                return
            if self._last_used_at is None:
                return
            if time.monotonic() - self._last_used_at < self._idle_timeout_seconds:
                return

            self._close_client()

    def close(self) -> None:
        with self._request_lock, self._state_lock:
            self._close_client()

    def _close_client(self) -> None:
        try:
            if self._requests_session is not None:
                self._requests_session.close()
        finally:
            self._spotify_client = None
            self._requests_session = None
            self._last_used_at = None