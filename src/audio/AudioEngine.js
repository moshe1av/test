let ctx = null;
let masterGain = null;
let musicGain = null;
let sfxGain = null;
let noiseBuffer = null;
let musicTimer = null;

function ensureContext() {
  if (!ctx) {
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    masterGain = ctx.createGain();
    masterGain.gain.value = 0.9;
    masterGain.connect(ctx.destination);

    musicGain = ctx.createGain();
    musicGain.gain.value = 0.22;
    musicGain.connect(masterGain);

    sfxGain = ctx.createGain();
    sfxGain.gain.value = 0.85;
    sfxGain.connect(masterGain);

    noiseBuffer = createNoiseBuffer();
  }
  if (ctx.state === "suspended") ctx.resume();
  return ctx;
}

function createNoiseBuffer() {
  const length = ctx.sampleRate * 2;
  const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < length; i++) data[i] = Math.random() * 2 - 1;
  return buffer;
}

function now() {
  return ctx.currentTime;
}

function playTone({ freq = 440, type = "sine", duration = 0.2, gain = 0.3, detune = 0, destination = sfxGain, attack = 0.005, release = 0.08 }) {
  const osc = ctx.createOscillator();
  osc.type = type;
  osc.frequency.value = freq;
  osc.detune.value = detune;
  const g = ctx.createGain();
  g.gain.value = 0;
  osc.connect(g).connect(destination);
  const t = now();
  g.gain.linearRampToValueAtTime(gain, t + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, t + duration + release);
  osc.start(t);
  osc.stop(t + duration + release + 0.02);
}

function playNoiseBurst({ filterType = "bandpass", freq = 2000, q = 1, duration = 0.08, gain = 0.4, destination = sfxGain, attack = 0.002 }) {
  const src = ctx.createBufferSource();
  src.buffer = noiseBuffer;
  src.loop = true;
  const filter = ctx.createBiquadFilter();
  filter.type = filterType;
  filter.frequency.value = freq;
  filter.Q.value = q;
  const g = ctx.createGain();
  g.gain.value = 0;
  src.connect(filter).connect(g).connect(destination);
  const t = now();
  g.gain.linearRampToValueAtTime(gain, t + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, t + duration);
  src.start(t);
  src.stop(t + duration + 0.05);
  return { filter };
}

function startNoiseLoop({ filterType = "lowpass", freq = 1500, q = 0.7, gain = 0.25, destination = sfxGain }) {
  const src = ctx.createBufferSource();
  src.buffer = noiseBuffer;
  src.loop = true;
  const filter = ctx.createBiquadFilter();
  filter.type = filterType;
  filter.frequency.value = freq;
  filter.Q.value = q;
  const g = ctx.createGain();
  g.gain.value = 0;
  src.connect(filter).connect(g).connect(destination);
  src.start();
  g.gain.linearRampToValueAtTime(gain, now() + 0.05);
  return {
    stop(release = 0.15) {
      const t = now();
      g.gain.cancelScheduledValues(t);
      g.gain.setValueAtTime(g.gain.value, t);
      g.gain.linearRampToValueAtTime(0, t + release);
      src.stop(t + release + 0.02);
    },
  };
}

function startToneLoop({ freq = 150, type = "sawtooth", gain = 0.2, destination = sfxGain }) {
  const osc = ctx.createOscillator();
  osc.type = type;
  osc.frequency.value = freq;
  const g = ctx.createGain();
  g.gain.value = 0;
  osc.connect(g).connect(destination);
  osc.start();
  g.gain.linearRampToValueAtTime(gain, now() + 0.05);
  return {
    osc,
    gain: g,
    stop(release = 0.1) {
      const t = now();
      g.gain.cancelScheduledValues(t);
      g.gain.setValueAtTime(g.gain.value, t);
      g.gain.linearRampToValueAtTime(0, t + release);
      osc.stop(t + release + 0.02);
    },
  };
}

