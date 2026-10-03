import asyncio
from collections.abc import AsyncGenerator
from contextlib import asynccontextmanager, suppress

from fastapi import FastAPI

from src.playback_control.routers import router as playback_control_router
from src.playback_control.spotify_client import SpotifyClientManager
from src.song_metadata.routers import router as song_metadata_router


async def _close_idle_spotify_clients(client_manager: SpotifyClientManager) -> None:
    while True:
        await asyncio.sleep(60)
        await asyncio.to_thread(client_manager.close_if_idle)


@asynccontextmanager
async def lifespan(fastapi_app: FastAPI) -> AsyncGenerator[None, None]:
    client_manager = SpotifyClientManager()
    fastapi_app.state.spotify_client_manager = client_manager
    idle_cleanup_task = asyncio.create_task(_close_idle_spotify_clients(client_manager))

    try:
        yield
    finally:
        idle_cleanup_task.cancel()
        try:
            with suppress(asyncio.CancelledError):
                await idle_cleanup_task
        finally:
            await asyncio.to_thread(client_manager.close)


app = FastAPI(lifespan=lifespan)
app.include_router(song_metadata_router)
app.include_router(playback_control_router)
