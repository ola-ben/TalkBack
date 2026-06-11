import React, { useState, useEffect } from "react";
import ThemeToggle from "./ThemeToggle";

function Avatar({ name, speaking }) {
  const initials = name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative">
        {speaking && (
          <span className="absolute inset-0 rounded-full bg-emerald-500/20 animate-ping" />
        )}
        <div
          className={`w-14 h-14 rounded-full flex items-center justify-center font-semibold text-base transition ${
            speaking
              ? "bg-emerald-500 text-white"
              : "bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300"
          }`}
        >
          {initials}
        </div>
      </div>
      <span className="text-xs text-neutral-500 max-w-[72px] truncate text-center">
        {name}
      </span>
    </div>
  );
}

export default function TalkScreen({
  phase,
  peers,
  myName,
  muted,
  setMuted,
  noiseSuppress,
  setNoiseSuppress,
  onToggleTalk,
  onLeave,
  log,
  theme,
  onToggleTheme,
}) {
  const [talking, setTalking] = useState(false);
  const [showLog, setShowLog] = useState(false);

  // Space bar shortcut on desktop
  useEffect(() => {
    const down = (e) => {
      if (e.code === "Space" && !e.repeat) {
        e.preventDefault();
        handleToggle();
      }
    };
    window.addEventListener("keydown", down);
    return () => window.removeEventListener("keydown", down);
  }); // eslint-disable-line

  async function handleToggle() {
    const nowTalking = await onToggleTalk();
    setTalking(nowTalking);
  }

  const waiting = phase === "waiting";

  // Full static class strings (Tailwind can't see dynamically-built names).
  const pillBase =
    "flex items-center gap-2 text-sm px-4 py-2 rounded-full border transition";
  const pillOff =
    "border-neutral-200 dark:border-neutral-700 text-neutral-500 hover:border-neutral-400 dark:hover:border-neutral-500";
  const pillRed =
    "border-red-500 text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10";
  const pillGreen =
    "border-emerald-500 text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10";
  const pillNeutral =
    "border-neutral-400 text-neutral-700 dark:text-neutral-200 bg-neutral-100 dark:bg-neutral-800";

  return (
    <div className="flex flex-col min-h-screen px-5 pt-6 pb-8 max-w-md mx-auto w-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-10">
        <div className="flex items-center gap-2">
          <span
            className={`w-2.5 h-2.5 rounded-full ${
              waiting ? "bg-amber-400" : "bg-emerald-500"
            }`}
          />
          <span className="text-sm font-medium">
            {waiting ? "Waiting for someone…" : `${peers.length + 1} in room`}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <ThemeToggle theme={theme} onToggle={onToggleTheme} />
          <button
            onClick={onLeave}
            className="text-sm px-4 py-2 rounded-full border border-neutral-200 dark:border-neutral-700 text-neutral-500 hover:text-red-500 hover:border-red-300 dark:hover:border-red-500/40 transition active:scale-95"
          >
            Leave
          </button>
        </div>
      </div>

      {/* Peers */}
      <div className="flex flex-wrap gap-6 justify-center mb-12 min-h-[80px]">
        <Avatar name={myName + " (you)"} speaking={talking && !muted} />
        {peers.map((p) => (
          <Avatar key={p.id} name={p.name} speaking={p.speaking} />
        ))}
        {waiting && (
          <div className="flex flex-col items-center gap-2 opacity-40">
            <div className="w-14 h-14 rounded-full border-2 border-dashed border-neutral-300 dark:border-neutral-600 flex items-center justify-center text-xl text-neutral-400">
              +
            </div>
            <span className="text-xs text-neutral-400">waiting…</span>
          </div>
        )}
      </div>

      {/* Big tap-to-talk button */}
      <div className="flex-1 flex flex-col items-center justify-center gap-6">
        <button
          onClick={handleToggle}
          disabled={waiting}
          className={`relative w-44 h-44 rounded-full flex flex-col items-center justify-center gap-2 font-semibold transition active:scale-95 select-none disabled:opacity-30 disabled:cursor-not-allowed ${
            talking
              ? "bg-emerald-500 text-white shadow-xl shadow-emerald-500/30"
              : "bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-200 hover:border-neutral-400 dark:hover:border-neutral-500"
          }`}
        >
          {talking && (
            <span className="absolute inset-0 rounded-full bg-emerald-400/30 animate-ping" />
          )}
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
            <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
            <line x1="12" y1="19" x2="12" y2="23" />
            <line x1="8" y1="23" x2="16" y2="23" />
          </svg>
          <span className="text-base">{talking ? "Tap to stop" : "Tap to talk"}</span>
        </button>

        <p className="text-sm text-neutral-400">
          {talking ? "You're live" : "Tap to start talking"}
        </p>
      </div>

      {/* Controls row */}
      <div className="flex items-center justify-center gap-3 mt-8">
        <button onClick={() => setMuted((m) => !m)} className={`${pillBase} ${muted ? pillRed : pillOff}`}>
          {muted ? "Unmute" : "Mute"}
        </button>
        <button onClick={() => setNoiseSuppress((n) => !n)} className={`${pillBase} ${noiseSuppress ? pillGreen : pillOff}`}>
          Noise {noiseSuppress ? "On" : "Off"}
        </button>
        <button onClick={() => setShowLog((s) => !s)} className={`${pillBase} ${showLog ? pillNeutral : pillOff}`}>
          Log
        </button>
      </div>

      {/* Activity log */}
      {showLog && (
        <div className="mt-4 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-3 max-h-32 overflow-y-auto">
          {log.length === 0 ? (
            <p className="text-sm text-neutral-400">No activity yet</p>
          ) : (
            log.map((l) => (
              <p key={l.id} className="text-sm text-neutral-500 leading-6">
                {l.msg}
              </p>
            ))
          )}
        </div>
      )}
    </div>
  );
}