export const AudioEngine = {
  init() {
    ensureContext();
  },

  setMuted(muted) {
    if (musicGain) musicGain.gain.value = muted ? 0 : 0.22;
    if (sfxGain) sfxGain.gain.value = muted ? 0 : 0.85;
  },

  startMusic() {
    ensureContext();
    if (musicTimer) return;
    const chords = [
      [261.6, 329.6, 392.0],
      [293.7, 349.2, 440.0],
      [220.0, 277.2, 329.6],
      [246.9, 311.1, 370.0],
    ];
    let step = 0;
    const playStep = () => {
      const chord = chords[step % chords.length];
      for (const freq of chord) {
        playTone({ freq, type: "triangle", duration: 0.35, gain: 0.07, destination: musicGain, attack: 0.02, release: 0.3 });
      }
      playTone({ freq: chord[0] / 2, type: "sine", duration: 0.4, gain: 0.1, destination: musicGain, attack: 0.01, release: 0.25 });
      step++;
    };
    playStep();
    musicTimer = setInterval(playStep, 650);
  },

  stopMusic() {
    if (musicTimer) clearInterval(musicTimer);
    musicTimer = null;
  },

  clippers: (() => {
    let loop = null;
    return {
      start() {
        ensureContext();
        if (loop) return;
        loop = startToneLoop({ freq: 130, type: "square", gain: 0.12 });
      },
      setIntensity(intensity) {
        if (!loop) return;
        const t = now();
        loop.osc.frequency.setTargetAtTime(130 + intensity * 40, t, 0.05);
        loop.gain.gain.setTargetAtTime(0.1 + intensity * 0.18, t, 0.05);
      },
      stop() {
        if (!loop) return;
        loop.stop(0.12);
        loop = null;
      },
    };
  })(),

  scissorsSnip() {
    ensureContext();
    playNoiseBurst({ filterType: "bandpass", freq: 3200, q: 6, duration: 0.05, gain: 0.5 });
    playTone({ freq: 2200, type: "square", duration: 0.03, gain: 0.08 });
  },

  combStroke() {
    ensureContext();
    playNoiseBurst({ filterType: "highpass", freq: 1800, q: 0.8, duration: 0.18, gain: 0.18 });
  },

  razorScrape: (() => {
    let loop = null;
    return {
      start() {
        ensureContext();
        if (loop) return;
        loop = startNoiseLoop({ filterType: "bandpass", freq: 2600, q: 3, gain: 0.22 });
      },
      stop() {
        if (!loop) return;
        loop.stop(0.1);
        loop = null;
      },
    };
  })(),

  dryerAirflow: (() => {
    let loop = null;
    let hum = null;
    return {
      start() {
        ensureContext();
        if (loop) return;
        loop = startNoiseLoop({ filterType: "lowpass", freq: 2200, q: 0.5, gain: 0.22 });
        hum = startToneLoop({ freq: 220, type: "sawtooth", gain: 0.05 });
      },
      stop() {
        if (loop) { loop.stop(0.2); loop = null; }
        if (hum) { hum.stop(0.2); hum = null; }
      },
    };
  })(),

  stylingSizzle() {
    ensureContext();
    playNoiseBurst({ filterType: "bandpass", freq: 3500, q: 2, duration: 0.15, gain: 0.3 });
  },

  waterSpray() {
    ensureContext();
    const burst = playNoiseBurst({ filterType: "highpass", freq: 3000, q: 0.5, duration: 0.09, gain: 0.3 });
    burst.filter.frequency.setTargetAtTime(900, now(), 0.06);
  },

  aerosolSpray: (() => {
    let loop = null;
    return {
      start() {
        ensureContext();
        if (loop) return;
        loop = startNoiseLoop({ filterType: "highpass", freq: 2500, q: 0.4, gain: 0.2 });
      },
      stop() {
        if (!loop) return;
        loop.stop(0.15);
        loop = null;
      },
    };
  })(),

  magicChime() {
    ensureContext();
    [880, 1108, 1318, 1760].forEach((freq, i) => {
      setTimeout(() => {
        playTone({ freq, type: "triangle", duration: 0.25, gain: 0.18, detune: (Math.random() - 0.5) * 15 });
        playTone({ freq: freq * 2, type: "sine", duration: 0.2, gain: 0.06 });
      }, i * 70);
    });
  },

  uiTap() {
    ensureContext();
    playTone({ freq: 520, type: "sine", duration: 0.05, gain: 0.15 });
  },

  finishFanfare() {
    ensureContext();
    [523.3, 659.3, 784.0, 1046.5].forEach((freq, i) => {
      setTimeout(() => playTone({ freq, type: "triangle", duration: 0.3, gain: 0.2 }), i * 110);
    });
  },
};
