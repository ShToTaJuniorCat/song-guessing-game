from collections.abc import Iterator
from typing import Annotated

import spotipy
from fastapi import Depends, Request

from src.playback_control.spotify_client import SpotifyClientManager


def get_spotify_client(request: Request) -> Iterator[spotipy.Spotify]:
    client_manager: SpotifyClientManager = request.app.state.spotify_client_manager
    with client_manager.use_client() as spotify_client:
        yield spotify_client


SpotifyClientDependency = Annotated[
    spotipy.Spotify,
    Depends(get_spotify_client),
]
