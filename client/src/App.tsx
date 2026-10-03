import { useEffect, useState, type FormEvent } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  Container,
  IconButton,
  Paper,
  Slider,
  Snackbar,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import PauseRoundedIcon from "@mui/icons-material/PauseRounded";
import PlayArrowRoundedIcon from "@mui/icons-material/PlayArrowRounded";
import ReplayRoundedIcon from "@mui/icons-material/ReplayRounded";
import AlbumRoundedIcon from "@mui/icons-material/AlbumRounded";
import {
  getCurrentSong,
  getSongProgress,
  moveToPercentage,
  pauseSong,
  resumeSong,
  startRandomSong,
  type CurrentSong,
} from "./api/client";
import "./App.css";

function normalizeGuess(value: string): string {
  return value.trim().replace(/\s+/g, " ").toLowerCase();
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error
    ? error.message
    : "Something went wrong. Please try again.";
}

function App() {
  const [hasStarted, setHasStarted] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSeeking, setIsSeeking] = useState(false);
  const [percentage, setPercentage] = useState(0);
  const [songGuess, setSongGuess] = useState("");
  const [artistGuess, setArtistGuess] = useState("");
  const [revealedSong, setRevealedSong] = useState<CurrentSong | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [notification, setNotification] = useState<string | null>(null);

  useEffect(() => {
    if (!hasStarted) {
      return;
    }

    let hasReportedError = false;
    const refreshProgress = async () => {
      try {
        const progress = await getSongProgress();
        setPercentage(progress.percentage);
        hasReportedError = false;
      } catch (error) {
        if (!hasReportedError) {
          setNotification(getErrorMessage(error));
          hasReportedError = true;
        }
      }
    };

    void refreshProgress();
    const intervalId = window.setInterval(() => void refreshProgress(), 2000);
    return () => window.clearInterval(intervalId);
  }, [hasStarted]);

  const handleStart = async () => {
    setIsStarting(true);
    setNotification(null);
    setSongGuess("");
    setArtistGuess("");
    setRevealedSong(null);
    setIsCorrect(null);
    setPercentage(0);

    try {
      await startRandomSong();
      setIsPaused(false);
      setHasStarted(true);
    } catch (error) {
      setNotification(getErrorMessage(error));
    } finally {
      setIsStarting(false);
    }
  };

  const handleSubmitGuess = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!songGuess.trim() || !artistGuess.trim()) {
      return;
    }

    setIsSubmitting(true);
    try {
      const song = await getCurrentSong();
      const guessedArtist = normalizeGuess(artistGuess);
      const matchesSong =
        normalizeGuess(songGuess) === normalizeGuess(song.name);
      const matchesArtist = song.artists.some(
        (artist) => normalizeGuess(artist) === guessedArtist,
      );
      setRevealedSong(song);
      setIsCorrect(matchesSong && matchesArtist);
    } catch (error) {
      setNotification(getErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePlaybackToggle = async () => {
    try {
      if (isPaused) {
        await resumeSong();
      } else {
        await pauseSong();
      }
      setIsPaused(!isPaused);
    } catch (error) {
      setNotification(getErrorMessage(error));
    }
  };

  const handleSeek = async (value: number) => {
    setIsSeeking(true);
    try {
      await moveToPercentage(value);
      setPercentage(value);
    } catch (error) {
      setNotification(getErrorMessage(error));
    } finally {
      setIsSeeking(false);
    }
  };

  return (
    <Box component="main" className="app-shell">
      <Container maxWidth="md" className="app-container">
        <Stack
          className="topbar"
          direction="row"
          sx={{ alignItems: "center", justifyContent: "space-between" }}
        >
          <Stack direction="row" spacing={1.25} sx={{ alignItems: "center" }}>
            <Box className="brand-mark">
              <AlbumRoundedIcon />
            </Box>
            <Typography className="brand-name">SIDE A</Typography>
          </Stack>
          <Chip
            className="round-chip"
            label="THE MUSIC GUESSING GAME"
            size="small"
          />
        </Stack>

        <Box className="intro">
          <Typography className="eyebrow">
            A LITTLE TEST OF YOUR MEMORY
          </Typography>
          <Typography component="h1" className="page-title">
            Name that
            <Box component="span" className="title-accent">
              {" "}
              tune.
            </Box>
          </Typography>
          <Typography className="intro-copy">
            Listen close, find your place in the song, and trust your instincts.
          </Typography>
        </Box>

        <Paper elevation={0} className="game-card">
          <Stack
            className="card-topline"
            direction="row"
            sx={{ alignItems: "center", justifyContent: "space-between" }}
          >
            <Typography className="section-label">
              YOUR LISTENING ROOM
            </Typography>
            <Chip
              className={hasStarted ? "status-chip is-live" : "status-chip"}
              label={
                hasStarted
                  ? isPaused
                    ? "PAUSED"
                    : "NOW PLAYING"
                  : "READY WHEN YOU ARE"
              }
              size="small"
            />
          </Stack>

          <Box className="player-display">
            <Box className="record-art">
              <Box className="record-grooves">
                <AlbumRoundedIcon className="record-icon" />
              </Box>
              <Box className="record-center" />
            </Box>
            <Typography className="mystery-label">
              {hasStarted ? "MYSTERY TRACK" : "THE NEXT SONG IS A SURPRISE"}
            </Typography>
            <Typography className="track-title">
              {revealedSong
                ? revealedSong.name
                : hasStarted
                  ? "Unknown track"
                  : "Ready to play?"}
            </Typography>
            <Typography className="track-subtitle">
              {revealedSong
                ? revealedSong.artists.join(", ")
                : hasStarted
                  ? "Artist and title are hidden until your guess."
                  : "Your liked songs are waiting in the queue."}
            </Typography>
          </Box>

          <Box className="player-controls">
            <Stack direction="row" spacing={2} sx={{ alignItems: "center" }}>
              <IconButton
                className="play-toggle"
                aria-label={isPaused ? "Resume song" : "Pause song"}
                disabled={!hasStarted || isStarting}
                onClick={() => void handlePlaybackToggle()}
              >
                {isPaused ? <PlayArrowRoundedIcon /> : <PauseRoundedIcon />}
              </IconButton>
              <Box className="progress-area">
                <Slider
                  aria-label="Song progress percentage"
                  className="progress-slider"
                  min={0}
                  max={100}
                  value={percentage}
                  valueLabelDisplay="auto"
                  valueLabelFormat={(value) => `${Math.round(value)}%`}
                  disabled={!hasStarted || isSeeking}
                  onChange={(_event, value) => {
                    if (typeof value === "number") {
                      setPercentage(value);
                    }
                  }}
                  onChangeCommitted={(_event, value) => {
                    if (typeof value === "number") {
                      void handleSeek(value);
                    }
                  }}
                />
                <Stack direction="row" sx={{ justifyContent: "space-between" }}>
                  <Typography className="progress-caption">0%</Typography>
                  <Typography className="progress-value">
                    {Math.round(percentage)}% through
                  </Typography>
                  <Typography className="progress-caption">100%</Typography>
                </Stack>
              </Box>
            </Stack>
            <Typography className="control-hint">
              Drag the slider to jump to a moment in the song.
            </Typography>
          </Box>

          <Box className="guess-section">
            <Stack
              className="guess-heading"
              direction="row"
              sx={{ alignItems: "center", justifyContent: "space-between" }}
            >
              <Box>
                <Typography className="section-label">
                  MAKE YOUR GUESS
                </Typography>
                <Typography className="guess-description">
                  What song is playing, and who sings it?
                </Typography>
              </Box>
              {revealedSong && (
                <Chip
                  className={
                    isCorrect
                      ? "result-chip is-correct"
                      : "result-chip is-incorrect"
                  }
                  label={isCorrect ? "NAILED IT" : "NOT QUITE"}
                />
              )}
            </Stack>
            <Box
              component="form"
              className="guess-form"
              onSubmit={(event) => void handleSubmitGuess(event)}
            >
              <TextField
                label="Song title"
                placeholder="Type your guess"
                value={songGuess}
                onChange={(event) => setSongGuess(event.target.value)}
                disabled={!hasStarted || Boolean(revealedSong) || isSubmitting}
                fullWidth
                required
              />
              <TextField
                label="Artist"
                placeholder="Who made it?"
                value={artistGuess}
                onChange={(event) => setArtistGuess(event.target.value)}
                disabled={!hasStarted || Boolean(revealedSong) || isSubmitting}
                fullWidth
                required
              />
              <Button
                className="guess-button"
                type="submit"
                variant="contained"
                disabled={!hasStarted || Boolean(revealedSong) || isSubmitting}
              >
                {isSubmitting ? "Checking…" : "Lock in guess"}
              </Button>
            </Box>
            {!hasStarted && (
              <Typography className="helper-note">
                Start a round to unlock your guess.
              </Typography>
            )}
          </Box>

          <Box className="card-footer">
            <Typography className="footer-note">
              {revealedSong
                ? "Titles and artists are checked without regard to capitalization."
                : "No peeking. The song stays a mystery until you lock in your guess."}
            </Typography>
            <Button
              className="start-button"
              variant="contained"
              startIcon={
                hasStarted ? <ReplayRoundedIcon /> : <PlayArrowRoundedIcon />
              }
              disabled={isStarting}
              onClick={() => void handleStart()}
            >
              {isStarting
                ? "Starting…"
                : hasStarted
                  ? "Start a new song"
                  : "Start"}
            </Button>
          </Box>
        </Paper>

        <Typography className="page-footer">
          ONE SONG. ONE GUESS. HOW WELL DO YOU KNOW IT?
        </Typography>
      </Container>

      <Snackbar
        open={notification !== null}
        autoHideDuration={6000}
        onClose={() => setNotification(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          severity="error"
          variant="filled"
          onClose={() => setNotification(null)}
        >
          {notification}
        </Alert>
      </Snackbar>
    </Box>
  );
}

export default App;
