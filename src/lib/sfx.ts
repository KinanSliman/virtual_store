/**
 * Tiny sound-effect synthesizer built on the Web Audio API — no audio
 * files. Everything is generated: footsteps are filtered noise bursts,
 * the door is a slow creak sweep plus a soft latch click.
 *
 * The AudioContext is created lazily on the first call, which must come
 * from a user gesture (the "Open the door" click) so autoplay policies
 * are satisfied.
 */

let ctx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const Ctor =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!Ctor) return null;
    ctx = new Ctor();
  }
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

/** Reusable white-noise buffer (0.5s). */
let noiseBuffer: AudioBuffer | null = null;
function getNoise(ac: AudioContext): AudioBuffer {
  if (!noiseBuffer) {
    noiseBuffer = ac.createBuffer(1, ac.sampleRate * 0.5, ac.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  }
  return noiseBuffer;
}

let stepToggle = false;

/** Short, soft thud — alternates slightly between "left" and "right" foot. */
export function playFootstep(): void {
  const ac = getCtx();
  if (!ac) return;
  const t = ac.currentTime;
  stepToggle = !stepToggle;

  const src = ac.createBufferSource();
  src.buffer = getNoise(ac);

  const filter = ac.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.value = stepToggle ? 340 : 280;
  filter.Q.value = 1.2;

  const gain = ac.createGain();
  gain.gain.setValueAtTime(0.0001, t);
  gain.gain.exponentialRampToValueAtTime(0.35, t + 0.012);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.14);

  src.connect(filter).connect(gain).connect(ac.destination);
  src.start(t, Math.random() * 0.3, 0.16);
}

/** Slow creak (wobbling saw sweep) + latch click, ~1.4s total. */
export function playDoorCreak(): void {
  const ac = getCtx();
  if (!ac) return;
  const t = ac.currentTime;

  // creak body: descending saw with a slow vibrato
  const osc = ac.createOscillator();
  osc.type = "sawtooth";
  osc.frequency.setValueAtTime(180, t);
  osc.frequency.exponentialRampToValueAtTime(70, t + 1.1);

  const vibrato = ac.createOscillator();
  vibrato.frequency.value = 7;
  const vibratoGain = ac.createGain();
  vibratoGain.gain.value = 14;
  vibrato.connect(vibratoGain).connect(osc.frequency);

  const creakFilter = ac.createBiquadFilter();
  creakFilter.type = "bandpass";
  creakFilter.frequency.value = 420;
  creakFilter.Q.value = 6;

  const creakGain = ac.createGain();
  creakGain.gain.setValueAtTime(0.0001, t);
  creakGain.gain.exponentialRampToValueAtTime(0.16, t + 0.15);
  creakGain.gain.setValueAtTime(0.16, t + 0.8);
  creakGain.gain.exponentialRampToValueAtTime(0.0001, t + 1.25);

  osc.connect(creakFilter).connect(creakGain).connect(ac.destination);
  osc.start(t);
  osc.stop(t + 1.3);
  vibrato.start(t);
  vibrato.stop(t + 1.3);

  // latch click at the start
  const click = ac.createBufferSource();
  click.buffer = getNoise(ac);
  const clickFilter = ac.createBiquadFilter();
  clickFilter.type = "highpass";
  clickFilter.frequency.value = 1500;
  const clickGain = ac.createGain();
  clickGain.gain.setValueAtTime(0.12, t);
  clickGain.gain.exponentialRampToValueAtTime(0.0001, t + 0.06);
  click.connect(clickFilter).connect(clickGain).connect(ac.destination);
  click.start(t, 0.1, 0.06);
}
