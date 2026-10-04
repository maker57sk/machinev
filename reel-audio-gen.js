// Offline soundtrack generator for Machine V Reel. Run body with (readFile, readFileBinary, saveFile, log) in scope.
const code = await readFile('reel-data.js'); const W = {}; new Function('window', code)(W); const R = W.REEL;
const sr = 44100, DUR = R.DUR, N = Math.floor(DUR * sr), TAU = Math.PI * 2;
const L0 = R.LIVE[0], L1 = R.LIVE[1], D2 = 33, END = 37, ENG_CUTS = [15, 18, 21, 24, 27, 30];
let seed = 12345; const rnd = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
const nz = () => rnd() * 2 - 1;
function svf(fc, q) { let lp = 0, bp = 0; return { lp: 0, bp: 0, hp: 0, f: 2 * Math.sin(Math.PI * Math.min(fc, sr / 6.5) / sr), q,
  set(fc) { this.f = 2 * Math.sin(Math.PI * Math.min(fc, sr / 6.5) / sr); },
  p(x) { lp += this.f * bp; const hp = x - lp - this.q * bp; bp += this.f * hp; this.lp = lp; this.bp = bp; this.hp = hp; return this; } }; }
// ---------- ENGINE ----------
const EL = new Float32Array(N), ER = new Float32Array(N);
let ph = 0, cyl = 0, P = [], K = [], C = [], env = 0, r = 0, l = 0, boost = 0, bov = 0, wob = 0, cur = null, st = null, prevL = 0, twPh = 0, stPh = 0, stPh2 = 0;
const f1 = svf(3000, 0.7), f2 = svf(3000, 0.7), boom = svf(120, 0.5), nbp = svf(1500, 0.8), kbp = svf(3000, 0.6), bovF = svf(4000, 0.9), stF = svf(900, 0.9);
for (let i = 0; i < N; i++) {
  const t = i / sr;
  if (i % 16 === 0) st = R.state(t);
  const e = st.e, S = e.snd, nc = e.cyl;
  if (cur !== st.eng) { r = st.rpm; P = []; cur = st.eng; }
  r += (st.rpm - r) * 0.003; l += (st.load - l) * 0.003;
  const hz = r / 60 * nc / 2, prev = ph;
  wob += TAU * 1.7 / sr;
  const lope = S.lope ? S.lope * Math.max(0, Math.min(1, 1 - (r - 700) / 1200)) : 0;
  ph += hz / sr * (1 + nz() * 0.01 + lope * 0.14 * Math.sin(wob));
  if (Math.floor(ph) !== Math.floor(prev) && hz > 1) {
    const c = cyl = (cyl + 1) % nc, G = S.g[c % S.g.length];
    const len = Math.max(48, Math.min(sr / hz * 0.95, sr * 0.022));
    let a;
    if (st.fuel > 0.5) {
      a = G * (0.3 + 0.7 * l) * (1 + nz() * 0.07);
      if (lope) a *= Math.max(0.2, 1 + lope * ((G - 1) * 5 + nz() * 0.3));
      if (l < 0.05 && r > 1800 && rnd() < 0.06 * S.pops) { a *= 2.2; C.push({ t: 0, len: sr * (0.003 + rnd() * 0.012), a: 0.4 + rnd() * 0.9 }); }
      if (S.knock) K.push({ t: 0, len: sr * 0.004, a: S.knock * (0.9 - 0.5 * l) * G });
    } else a = 0.16 * G;
    P.push({ t: 0, len, a, k: S.k + rnd() * 0.3 });
    env = Math.max(env, a);
  }
  let s = 0;
  for (let k = P.length - 1; k >= 0; k--) { const q = P[k], x = q.t / q.len; const en = x < 0.06 ? x / 0.06 : Math.exp(-(x - 0.06) * 5.5); s += q.a * en * Math.cos(TAU * x * q.k); if (++q.t >= q.len) P.splice(k, 1); }
  env *= 0.9992;
  let y = Math.tanh(s * S.drive * (0.6 + 0.6 * l)) * 0.8;
  const rn = Math.min(1, r / e.limit), fc = S.lp * (0.35 + 0.35 * l + 0.5 * rn);
  f1.set(fc); f2.set(fc); y = f2.p(f1.p(y).lp).lp;
  boom.set(S.body * 1.4); y += boom.p(s).lp * 0.9;
  nbp.set(900 + r * 0.45); let n = nbp.p(nz() * env).bp * S.noise * (0.4 + l);
  if (S.scream) { const g = S.scream * Math.max(0, (r - 3000) / 6000) * (0.35 + 0.65 * l) * 0.32; y += g * (Math.sin(TAU * ph) * 0.8 + Math.sin(TAU * ph * 2) * 0.35 + Math.sin(TAU * ph * 0.5) * 0.25); }
  if (S.turbo) {
    const tgt = (st.load > 0.5 && r > 1400) ? Math.min(1, r / e.limit * 1.25) : 0;
    boost += (tgt - boost) * (tgt > boost ? 0.00006 : 0.0004);
    if (prevL > 0.5 && st.load < 0.3 && boost > 0.35) bov = boost;
    twPh += (1900 + boost * 5600) / sr; y += Math.sin(TAU * twPh) * boost * boost * 0.07 * S.turbo;
    bov *= 0.99985; bovF.set(3200); n += bovF.p(nz()).bp * bov * 0.22 * S.turbo;
  }
  prevL = st.load;
  let kk = 0; for (let j = K.length - 1; j >= 0; j--) { const q = K[j]; kk += q.a * Math.exp(-q.t / q.len * 4) * nz(); if (++q.t >= q.len * 2) K.splice(j, 1); }
  if (kk) { kbp.set(3400); n += kbp.p(kk).bp * 0.5; }
  let cr = 0; for (let j = C.length - 1; j >= 0; j--) { const q = C[j]; cr += q.a * Math.exp(-q.t / q.len * 3) * nz(); if (++q.t >= q.len * 2) C.splice(j, 1); }
  if (st.crank) { stPh += 95 / sr; stPh2 += 1350 / sr; stF.set(1100); y += stF.p(((stPh % 1) * 2 - 1) * 0.5 + Math.sign(Math.sin(TAU * stPh2)) * 0.12).bp * 0.5; }
  EL[i] = y + n + cr * 0.8; ER[i] = y + n * 0.85 + cr * 0.65;
}
for (const sg of R.SEG) {
  if (sg.live) continue;
  const a = Math.floor(sg.t0 * sr), b = Math.min(N, Math.floor(sg.t1 * sr)); let ss = 0, cnt = 0;
  for (let i = a; i < b; i++) { const v = EL[i]; if (Math.abs(v) > 0.003) { ss += v * v; cnt++; } }
  const g = Math.max(0.3, Math.min(3, 0.2 / Math.max(1e-4, Math.sqrt(ss / Math.max(1, cnt)))));
  for (let i = a; i < b; i++) { EL[i] *= g; ER[i] *= g; }
}
// ---------- CLIP AUDIO (real simulator capture) ----------
{
  const ab = await (await readFileBinary('reel-clip.mp4')).arrayBuffer();
  const buf = await new OfflineAudioContext(2, sr, sr).decodeAudioData(ab);
  const c0 = buf.getChannelData(0), c1 = buf.numberOfChannels > 1 ? buf.getChannelData(1) : c0, csr = buf.sampleRate;
  let ss = 0, cnt = 0; for (const sh of R.CLIP) for (let j = Math.floor(sh.src * csr); j < (sh.src + sh.dur) * csr; j++) { ss += c0[j] * c0[j]; cnt++; }
  const g = 0.2 / Math.sqrt(ss / cnt), xf = Math.floor(0.012 * sr);
  for (const sh of R.CLIP) {
    const a = Math.floor((L0 + sh.at) * sr), n = Math.floor(sh.dur * sr) + xf;
    for (let j = 0; j < n && a + j < N; j++) {
      const fi = Math.min(1, j / xf, (n - j) / xf), si = Math.floor((sh.src + j / sr) * csr);
      EL[a + j] += c0[si] * g * fi; ER[a + j] += c1[si] * g * fi;
    }
  }
}
// ---------- MUSIC ----------
const ML = new Float32Array(N), MR = new Float32Array(N), SL = new Float32Array(N);
const at = t => Math.floor(t * sr);
function kick(t0, amp = 1) { let p = 0; for (let j = 0, n = at(0.5); j < n; j++) { const i = at(t0) + j; if (i >= N) break; const x = j / sr; p += (44 + 120 * Math.exp(-x * 32)) / sr; const v = Math.sin(TAU * p) * Math.exp(-x * 6.5) * amp + (j < 90 ? nz() * 0.25 * (1 - j / 90) * amp : 0); ML[i] += v; MR[i] += v; } }
function clap(t0, amp = 0.5) { const f = svf(1800, 0.7); for (let j = 0, n = at(0.25); j < n; j++) { const i = at(t0) + j; if (i >= N) break; const x = j / sr; const e = Math.exp(-x * 22) + (x < 0.02 ? 0.6 * Math.exp(-((x * 1000) % 7) * 0.6) : 0); const v = (f.p(nz()).bp * 1.6 * e + Math.sin(TAU * 190 * x) * Math.exp(-x * 40) * 0.5) * amp; ML[i] += v; MR[i] += v; SL[i] += v * 0.25; } }
function hat(t0, amp = 0.16, pan = 0) { const f = svf(7000, 0.5); for (let j = 0, n = at(0.07); j < n; j++) { const i = at(t0) + j; if (i >= N) break; const x = j / sr; const v = f.p(nz()).hp * Math.exp(-x * 60) * amp; ML[i] += v * (1 - pan); MR[i] += v * (1 + pan); } }
function crash(t0, amp = 0.35, d = 1.8) { const f = svf(5000, 0.6); for (let j = 0, n = at(d); j < n; j++) { const i = at(t0) + j; if (i >= N) break; const x = j / sr; const v = f.p(nz()).hp * Math.exp(-x * 3) * amp; ML[i] += v * (0.9 + nz() * 0.1); MR[i] += v * (0.9 + nz() * 0.1); } }
function sub(t0, amp = 0.7, d = 1.4) { for (let j = 0, n = at(d); j < n; j++) { const i = at(t0) + j; if (i >= N) break; const x = j / sr; const v = Math.sin(TAU * (38 * x + 30 * (1 - Math.exp(-x * 8)) / 8)) * Math.exp(-x * 2.4) * amp; ML[i] += v; MR[i] += v; } }
function riser(t0, t1, amp = 0.25) { const f = svf(300, 0.35); for (let i = at(t0); i < at(t1) && i < N; i++) { const x = (i / sr - t0) / (t1 - t0); f.set(300 + 7000 * x * x); const v = f.p(nz()).bp * amp * x * x; ML[i] += v; MR[i] += v * 0.9; SL[i] += v * 0.3; } }
function whoosh(tc, amp = 0.22) { const f = svf(400, 0.5); const a = tc - 0.3; for (let i = at(a); i < at(tc + 0.25) && i < N; i++) { const t = i / sr; const x = t < tc ? (t - a) / 0.3 : 1 - (t - tc) / 0.25; f.set(400 + 5000 * Math.max(0, x)); const v = f.p(nz()).bp * amp * Math.max(0, x) ** 2; ML[i] += v * (t < tc ? 1.2 : 0.6); MR[i] += v * (t < tc ? 0.6 : 1.2); } }
const chords = [[220, 261.6, 329.6], [174.6, 220, 261.6], [196, 261.6, 329.6], [196, 246.9, 293.7]];
const roots = [55, 43.65, 65.41, 49];
const kicks = [], duck = new Float32Array(N).fill(1);
function addKick(t, a = 1) { kick(t, a); kicks.push(t); }
addKick(1.6, 0.9); sub(1.6, 0.5, 1.6);
for (let t = 0.75; t < 4; t += 0.25) hat(t, 0.05 + 0.05 * (t / 4), (Math.floor(t * 4) % 2) ? 0.4 : -0.4);
riser(2.0, 4.0, 0.3);
for (const T of [4, D2]) { addKick(T, 1.2); crash(T, 0.4, 2); sub(T, 0.75, 1.6); }
crash(END, 0.45, 2.2); addKick(END, 1.2); sub(END, 0.8, 2);
for (let t = 4; t < END; t += 0.5) {
  const bt = Math.round((t - 4) / 0.5) % 4, live = t >= L0 && t < L1;
  if (t !== 4 && t !== D2) addKick(t, live ? 0.8 : 1);
  if (bt === 1 || bt === 3) clap(t, live ? 0.35 : 0.5);
  hat(t + 0.25, 0.14, 0.3);
  if ((t >= 21 && t < 31) || t >= D2) { hat(t + 0.125, 0.06, -0.4); hat(t + 0.375, 0.06, -0.4); }
}
for (const tc of [L0, L0 + 2, L0 + 4, ...ENG_CUTS]) { whoosh(tc); sub(tc, 0.35, 0.6); }
for (let t = 31; t < D2;) { clap(t, 0.18 + 0.25 * (t - 31) / 2); t += (t < 32 ? 0.125 : t < 32.5 ? 0.0625 : 0.03125); }
riser(31, D2, 0.3);
for (const k of kicks) for (let j = 0, n = at(0.45); j < n; j++) { const i = at(k) + j; if (i >= N) break; duck[i] = Math.min(duck[i], 1 - 0.75 * Math.exp(-(j / sr) * 7)); }
{
  const bf = svf(300, 0.5), pf = svf(900, 0.6); let bp = 0, sp = 0; const pp = [0, 0, 0, 0, 0, 0];
  for (let i = 0; i < N; i++) {
    const t = i / sr, bar = Math.floor(t / 2), ci = ((bar % 4) + 4) % 4;
    let bassA = 0, padA = 0, root = roots[ci];
    if (t < 4) { root = 55; bassA = 0.18 * Math.min(1, t / 3); padA = 0.05 * Math.min(1, t / 2.5); }
    else if (t < D2) { const e8 = (t % 0.25) / 0.25; bassA = 0.36 * Math.exp(-e8 * 2.2) * (t >= 31 ? 0.6 : 1); padA = 0.06; }
    else if (t < END) { const e8 = (t % 0.25) / 0.25; bassA = 0.42 * Math.exp(-e8 * 1.8); padA = 0.08; }
    else { root = 55; bassA = 0.3 * Math.exp(-(t - END) * 1.8); padA = 0.09 * Math.exp(-(t - END) * 1.1); }
    const ch = t >= END || t < 4 ? chords[0] : chords[ci];
    bp += root / sr; sp += root / 2 / sr;
    bf.set(t < 4 ? 120 + 200 * t / 4 : 420);
    const b = (bf.p((bp % 1) * 2 - 1).lp * 0.8 + Math.sin(TAU * sp * 2) * 0.6) * bassA * duck[i];
    let pv = 0; for (let v = 0; v < 6; v++) { pp[v] += ch[v % 3] * (v < 3 ? 1.004 : 0.996) / sr; pv += ((pp[v] % 1) * 2 - 1); }
    pf.set(t < 4 ? 300 + 900 * t / 4 : 1300); const pd = pf.p(pv / 6).lp * padA * (0.5 + 0.5 * duck[i]) * 3;
    ML[i] += b + pd; MR[i] += b + pd * 0.9; SL[i] += pd * 0.5;
  }
}
{
  const lf = svf(2800, 0.5); let p = 0;
  for (let i = at(D2); i < at(END); i++) {
    const t = i / sr, s16 = Math.floor((t - D2) / 0.125), ci = Math.floor(t / 2) % 4;
    p += chords[ci][[0, 1, 2, 1, 2, 0, 2, 1][s16 % 8]] * 2 / sr;
    const v = lf.p((p % 1) < 0.5 ? 1 : -1).lp * Math.exp(-((t - D2) % 0.125) * 30) * 0.09;
    ML[i] += v * 0.8; MR[i] += v; SL[i] += v * 0.8;
  }
}
{ const D = Math.floor(0.375 * sr), yL = new Float32Array(N), yR = new Float32Array(N);
  for (let i = 0; i < N; i++) { yL[i] = SL[i] + (i >= D ? 0.42 * yR[i - D] : 0); yR[i] = i >= D ? 0.42 * yL[i - D] : 0; ML[i] += yL[i] * 0.5; MR[i] += yR[i] * 0.5; } }
