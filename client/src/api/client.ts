import type { components } from "./schema";

export type CurrentSong = components["schemas"]["CurrentlyPlayingSong"];
export type SongProgress = components["schemas"]["SongProgress"];

async function request(path: string, init?: RequestInit): Promise<Response> {
  const response = await fetch(`/api${path}`, init);
  if (!response.ok) {
    const body = await response.text();
    let message = `Request failed (${response.status}).`;

    if (body) {
      try {
        const errorBody: unknown = JSON.parse(body);
        if (
          typeof errorBody === "object" &&
          errorBody !== null &&
          "detail" in errorBody &&
          typeof errorBody.detail === "string"
        ) {
          message = errorBody.detail;
        }
      } catch (error) {
        if (!(error instanceof SyntaxError)) {
          throw error;
        }
      }
    }

    throw new Error(message);
  }
  return response;
}

export async function startRandomSong(): Promise<void> {
  await request("/start-random-song", { method: "POST" });
}

export async function pauseSong(): Promise<void> {
  await request("/pause-song", { method: "PUT" });
}

export async function resumeSong(): Promise<void> {
  await request("/resume-song", { method: "PUT" });
}

export async function moveToPercentage(percentage: number): Promise<void> {
  await request("/move-to-timestamp", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ percentage }),
  });
}

export async function getSongProgress(): Promise<SongProgress> {
  const response = await request("/current-song-timestamp");
  return response.json() as Promise<SongProgress>;
}

export async function getCurrentSong(): Promise<CurrentSong> {
  const response = await request("/currently-playing-song");
  return response.json() as Promise<CurrentSong>;
}
