import React, { useState } from "react";

export default function JoinScreen({ onJoin, connecting }) {
  const [room, setRoom] = useState("");
  const [name, setName] = useState("");

  function handleJoin() {
    if (!room.trim()) return;
    onJoin(room.trim(), name.trim() || "User");
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-6 bg-[#0a0a0a]">
      <div className="w-full max-w-sm">

        {/* Logo / title */}
        <div className="mb-10 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 mb-4">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
              <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
              <line x1="12" y1="19" x2="12" y2="23"/>
              <line x1="8" y1="23" x2="16" y2="23"/>
            </svg>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white font-mono">TalkBack</h1>
          <p className="text-sm text-zinc-500 mt-1 font-mono">tap-to-talk, anywhere</p>
        </div>

        {/* Form */}
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-mono text-zinc-400 mb-2 uppercase tracking-widest">
              Your name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Alex"
              maxLength={20}
              className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 text-white font-mono text-sm placeholder-zinc-600 focus:outline-none focus:border-emerald-500 transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-mono text-zinc-400 mb-2 uppercase tracking-widest">
              Room code
            </label>
            <input
              type="text"
              value={room}
              onChange={(e) => setRoom(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleJoin()}
              placeholder="e.g. crew42"
              maxLength={24}
              className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 text-white font-mono text-sm placeholder-zinc-600 focus:outline-none focus:border-emerald-500 transition-colors"
            />
            <p className="text-xs text-zinc-600 font-mono mt-1.5">
              Both users must enter the same code
            </p>
          </div>

          <button
            onClick={handleJoin}
            disabled={!room.trim() || connecting}
            className="w-full mt-2 bg-emerald-500 hover:bg-emerald-400 disabled:bg-zinc-800 disabled:text-zinc-600 text-black font-mono font-bold text-sm rounded-xl py-3.5 transition-all active:scale-95"
          >
            {connecting ? "Connecting…" : "Join Room →"}
          </button>
        </div>

        <p className="text-center text-xs text-zinc-600 font-mono mt-8">
          Peer-to-peer · No server · Your voice only
        </p>
      </div>
    </div>
  );
}
