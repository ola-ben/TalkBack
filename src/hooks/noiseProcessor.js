// Aggressive, talkback-style noise reduction built on the Web Audio API.
//
// Browsers' built-in `noiseSuppression` is mild. This adds a real processing
// chain on top of the raw mic so that steady background noise (fans, AC, hiss,
// room hum) is removed, and — crucially — a NOISE GATE that goes fully silent
// when you're not actually speaking. That silence-when-idle is what makes it
// feel like a real walkie-talkie / talkback unit.
//
// Returns { stream, stop }:
//   stream — the cleaned MediaStream to send to peers
//   stop   — tears down the audio graph and frees the AudioContext
export function createNoiseProcessor(rawStream) {
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  const ctx = new AudioCtx();
  // Resume in case the browser created it suspended (autoplay policy).
  if (ctx.state === "suspended") ctx.resume().catch(() => {});

  const source = ctx.createMediaStreamSource(rawStream);

  // 1. High-pass — remove low-frequency rumble: mains hum, fans, AC, handling.
  const highpass = ctx.createBiquadFilter();
  highpass.type = "highpass";
  highpass.frequency.value = 110;
  highpass.Q.value = 0.7;

  // 2. Low-pass — trim harsh hiss above the human voice band.
  const lowpass = ctx.createBiquadFilter();
  lowpass.type = "lowpass";
  lowpass.frequency.value = 7500;

  // 3. Noise gate — a gain we drive to 0 when the signal is just background.
  const gate = ctx.createGain();
  gate.gain.value = 0; // start closed (silent) until we detect speech

  // 4. Compressor — even out speech so it stays clear and consistent.
  const comp = ctx.createDynamicsCompressor();
  comp.threshold.value = -28;
  comp.knee.value = 18;
  comp.ratio.value = 12;
  comp.attack.value = 0.003;
  comp.release.value = 0.25;

  const dest = ctx.createMediaStreamDestination();

  // Audio path: mic -> highpass -> lowpass -> gate -> compressor -> output
  source.connect(highpass);
  highpass.connect(lowpass);
  lowpass.connect(gate);
  gate.connect(comp);
  comp.connect(dest);

  // Analyser taps the filtered (pre-gate) signal to measure loudness.
  const analyser = ctx.createAnalyser();
  analyser.fftSize = 1024;
  lowpass.connect(analyser);
  const buf = new Float32Array(analyser.fftSize);

  // Gate thresholds with hysteresis so it doesn't chatter on/off.
  const OPEN_RMS = 0.018; // above this = speech -> open
  const CLOSE_RMS = 0.010; // below this = noise -> close
  let open = false;
  let timer = null;

  const tick = () => {
    analyser.getFloatTimeDomainData(buf);
    let sum = 0;
    for (let i = 0; i < buf.length; i++) sum += buf[i] * buf[i];
    const rms = Math.sqrt(sum / buf.length);

    if (!open && rms > OPEN_RMS) open = true;
    else if (open && rms < CLOSE_RMS) open = false;

    // Fast attack (open quickly so first words aren't clipped),
    // slower release (don't chop the tails of words).
    const now = ctx.currentTime;
    gate.gain.setTargetAtTime(open ? 1 : 0, now, open ? 0.008 : 0.06);
  };

  // setInterval (not rAF) so the gate keeps working reliably.
  timer = setInterval(tick, 25);

  function stop() {
    if (timer) clearInterval(timer);
    timer = null;
    try { source.disconnect(); } catch {}
    try { ctx.close(); } catch {}
  }

  return { stream: dest.stream, stop };
}