// ---------- MIX ----------
const OL = new Float32Array(N), OR = new Float32Array(N);
for (let i = 0; i < N; i++) {
  const t = i / sr, live = t >= L0 && t < L1, ld = live ? 0.6 : R.state(t).load;
  const mg = 0.55 * (1 - 0.2 * ld) * (live ? 0.7 : 1);
  OL[i] = EL[i] * 0.95 + ML[i] * mg; OR[i] = ER[i] * 0.95 + MR[i] * mg;
}
const sorted = Float32Array.from(OL.filter((_, i) => i % 7 === 0).map(Math.abs)).sort(), p999 = sorted[Math.floor(sorted.length * 0.999)];
const pre = 0.95 / p999, lim = Math.tanh(1.2);
const out = new ArrayBuffer(44 + N * 4), dv = new DataView(out);
const ws = (o, s) => { for (let k = 0; k < s.length; k++) dv.setUint8(o + k, s.charCodeAt(k)); };
ws(0, 'RIFF'); dv.setUint32(4, 36 + N * 4, true); ws(8, 'WAVE'); ws(12, 'fmt '); dv.setUint32(16, 16, true); dv.setUint16(20, 1, true); dv.setUint16(22, 2, true);
dv.setUint32(24, sr, true); dv.setUint32(28, sr * 4, true); dv.setUint16(32, 4, true); dv.setUint16(34, 16, true); ws(36, 'data'); dv.setUint32(40, N * 4, true);
for (let i = 0; i < N; i++) {
  const fade = Math.min(1, (DUR - i / sr) / 0.4);
  dv.setInt16(44 + i * 4, Math.max(-1, Math.min(1, Math.tanh(OL[i] * pre * 1.2) / lim * 0.97 * fade)) * 32767, true);
  dv.setInt16(46 + i * 4, Math.max(-1, Math.min(1, Math.tanh(OR[i] * pre * 1.2) / lim * 0.97 * fade)) * 32767, true);
}
await saveFile('reel-audio.wav', new Blob([out], { type: 'audio/wav' }));
log('ok', DUR, 's', 'p999', p999.toFixed(3));
