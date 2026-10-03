from typing import Any

import spotipy
from spotipy.exceptions import SpotifyException

from src.models import CurrentlyPlayingSong, SongProgress


class CurrentSongUnavailableError(Exception):
    pass


class SpotifyMetadataError(Exception):
    pass


def fetch_currently_playing_song(spotify: spotipy.Spotify) -> CurrentlyPlayingSong:
    current_playback = fetch_current_playback(spotify)
    current_track = current_playback["item"]
    album = current_track.get("album")
    artists = current_track.get("artists")

    if (
        not current_track.get("name")
        or not current_track.get("uri")
        or not album
        or not album.get("name")
        or not artists
    ):
        raise CurrentSongUnavailableError("Current song details are unavailable.")

    return CurrentlyPlayingSong(
        name=current_track["name"],
        artists=[artist["name"] for artist in artists if artist.get("name")],
        album=album["name"],
        uri=current_track["uri"],
    )


def fetch_current_playback(spotify: spotipy.Spotify) -> dict[str, Any]:
    try:
        current_playback = spotify.current_playback()
    except SpotifyException as error:
        raise SpotifyMetadataError("Spotify playback state could not be fetched.") from error

    if current_playback is None or current_playback.get("item") is None:
        raise CurrentSongUnavailableError("No current song is available.")

    return current_playback


def fetch_current_song_timestamp(spotify: spotipy.Spotify) -> SongProgress:
    current_playback = fetch_current_playback(spotify)
    progress_ms = current_playback.get("progress_ms")
    duration_ms = current_playback["item"].get("duration_ms")

    if progress_ms is None or duration_ms is None or duration_ms <= 0:
        raise CurrentSongUnavailableError("Current song progress is unavailable.")

    percentage = min(100.0, max(0.0, progress_ms / duration_ms * 100))
    return SongProgress(percentage=percentage)