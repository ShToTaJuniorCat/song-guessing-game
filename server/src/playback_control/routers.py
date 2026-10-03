from fastapi import APIRouter, HTTPException, status

from src.playback_control import control_playback
from src.playback_control.dependencies import SpotifyClientDependency
from src.models import SongProgress
from src.song_metadata import fetch_metadata

router = APIRouter()


@router.post("/start-random-song")
def start_random_song(spotify: SpotifyClientDependency) -> None:
    try:
        control_playback.start_random_song(spotify)
    except control_playback.NoSavedSongsError as error:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(error)) from error
    except control_playback.SpotifyPlaybackError as error:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=str(error)) from error


@router.put("/pause-song")
def pause_song(spotify: SpotifyClientDependency) -> None:
    try:
        control_playback.pause_song(spotify)
    except control_playback.SpotifyPlaybackError as error:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=str(error)) from error


@router.put("/resume-song")
def resume_song(spotify: SpotifyClientDependency) -> None:
    try:
        control_playback.resume_song(spotify)
    except control_playback.SpotifyPlaybackError as error:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=str(error)) from error


@router.put("/move-to-timestamp")
def move_to_timestamp(
    progress: SongProgress,
    spotify: SpotifyClientDependency,
) -> None:
    try:
        control_playback.move_to_timestamp(spotify, progress.percentage)
    except fetch_metadata.CurrentSongUnavailableError as error:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(error)) from error
    except control_playback.SpotifyPlaybackError as error:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=str(error)) from error
