from pydantic import BaseModel, Field


class CurrentlyPlayingSong(BaseModel):
    name: str
    artists: list[str]
    album: str
    uri: str


class SongProgress(BaseModel):
    percentage: float = Field(ge=0, le=100)
