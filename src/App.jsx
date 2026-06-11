import React, { useState, useEffect } from "react";
import JoinScreen from "./components/JoinScreen";
import TalkScreen from "./components/TalkScreen";
import ThemeToggle from "./components/ThemeToggle";
import { usePeer } from "./hooks/usePeer";

export default function App() {
  const [myName, setMyName] = useState("You");

  // Light ("white") is the default theme; persists across reloads.
  const [theme, setTheme] = useState(
    () => localStorage.getItem("tb-theme") || "light"
  );
  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    localStorage.setItem("tb-theme", theme);
  }, [theme]);
  const toggleTheme = () =>
    setTheme((t) => (t === "dark" ? "light" : "dark"));

  const {
    phase,
    peers,
    muted,
    setMuted,
    noiseSuppress,
    setNoiseSuppress,
    errorMsg,
    log,
    joinRoom,
    toggleTalk,
    leaveRoom,
  } = usePeer();

  function handleJoin(room, name) {
    setMyName(name);
    joinRoom(room, name);
  }

  if (phase === "idle" || phase === "error") {
    return (
      <>
        <JoinScreen
          onJoin={handleJoin}
          connecting={false}
          theme={theme}
          onToggleTheme={toggleTheme}
        />
        {phase === "error" && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-500/40 text-red-600 dark:text-red-300 text-sm px-4 py-2 rounded-xl">
            {errorMsg || "Connection error. Try again."}
          </div>
        )}
      </>
    );
  }

  if (phase === "connecting") {
    return (
      <div className="relative flex items-center justify-center min-h-screen">
        <div className="absolute top-5 right-5">
          <ThemeToggle theme={theme} onToggle={toggleTheme} />
        </div>
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm text-neutral-500">Connecting…</p>
        </div>
      </div>
    );
  }

  // phase === "waiting" | "ready"
  return (
    <TalkScreen
      phase={phase}
      peers={peers}
      myName={myName}
      muted={muted}
      setMuted={setMuted}
      noiseSuppress={noiseSuppress}
      setNoiseSuppress={setNoiseSuppress}
      onToggleTalk={toggleTalk}
      onLeave={leaveRoom}
      log={log}
      theme={theme}
      onToggleTheme={toggleTheme}
    />
  );
}
