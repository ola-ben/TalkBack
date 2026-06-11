import { useState, useRef, useCallback, useEffect } from "react";
import Peer from "peerjs";
import { createNoiseProcessor } from "./noiseProcessor";

export function usePeer() {
  const [phase, setPhase] = useState("idle"); // idle | connecting | waiting | ready | error
  const [peers, setPeers] = useState([]);      // [{ id, name, speaking }]
  const [muted, setMuted] = useState(false);
  const [noiseSuppress, setNoiseSuppress] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [log, setLog] = useState([]);

  const peerRef = useRef(null);
  const myIdRef = useRef(null);
  const roomRef = useRef(null);
  const nameRef = useRef("");
  const dataConns = useRef({});       // peerId → DataConnection
  const activeCalls = useRef({});     // peerId → MediaConnection (outgoing)
  const localStreamRef = useRef(null);   // the (processed) stream we send to peers
  const rawStreamRef = useRef(null);     // the raw mic stream (for mute + cleanup)
  const processorRef = useRef(null);     // active noise-processor { stream, stop }
  const audioRefs = useRef({});       // peerId → HTMLAudioElement
  const isTalkingRef = useRef(false);

  const addLog = useCallback((msg) => {
    setLog((prev) => [...prev.slice(-40), { id: Date.now() + Math.random(), msg }]);
  }, []);

  const updatePeerSpeaking = useCallback((peerId, speaking) => {
    setPeers((prev) =>
      prev.map((p) => (p.id === peerId ? { ...p, speaking } : p))
    );
  }, []);

  const addPeer = useCallback((id, name) => {
    setPeers((prev) => {
      if (prev.find((p) => p.id === id)) return prev;
      return [...prev, { id, name, speaking: false }];
    });
  }, []);

  const removePeer = useCallback((id) => {
    setPeers((prev) => prev.filter((p) => p.id !== id));
    if (audioRefs.current[id]) {
      audioRefs.current[id].srcObject = null;
      delete audioRefs.current[id];
    }
    delete dataConns.current[id];
    delete activeCalls.current[id];
  }, []);

  function playRemoteStream(peerId, stream) {
    let audio = audioRefs.current[peerId];
    if (!audio) {
      audio = new Audio();
      audio.autoplay = true;
      audioRefs.current[peerId] = audio;
    }
    audio.srcObject = stream;
    audio.play().catch(() => {});
  }

  function setupDataConn(conn) {
    const onOpen = () => {
      dataConns.current[conn.peer] = conn;
      const shortName = "Peer " + conn.peer.slice(-4);
      addPeer(conn.peer, shortName);
      addLog(`${shortName} joined`);

      // Tell the other side who we are, so they see our real name too.
      try { conn.send({ type: "name", value: nameRef.current }); } catch {}

      // If we already have a local stream (talking), call this new peer
      if (localStreamRef.current && isTalkingRef.current) {
        const call = peerRef.current.call(conn.peer, localStreamRef.current);
        activeCalls.current[conn.peer] = call;
        call.on("stream", (s) => playRemoteStream(conn.peer, s));
      }
    };

    // The connection may already be open by the time we wire it up (guest side).
    if (conn.open) onOpen();
    else conn.on("open", onOpen);

    conn.on("data", (data) => {
      if (data.type === "speaking") {
        updatePeerSpeaking(conn.peer, data.value);
      }
      if (data.type === "name") {
        setPeers((prev) =>
          prev.map((p) => (p.id === conn.peer ? { ...p, name: data.value } : p))
        );
      }
    });

    conn.on("close", () => {
      addLog("Peer " + conn.peer.slice(-4) + " left");
      removePeer(conn.peer);
    });

    conn.on("error", () => removePeer(conn.peer));
  }

  const initPeer = useCallback((id) => {
    return new Promise((resolve, reject) => {
      const p = new Peer(id, { debug: 0 });
      let opened = false;

      p.on("open", (assignedId) => {
        opened = true;
        peerRef.current = p;
        myIdRef.current = assignedId;

        p.on("connection", (conn) => setupDataConn(conn));

        p.on("call", (call) => {
          // Answer with current stream if available, otherwise with silence
          const answerStream = localStreamRef.current || new MediaStream();
          call.answer(answerStream);
          call.on("stream", (s) => {
            playRemoteStream(call.peer, s);
          });
        });

        p.on("error", (e) => {
          if (e.type !== "peer-unavailable") {
            setPhase("error");
            setErrorMsg(e.message || e.type);
          }
        });

        resolve(assignedId);
      });

      // Before "open", an error means we never connected (e.g. the host ID is
      // already taken). Reject so the caller can fall back to joining as guest.
      p.on("error", (e) => {
        if (!opened) {
          p.destroy();
          reject(e);
        }
      });
    });
  }, []); // eslint-disable-line

  const joinRoom = useCallback(async (roomCode, displayName) => {
    const room = roomCode.toLowerCase().replace(/\s+/g, "");
    roomRef.current = room;
    nameRef.current = displayName;
    const hostId = "tbk-" + room;

    setPhase("connecting");
    setErrorMsg("");

    // 1. Try to claim the room's host ID. The first person in the room wins it
    //    and waits for guests.
    try {
      await initPeer(hostId);
      addLog("No one here yet — you are the host");
      setPhase("waiting");
      return;
    } catch (e) {
      // "unavailable-id" means a host already holds this room — join as guest.
      // Any other error is a real connection problem.
      if (e && e.type && e.type !== "unavailable-id") {
        setPhase("error");
        setErrorMsg("Could not connect. Check your connection.");
        return;
      }
      addLog("Host already here — joining as guest…");
    }

    // 2. Join as guest: get a random ID and connect to the host.
    try {
      await initPeer(undefined);

      const conn = peerRef.current.connect(hostId, { reliable: true });
      const timeout = setTimeout(() => {
        conn.close();
        setPhase("error");
        setErrorMsg("Could not reach the host. Ask them to rejoin.");
      }, 8000);

      conn.on("open", () => {
        clearTimeout(timeout);
        setupDataConn(conn);
        addLog("Joined room as guest");
        setPhase("ready");
      });

      conn.on("error", () => {
        clearTimeout(timeout);
        setPhase("error");
        setErrorMsg("Could not reach the host. Ask them to rejoin.");
      });
    } catch (e2) {
      setPhase("error");
      setErrorMsg("Could not connect. Check your connection.");
    }
  }, [initPeer, addLog]); // eslint-disable-line

  // When phase becomes "waiting" and then another peer connects, move to ready
  useEffect(() => {
    if (phase === "waiting" && peers.length > 0) {
      setPhase("ready");
    }
  }, [phase, peers]);

  // ── TOGGLE TALK (one-tap toggle, not hold) ────────────────────────────────
  const toggleTalk = useCallback(async () => {
    if (isTalkingRef.current) {
      // Stop talking
      isTalkingRef.current = false;
      // Tear down the noise processor first, then the raw mic.
      if (processorRef.current) {
        processorRef.current.stop();
        processorRef.current = null;
      }
      if (rawStreamRef.current) {
        rawStreamRef.current.getTracks().forEach((t) => t.stop());
        rawStreamRef.current = null;
      }
      localStreamRef.current = null;
      // Close all outgoing calls
      Object.values(activeCalls.current).forEach((c) => c.close());
      activeCalls.current = {};
      // Broadcast stop
      Object.values(dataConns.current).forEach((c) => {
        try { c.send({ type: "speaking", value: false }); } catch {}
      });
      return false; // now silent
    } else {
      // Start talking
      try {
        const raw = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,   // browser stage 1
            autoGainControl: true,
            channelCount: 1,
          },
        });
        rawStreamRef.current = raw;

        // Build the cleaned stream. When noise cancellation is on, run the raw
        // mic through the full Web Audio chain (filters + gate + compressor);
        // otherwise send the raw mic as-is.
        let outStream = raw;
        if (noiseSuppress) {
          const proc = createNoiseProcessor(raw);
          processorRef.current = proc;
          outStream = proc.stream;
        }
        localStreamRef.current = outStream;
        isTalkingRef.current = true;

        // Mute acts on the raw input so no signal enters the graph at all.
        if (muted) {
          raw.getAudioTracks().forEach((t) => (t.enabled = false));
        }

        // Call all connected peers with the cleaned stream
        Object.keys(dataConns.current).forEach((peerId) => {
          const call = peerRef.current.call(peerId, outStream);
          activeCalls.current[peerId] = call;
          call.on("stream", (s) => playRemoteStream(peerId, s));
        });

        // Broadcast start
        Object.values(dataConns.current).forEach((c) => {
          try { c.send({ type: "speaking", value: true }); } catch {}
        });

        return true; // now talking
      } catch (e) {
        addLog("Mic error: " + e.message);
        return false;
      }
    }
  }, [muted, noiseSuppress, addLog]);

  // Apply mute/unmute live (acts on the raw mic track) while talking.
  useEffect(() => {
    if (rawStreamRef.current) {
      rawStreamRef.current.getAudioTracks().forEach((t) => (t.enabled = !muted));
    }
  }, [muted]);

  const leaveRoom = useCallback(() => {
    if (processorRef.current) {
      processorRef.current.stop();
      processorRef.current = null;
    }
    if (rawStreamRef.current) {
      rawStreamRef.current.getTracks().forEach((t) => t.stop());
      rawStreamRef.current = null;
    }
    localStreamRef.current = null;
    isTalkingRef.current = false;
    Object.values(activeCalls.current).forEach((c) => c.close());
    activeCalls.current = {};
    if (peerRef.current) {
      peerRef.current.destroy();
      peerRef.current = null;
    }
    dataConns.current = {};
    audioRefs.current = {};
    setPeers([]);
    setPhase("idle");
    setLog([]);
  }, []);

  return {
    phase,
    peers,
    muted,
    setMuted,
    noiseSuppress,
    setNoiseSuppress,
    errorMsg,
    log,
    isTalking: isTalkingRef,
    joinRoom,
    toggleTalk,
    leaveRoom,
    myId: myIdRef,
  };
}
