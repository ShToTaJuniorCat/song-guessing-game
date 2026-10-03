import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { createTheme, CssBaseline, ThemeProvider } from "@mui/material";
import "./index.css";
import App from "./App.tsx";

const theme = createTheme({
  palette: {
    mode: "dark",
    primary: { main: "#d6ed72" },
    background: { default: "#111311", paper: "#1a1d19" },
    text: { primary: "#f5f2e9", secondary: "#a4a69d" },
  },
  typography: {
    fontFamily: "Inter, 'Segoe UI', sans-serif",
  },
});

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <App />
    </ThemeProvider>
  </StrictMode>,
);
