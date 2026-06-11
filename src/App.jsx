import React, { useState } from "react";
import JoinScreen from "./components/JoinScreen";
import TalkScreen from "./components/TalkScreen";
import { usePeer } from "./hooks/usePeer";

export default function App() {
  const [myName, setMyName] = useState("You");

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
        <JoinScreen onJoin={handleJoin} connecting={false} />
        {phase === "error" && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-red-900/90 border border-red-500/40 text-red-300 text-xs font-mono px-4 py-2 rounded-xl">
            {errorMsg || "Connection error. Try again."}
          </div>
        )}
      </>
    );
  }

  if (phase === "connecting") {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#0a0a0a]">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm font-mono text-zinc-400">Connecting…</p>
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
    />
  );
}
