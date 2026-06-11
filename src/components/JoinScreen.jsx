import React, { useState } from "react";
import ThemeToggle from "./ThemeToggle";

export default function JoinScreen({ onJoin, connecting, theme, onToggleTheme }) {
  const [room, setRoom] = useState("");
  const [name, setName] = useState("");

  function handleJoin() {
    if (!room.trim()) return;
    onJoin(room.trim(), name.trim() || "User");
  }

  const inputClass =
    "w-full rounded-xl px-4 py-3 text-base bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-neutral-600 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition";

  return (
    <div className="relative flex flex-col items-center justify-center min-h-screen px-6">
      <div className="absolute top-5 right-5">
        <ThemeToggle theme={theme} onToggle={onToggleTheme} />
      </div>

      <div className="w-full max-w-sm">
        {/* Logo / title */}
        <div className="mb-10 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-emerald-500 mb-5 shadow-lg shadow-emerald-500/20">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
              <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
              <line x1="12" y1="19" x2="12" y2="23" />
              <line x1="8" y1="23" x2="16" y2="23" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold tracking-tight">TalkBack</h1>
          <p className="text-sm text-neutral-500 mt-1.5">Tap to talk, anywhere</p>
        </div>

        {/* Form */}
        <div className="space-y-4">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
            maxLength={20}
            className={inputClass}
          />

          <input
            type="text"
            value={room}
            onChange={(e) => setRoom(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleJoin()}
            placeholder="Room code"
            maxLength={24}
            className={inputClass}
          />

          <button
            onClick={handleJoin}
            disabled={!room.trim() || connecting}
            className="w-full rounded-xl py-3.5 text-base font-semibold bg-emerald-500 text-white hover:bg-emerald-600 disabled:bg-neutral-200 dark:disabled:bg-neutral-800 disabled:text-neutral-400 disabled:cursor-not-allowed transition active:scale-[0.98]"
          >
            {connecting ? "Connecting…" : "Join Room"}
          </button>

          <p className="text-center text-xs text-neutral-400">
            Both people enter the same code
          </p>
        </div>
      </div>
    </div>
  );
}
