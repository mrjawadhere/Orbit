import { useEffect, useState } from "react";

type Theme = "light" | "dark";

const STORAGE_KEY = "orbit-theme";

function applyTheme(theme: Theme) {
  document.documentElement.classList.toggle("dark", theme === "dark");
}

/** Persisted light/dark theme. Defaults to Orbit's light surface. */
export function useTheme() {
  const [theme, setTheme] = useState<Theme>("light");

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    const next: Theme = stored === "light" || stored === "dark" ? stored : "light";
    setTheme(next);
    applyTheme(next);
  }, []);

  const select = (next: Theme) => {
    window.localStorage.setItem(STORAGE_KEY, next);
    applyTheme(next);
    setTheme(next);
  };

  const toggle = () => select(theme === "dark" ? "light" : "dark");

  return { theme, toggle, setTheme: select };
}

