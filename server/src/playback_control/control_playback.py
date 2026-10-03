import random
from typing import Any

import spotipy
from spotipy.exceptions import SpotifyException

from src.song_metadata import fetch_metadata


class NoSavedSongsError(Exception):
    pass


class SpotifyPlaybackError(Exception):
    pass


def _fetch_saved_tracks(spotify: spotipy.Spotify) -> list[dict[str, Any]]:
    saved_tracks_page = spotify.current_user_saved_tracks(limit=50)
    saved_tracks = []

    while saved_tracks_page:
        saved_tracks.extend(
            item["track"]
            for item in saved_tracks_page["items"]
            if item["track"] is not None
        )
        if saved_tracks_page["next"] is None:
            break
        saved_tracks_page = spotify.next(saved_tracks_page)

    return saved_tracks


def start_random_song(spotify: spotipy.Spotify) -> None:
    try:
        saved_tracks = _fetch_saved_tracks(spotify)
        if not saved_tracks:
            raise NoSavedSongsError("No liked songs found.")

        selected_track = random.choice(saved_tracks)
        spotify.start_playback(uris=[selected_track["uri"]])
    except SpotifyException as error:
        raise SpotifyPlaybackError("Spotify playback failed.") from error


def pause_song(spotify: spotipy.Spotify) -> None:
    try:
        spotify.pause_playback()
    except SpotifyException as error:
        raise SpotifyPlaybackError("Spotify playback failed.") from error


def resume_song(spotify: spotipy.Spotify) -> None:
    try:
        spotify.start_playback()
    except SpotifyException as error:
        raise SpotifyPlaybackError("Spotify playback failed.") from error


def move_to_timestamp(spotify: spotipy.Spotify, percentage: float) -> None:
    try:
        current_playback = fetch_metadata.fetch_current_playback(spotify)
        duration_ms = current_playback["item"].get("duration_ms")
        if duration_ms is None or duration_ms <= 0:
            raise fetch_metadata.CurrentSongUnavailableError(
                "Current song duration is unavailable."
            )

        position_ms = round(duration_ms * percentage / 100)
        spotify.seek_track(position_ms=position_ms)
    except SpotifyException as error:
        raise SpotifyPlaybackError("Spotify playback failed.") from error
    except fetch_metadata.SpotifyMetadataError as error:
        raise SpotifyPlaybackError("Spotify playback failed.") from error
