import React, { useState, useEffect } from "react";

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
          <>
            <span className="absolute inset-0 rounded-full bg-emerald-500/20 animate-ping" />
            <span className="absolute inset-[-6px] rounded-full border border-emerald-500/40" />
          </>
        )}
        <div
          className={`w-14 h-14 rounded-full flex items-center justify-center font-mono font-bold text-base transition-all ${
            speaking
              ? "bg-emerald-500/20 border-2 border-emerald-400 text-emerald-300"
              : "bg-zinc-800 border border-zinc-700 text-zinc-300"
          }`}
        >
          {initials}
        </div>
      </div>
      <span className="text-xs font-mono text-zinc-400 max-w-[72px] truncate text-center">
        {name}
      </span>
      {speaking && (
        <span className="text-[10px] font-mono text-emerald-400 animate-pulse">
          speaking
        </span>
      )}
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

  return (
    <div className="flex flex-col min-h-screen bg-[#0a0a0a] px-4 pt-10 pb-6">

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <p className="text-xs font-mono text-zinc-500 uppercase tracking-widest">TalkBack</p>
          <div className="flex items-center gap-2 mt-0.5">
            <span
              className={`w-2 h-2 rounded-full ${
                waiting ? "bg-amber-400" : "bg-emerald-400"
              }`}
            />
            <span className="text-sm font-mono text-zinc-300">
              {waiting ? "Waiting for someone to join…" : `${peers.length + 1} in room`}
            </span>
          </div>
        </div>

        <button
          onClick={onLeave}
          className="text-xs font-mono text-zinc-500 border border-zinc-700 rounded-lg px-3 py-1.5 hover:text-red-400 hover:border-red-500/40 transition-colors active:scale-95"
        >
          Leave
        </button>
      </div>

      {/* Peers */}
      <div className="flex flex-wrap gap-6 justify-center mb-10 min-h-[80px]">
        {/* Self */}
        <Avatar name={myName + " (you)"} speaking={talking && !muted} />

        {/* Remote peers */}
        {peers.map((p) => (
          <Avatar key={p.id} name={p.name} speaking={p.speaking} />
        ))}

        {waiting && (
          <div className="flex flex-col items-center gap-2 opacity-40">
            <div className="w-14 h-14 rounded-full border border-dashed border-zinc-600 flex items-center justify-center">
              <span className="text-zinc-500 text-lg">+</span>
            </div>
            <span className="text-xs font-mono text-zinc-600">waiting…</span>
          </div>
        )}
      </div>

      {/* Big tap-to-talk button */}
      <div className="flex-1 flex flex-col items-center justify-center gap-6">
        <button
          onClick={handleToggle}
          disabled={waiting}
          className={`relative w-40 h-40 rounded-full flex flex-col items-center justify-center gap-2 font-mono font-bold transition-all active:scale-95 select-none disabled:opacity-30 disabled:cursor-not-allowed ${
            talking
              ? "bg-emerald-500 text-black shadow-[0_0_48px_rgba(16,185,129,0.35)]"
              : "bg-zinc-900 border-2 border-zinc-700 text-zinc-300 hover:border-zinc-500"
          }`}
        >
          {talking && (
            <span className="absolute inset-0 rounded-full bg-emerald-400/20 animate-ping" />
          )}
          <svg
            width="36"
            height="36"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
            <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
            <line x1="12" y1="19" x2="12" y2="23" />
            <line x1="8" y1="23" x2="16" y2="23" />
          </svg>
          <span className="text-sm">{talking ? "Tap to stop" : "Tap to talk"}</span>
        </button>

        <p className="text-xs font-mono text-zinc-600">
          {talking ? "You're live — tap again to stop" : "Tap once to start talking freely"}
        </p>
      </div>

      {/* Controls row */}
      <div className="flex items-center justify-center gap-4 mt-6">
        <button
          onClick={() => setMuted((m) => !m)}
          className={`flex items-center gap-2 text-xs font-mono px-3 py-2 rounded-lg border transition-colors ${
            muted
              ? "border-red-500/50 text-red-400 bg-red-500/10"
              : "border-zinc-700 text-zinc-400 hover:border-zinc-500"
          }`}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            {muted ? (
              <>
                <line x1="1" y1="1" x2="23" y2="23" />
                <path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6" />
                <path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23" />
                <line x1="12" y1="19" x2="12" y2="23" />
                <line x1="8" y1="23" x2="16" y2="23" />
              </>
            ) : (
              <>
                <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                <line x1="12" y1="19" x2="12" y2="23" />
                <line x1="8" y1="23" x2="16" y2="23" />
              </>
            )}
          </svg>
          {muted ? "Unmute" : "Mute"}
        </button>

        <button
          onClick={() => setNoiseSuppress((n) => !n)}
          className={`flex items-center gap-2 text-xs font-mono px-3 py-2 rounded-lg border transition-colors ${
            noiseSuppress
              ? "border-emerald-500/50 text-emerald-400 bg-emerald-500/10"
              : "border-zinc-700 text-zinc-400 hover:border-zinc-500"
          }`}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
          </svg>
          Noise {noiseSuppress ? "ON" : "OFF"}
        </button>

        <button
          onClick={() => setShowLog((s) => !s)}
          className="flex items-center gap-2 text-xs font-mono px-3 py-2 rounded-lg border border-zinc-700 text-zinc-500 hover:border-zinc-500 transition-colors"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          Log
        </button>
      </div>

      {/* Activity log */}
      {showLog && (
        <div className="mt-4 bg-zinc-900/80 border border-zinc-800 rounded-xl p-3 max-h-32 overflow-y-auto">
          {log.length === 0 ? (
            <p className="text-xs font-mono text-zinc-600">No activity yet</p>
          ) : (
            log.map((l) => (
              <p key={l.id} className="text-xs font-mono text-zinc-500 leading-6">
                › {l.msg}
              </p>
            ))
          )}
        </div>
      )}
    </div>
  );
}
