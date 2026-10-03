# FastAPI Style Guide (draft)

A companion to the general code style guide. Everything in the general guide applies here unless this file says otherwise. Rules marked *(soft)* are preferences, not hard rules.

---

## 1. Routers

- A router function should be clean. Ideally it only calls one external function that handles everything. *(soft)*
- Business logic never lives in the router file. It goes in a directory alongside the router (see section 6).
- `HTTPException` is raised **in the router itself**, never in a helper that the router calls.
  - If a route needs more than ~2 `HTTPException`s, move the translation into a wrapper function that does only exception handling. Keep that wrapper in the same file as the router.
  - At that point, consider moving the router into its own file.
- Business logic raises **custom exceptions** and knows nothing about HTTP. The router (or its wrapper) translates them into `HTTPException`s.

```python
@router.get("/{log_id}")
def get_log_by_id(log_id: int) -> LogEntry:
    try:
        return fetch_log_entry(log_id)
    except LogNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error
```

## 2. HTTP methods

- Use the correct HTTP method for what the endpoint does (`GET`, `POST`, `PUT`, `PATCH`, `DELETE`, ...).
- If no existing method fits, **do not redesign or change anything automatically.** Tell the human about the mismatch and consult them on whether to change it now or later.
- Collect all such mismatches in a list at the end of the response.

## 3. Request and response models

- Any input or output that is not a simple type (`int`, `float`, `str`, `bool`) is a **Pydantic `BaseModel`**. This covers return values, request bodies, and non-basic query params.
- Use FastAPI's native validation. Dataclasses are for internal use only, never at the endpoint boundary.
- Return type annotations are enough. Do not add `response_model=` to every route.
- A bare `list[Model]` as a return type is fine.
- Flag/boolean query params on endpoints are more acceptable than in general functions (e.g. `?include_archived=true`). If there are enough of them to justify it, split into a separate endpoint.

## 4. Naming

- Route function names follow the general naming guide: descriptive, intention-revealing, precise.
- Ideally the function name matches the route:
  - `POST /start-random-song` -> `start_random_song`
  - `GET /logs/{log_id}` -> `get_log_by_id`
- Use verbs or nouns depending on which reads better.
- `GET` routes may be named `get_...`. The `get` / `fetch` distinction is not strict here, as long as the verb matches what the reader sees, even if the function is a black box.

## 5. main.py and app.py

Both are written for small projects: host and port are hardcoded. Larger projects should load them from config.

**`/main.py`** is the only file that runs code, and the only one with the `__main__` guard:

```python
import uvicorn
from src.app import app


def main() -> None:
    uvicorn.run(app, host="127.0.0.1", port=8000)


if __name__ == "__main__":
    main()
```

**`/src/app.py`** is one nesting level deeper. It wires the app together:

```python
from fastapi import FastAPI

from src.some_prefix.routers import router as some_prefix_router
from src.other_prefix.routers import router as other_prefix_router

app = FastAPI()
app.include_router(some_prefix_router)
app.include_router(other_prefix_router)
```

`app.py` may also hold middleware, startup/shutdown hooks, and log handling, if the project needs them.

## 6. File structure

- The file structure should reflect the API structure, unless there is a good reason to break it.
- **Every endpoint group gets its own directory**, even a small one.
- Directory names should be more indicative than route prefixes. The directory name may differ from the route prefix as long as both carry similar information (e.g. route `/logs`, directory `log_management/`).
- Inside a group directory:
  - `routers.py` holds the router.
  - Business logic files are named by action (e.g. `download_logs.py`, `fetch_log_entries.py`). Several related functions per file are fine, as long as it doesn't spiral out of control.
- Models live in `models.py`, at a relatively high directory. Often one `models.py` for all of `src/`. Split it only when it grows. Both over-splitting and under-splitting hurt readability.
- **When to split a prefix into its own group:** it depends on how many endpoints there are and how sensible the grouping is. Be about 47% loose with this trigger, because splitting too much makes the code harder to read and maintain.
  - 3 endpoints, 2 of them very distinct from the third: give the two their own group.
  - 7 clearly un-groupable endpoints that are well defined by one small group: don't break them up.

```
main.py
src/
  app.py
  models.py
  log_management/
    routers.py
    download_logs.py
    fetch_log_entries.py
  metadata/
    routers.py
    fetch_metadata.py
```

---

## Open items (not yet discussed)

- Sync (`def`) vs async (`async def`) routes, and what to do about blocking calls.
- Dependency injection with `Depends` (DB sessions, auth, config).
- Error response shape and status code choices (404 vs 400 vs 422).
- Verb paths for action endpoints (`/start-random-song`) as the standard vs a fallback when no noun fits.
- Testing (`TestClient`, overriding dependencies).
- Path conventions (kebab-case, plural vs singular) and API versioning.
- Logging, CORS, and middleware.
- Config and settings management.
