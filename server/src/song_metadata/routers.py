from fastapi import APIRouter, HTTPException, status

from src.models import CurrentlyPlayingSong, SongProgress
from src.playback_control.dependencies import SpotifyClientDependency
from src.song_metadata import fetch_metadata

router = APIRouter()


@router.get("/currently-playing-song")
def get_currently_playing_song(spotify: SpotifyClientDependency) -> CurrentlyPlayingSong:
    try:
        return fetch_metadata.fetch_currently_playing_song(spotify)
    except fetch_metadata.CurrentSongUnavailableError as error:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(error)) from error
    except fetch_metadata.SpotifyMetadataError as error:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=str(error)) from error


@router.get("/current-song-timestamp")
def get_current_song_timestamp(spotify: SpotifyClientDependency) -> SongProgress:
    try:
        return fetch_metadata.fetch_current_song_timestamp(spotify)
    except fetch_metadata.CurrentSongUnavailableError as error:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(error)) from error
    except fetch_metadata.SpotifyMetadataError as error:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=str(error)) from error
