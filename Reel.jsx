// Machine V — 9:16 reel. All choreography keyed to authored T; audio baked to the same timeline (reel-data.js).
const RL = window.REEL;
const K = { paper: '#f2f2f3', ink: '#1d1f20', acc: '#5980a6', a100: '#eef6ff', a200: '#d6ebff', a300: '#b5d9fd', a400: '#94bce3', a500: '#749dc4', a700: '#416180', a800: '#2c455d', a900: '#1d2d3d' };
const HF = "'Barlow Condensed', system-ui, sans-serif", BF = "'Barlow', system-ui, sans-serif";
const W = 1080, H = 1920;
const SCENE_OF = { v6: 'Pentastar', v8: 'HEMI', i6: 'B57', m156: 'M156', f140: 'F140', w12: 'W12' };
const PAL = {
  light: { bg: K.paper, ink: K.ink, sub: K.a700, line: K.a300, grid: K.a200, acc: K.acc, fill: K.acc, red: K.ink },
  dark: { bg: K.a900, ink: K.paper, sub: K.a400, line: K.a700, grid: K.a800, acc: K.a500, fill: K.a500, red: K.paper },
};
// The three motion helpers — every tween in the piece goes through one of these.
const M = {
  enter: (T, s, e, a = 0, b = 1) => animate({ from: a, to: b, start: s, end: e, ease: Easing.easeOutCubic })(T),
  draw: (T, s, e, a = 0, b = 1) => animate({ from: a, to: b, start: s, end: e, ease: Easing.easeInOutCubic })(T),
  pop: (T, s, e, a = 0, b = 1) => animate({ from: a, to: b, start: s, end: e, ease: Easing.easeOutBack })(T),
};
const fmt = n => Math.round(n).toLocaleString('en-US');
const abs = (x, y, extra) => Object.assign({ position: 'absolute', left: x, top: y }, extra);

function Corners({ c, s = 22, w = 1.5 }) {
  const pos = [[0, 0], [1, 0], [0, 1], [1, 1]];
  return pos.map(([x, y], i) => (
    <div key={i} style={{ position: 'absolute', left: x ? 'auto' : -s / 2, right: x ? -s / 2 : 'auto', top: y ? 'auto' : -s / 2, bottom: y ? -s / 2 : 'auto', width: s, height: s }}>
      <div style={{ position: 'absolute', left: 0, right: 0, top: s / 2 - w / 2, height: w, background: c }}></div>
      <div style={{ position: 'absolute', top: 0, bottom: 0, left: s / 2 - w / 2, width: w, background: c }}></div>
    </div>
  ));
}
function Frame({ pal, style, children, marks = true }) {
  return (
    <div style={Object.assign({ position: 'absolute', border: `1.5px solid ${pal.line}`, boxSizing: 'border-box' }, style)}>
      {marks && <Corners c={pal.ink} />}
      {children}
    </div>
  );
}
function Grid({ pal, T }) {
  const step = 90, off = (T * 6) % step;
  return (
    <svg width={W} height={H} style={abs(0, 0)}>
      {Array.from({ length: 13 }, (_, i) => <line key={'v' + i} x1={i * step} y1={0} x2={i * step} y2={H} stroke={pal.grid} strokeWidth="1" />)}
      {Array.from({ length: 23 }, (_, i) => <line key={'h' + i} x1={0} y1={i * step - off} x2={W} y2={i * step - off} stroke={pal.grid} strokeWidth="1" />)}
    </svg>
  );
}

function Gauge({ size, e, rpm, prog = 1, pal, labels = true, tickW = 1 }) {
  const c = size / 2, R = size * 0.44;
  const P = (fr, rr) => { const a = (-135 + 270 * fr) * Math.PI / 180; return [c + rr * Math.sin(a), c - rr * Math.cos(a)]; };
  const arc = (f0, f1, rr) => { if (f1 - f0 < 0.0005) return ''; const [x0, y0] = P(f0, rr), [x1, y1] = P(f1, rr); return `M${x0} ${y0} A${rr} ${rr} 0 ${(f1 - f0) * 270 > 180 ? 1 : 0} 1 ${x1} ${y1}`; };
  const f = Math.max(0, Math.min(1.02, rpm / e.tachMax));
  const ticks = [];
  for (let k = 0; k <= e.tachMax; k += 500) {
    const fr = k / e.tachMax; if (fr > prog + 1e-6) break;
    const major = k % 1000 === 0, [x0, y0] = P(fr, R - (major ? 34 : 18) * size / 800), [x1, y1] = P(fr, R);
    ticks.push(<line key={k} x1={x0} y1={y0} x2={x1} y2={y1} stroke={k >= e.limit ? pal.red : pal.ink} strokeWidth={(major ? 4 : 2) * tickW} />);
    if (major && labels) { const [tx, ty] = P(fr, R - 70 * size / 800); ticks.push(<text key={'t' + k} x={tx} y={ty} fill={pal.ink} fontFamily={HF} fontWeight="600" fontSize={size * 0.055} textAnchor="middle" dominantBaseline="central">{k / 1000}</text>); }
  }
  const lim = e.limit / e.tachMax;
  const [nx, ny] = P(Math.min(f, prog), R - 26 * size / 800), [bx, by] = P(Math.min(f, prog), -40 * size / 800);
  return (
    <svg width={size} height={size} style={{ position: 'absolute', left: 0, top: 0, overflow: 'visible' }}>
      <path d={arc(0, prog, R)} stroke={pal.line} strokeWidth="2" fill="none" />
      <path d={arc(lim, Math.max(lim, prog), R - 9 * size / 800)} stroke={pal.red} strokeWidth={14 * size / 800} fill="none" strokeDasharray={`${3 * size / 800} ${5 * size / 800}`} />
      <path d={arc(0, Math.min(f, prog), R + 16 * size / 800)} stroke={pal.acc} strokeWidth={10 * size / 800} fill="none" />
      {ticks}
      {prog > 0.02 && <line x1={bx} y1={by} x2={nx} y2={ny} stroke={pal.ink} strokeWidth={6 * size / 800} strokeLinecap="square" />}
      {prog > 0.02 && <circle cx={c} cy={c} r={20 * size / 800} fill={pal.acc} />}
    </svg>
  );
}

// integrated (slowed) firing phase since segment start — pure function of T
function firePhase(T) {
  const st = RL.state(T), t0 = st.seg.t0; let p = 0;
  for (let t = t0; t < T; t += 1 / 120) { const s = RL.state(t); p += Math.min(42, s.rpm / 60 * s.e.cyl / 2 / 9) * s.fuel / 120; }
  return p;
}
function Cylinders({ e, phase, load, pal, cell = 64 }) {
  const n = e.cyl, lit = c => { const idx = e.fo.indexOf(c); if (phase < idx) return 0; const m = idx + n * Math.floor((phase - idx) / n); return Math.exp(-(phase - m) * 0.5) * (0.35 + 0.65 * load); };
  const gap = e.w ? cell * 0.62 : cell + 14;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: e.w ? 16 : 14 }}>
      {e.banks.map((bank, bi) => (
        <div key={bi} style={{ position: 'relative', height: e.w ? cell * 2.08 : cell, width: (bank.length - 1) * gap + cell }}>
          {bank.map((c, i) => (
            <div key={c} style={{ position: 'absolute', left: i * gap, top: e.w ? (i % 2) * cell * 1.08 : 0, width: cell, height: cell, border: `1.5px solid ${pal.ink}`, boxSizing: 'border-box', background: pal.bg }}>
              <div style={{ position: 'absolute', inset: 4, background: pal.fill, opacity: lit(c) }}></div>
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: HF, fontWeight: 600, fontSize: cell * 0.42, color: lit(c) > 0.5 ? K.paper : pal.ink }}>{c}</div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

function Ignition({ T, CUES, st }) {
  const s0 = CUES.Ignition, end = CUES.Title, pal = PAL.dark, e = RL.E.v6;
  if (T >= end + 0.3) return null;
  const prog = M.draw(T, s0 + 0.15, s0 + 1.5);
  const zoom = M.draw(T, end - 0.35, end + 0.1, 1, 2.8), fade = M.enter(T, end - 0.2, end + 0.1, 1, 0);
  const lbl = T < s0 + 0.6 ? 'KEY ON' : T < s0 + 1.6 ? 'CRANKING' : 'IGNITION';
  const lblIn = T < s0 + 1.6 ? M.enter(T, s0 + 0.15, s0 + 0.45) : M.pop(T, s0 + 1.6, s0 + 1.9, 0.6, 1);
  const shake = T > s0 + 1.6 && T < s0 + 2.1 ? Math.sin(T * 90) * 8 * (1 - (T - s0 - 1.6) / 0.5) : 0;
  const push = M.draw(T, s0, end, 1, 1.05);
  return (
    <div style={abs(0, 0, { width: W, height: H, opacity: fade, transform: `translate(${shake}px,0) scale(${push})` })}>
      <div style={abs(64, 250, { width: W - 128, textAlign: 'center', fontFamily: HF, fontWeight: 600, fontSize: 30, letterSpacing: '0.24em', color: pal.sub, opacity: M.enter(T, s0 + 0.1, s0 + 0.4) })}>ENGINE START SEQUENCE</div>
      <div style={abs(0, 300, { width: W, textAlign: 'center', fontFamily: HF, fontWeight: 600, fontSize: lbl === 'IGNITION' ? 200 : 150, lineHeight: 1, color: pal.ink, letterSpacing: '-0.01em', opacity: Math.min(1, lblIn * 1.4), transform: `scale(${T < s0 + 1.6 ? 1 : lblIn})` })}>{lbl}</div>
      <div style={abs(110, 620, { width: 860, height: 860, transform: `scale(${zoom})`, transformOrigin: '50% 50%' })}>
        <Gauge size={860} e={e} rpm={st.rpm} prog={prog} pal={pal} />
        <div style={abs(0, 600, { width: 860, textAlign: 'center', fontFamily: HF, fontWeight: 600, fontSize: 120, lineHeight: 1, color: pal.ink, fontVariantNumeric: 'tabular-nums', opacity: prog })}>{fmt(st.rpm)}</div>
        <div style={abs(0, 730, { width: 860, textAlign: 'center', fontFamily: HF, fontWeight: 600, fontSize: 30, letterSpacing: '0.3em', color: pal.sub, opacity: prog })}>RPM</div>
      </div>
      <div style={abs(64, 1700, { width: W - 128, textAlign: 'center', fontFamily: BF, fontWeight: 500, fontSize: 34, color: pal.sub, opacity: M.enter(T, s0 + 1.7, s0 + 2.1) })}>Pentastar 3.6 V6 · cold start</div>
    </div>
  );
}

function Title({ T, CUES, st }) {
  const s0 = CUES.Title, end = CUES.Live, pal = PAL.dark;
  if (T < s0 - 0.05 || T >= end) return null;
  const slam = M.pop(T, s0, s0 + 0.28, 0, 1), vIn = M.enter(T, s0, s0 + 0.5);
  const out = M.draw(T, end - 0.7, end, 0, 1);
  const tags = ['6 engines', 'Synthesized sound', 'Moving internals'];
  return (
    <div style={abs(0, 0, { width: W, height: H, transform: `scale(${1 + out * 0.12}) translateY(${-out * 40}px)`, opacity: 1 - M.enter(T, end - 0.15, end) })}>
      <div style={abs(0, 230, { width: W, textAlign: 'center', fontFamily: HF, fontWeight: 600, fontSize: 1180, lineHeight: 1, color: 'transparent', WebkitTextStroke: `3px ${pal.acc}`, opacity: vIn, transform: `scale(${0.8 + 0.2 * vIn + M.draw(T, s0, end, 0, 0.08)})` })}>V</div>
      <div style={abs(0, 640, { width: W, textAlign: 'center', fontFamily: HF, fontWeight: 600, fontSize: 250, lineHeight: 0.9, color: pal.ink, letterSpacing: '-0.01em', opacity: Math.min(1, slam * 2), transform: `scale(${1.6 - 0.6 * slam})` })}>MACHINE V</div>
      <div style={abs(0, 900, { width: W, textAlign: 'center', fontFamily: BF, fontWeight: 500, fontSize: 52, color: pal.ink, opacity: M.enter(T, s0 + 0.55, s0 + 0.95), transform: `translateY(${M.enter(T, s0 + 0.55, s0 + 0.95, 30, 0)}px)` })}>A real-time engine simulator</div>
      <div style={abs(64, 1280, { width: W - 128, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 28 })}>
        {tags.map((tg, i) => {
          const a = M.pop(T, s0 + 1.1 + i * 0.5, s0 + 1.4 + i * 0.5);
          return (
            <div key={tg} style={{ position: 'relative', border: `1.5px solid ${pal.line}`, padding: '18px 44px', fontFamily: HF, fontWeight: 600, fontSize: 52, letterSpacing: '0.08em', textTransform: 'uppercase', color: pal.ink, opacity: Math.min(1, a * 1.5), transform: `scale(${0.7 + 0.3 * a})` }}>
              <Corners c={pal.ink} s={18} />{tg}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ClipVideo({ want, active, playing }) {
  const ref = React.useRef(null);
  const [src, setSrc] = React.useState(null);
  React.useEffect(() => {
    // blob URL so the clip is fully seekable regardless of server range support
    let url; fetch('reel-clip.mp4').then(r => r.blob()).then(b => { url = URL.createObjectURL(b); setSrc(url); }).catch(() => setSrc('reel-clip.mp4'));
    return () => { if (url) URL.revokeObjectURL(url); };
  }, []);
  React.useEffect(() => {
    const v = ref.current; if (!v || !src) return;
    if (playing && active) { if (Math.abs(v.currentTime - want) > 0.2) v.currentTime = want; if (v.paused) v.play().catch(() => {}); }
    else { if (!v.paused) v.pause(); if (Math.abs(v.currentTime - want) > 0.02) v.currentTime = want; }
  }, [want, active, playing, src]);
  return <video ref={ref} src={src || undefined} muted playsInline preload="auto" style={{ display: 'block', width: '100%', height: '100%', objectFit: 'cover' }}></video>;
}

const KB = [['50% 8%', 1, 1.14], ['42% 48%', 1.06, 1.22], ['50% 48%', 1.02, 1.14]];
function Live({ T, CUES, playing }) {
  const s0 = CUES.Live, end = CUES.Pentastar, pal = PAL.dark, rel = T - s0;
  const on = T >= s0 && T < end;
  let si = 0; RL.CLIP.forEach((c, i) => { if (rel >= c.at) si = i; });
  const sh = RL.CLIP[si], want = sh.src + Math.max(0, Math.min(sh.dur, rel - sh.at));
  const inA = M.enter(T, s0, s0 + 0.35), fw = 800, fh = Math.round(fw * 704 / 480);
  const kb = KB[si], zs = M.draw(T, s0 + sh.at, s0 + sh.at + sh.dur, kb[1], kb[2]);
  const capIn = M.enter(T, s0 + sh.at + 0.05, s0 + sh.at + 0.35);
  return (
    <div style={abs(0, 0, { width: W, height: H, visibility: on ? 'visible' : 'hidden', transform: `scale(${M.draw(T, s0, end, 1, 1.03)})` })}>
      <div style={abs(64, 120, { fontFamily: HF, fontWeight: 600, fontSize: 30, letterSpacing: '0.24em', color: pal.sub, opacity: inA })}>LIVE CAPTURE</div>
      <div style={abs(64, 160, { fontFamily: HF, fontWeight: 600, fontSize: 150, lineHeight: 0.95, color: pal.ink, opacity: inA, transform: `translateY(${(1 - inA) * 40}px)` })}>SEE IT RUN.</div>
      <Frame pal={pal} style={{ left: (W - fw) / 2 - 12, top: 340, width: fw + 24, height: fh + 24, transform: `scale(${0.94 + 0.06 * inA})`, opacity: inA }}>
        <div style={abs(12, 12, { width: fw, height: fh, overflow: 'hidden', background: K.paper })}>
          <div style={{ width: '100%', height: '100%', transform: `scale(${zs})`, transformOrigin: kb[0] }}>
            <ClipVideo want={want} active={on} playing={playing} />
          </div>
        </div>
      </Frame>
      <div style={abs(64, 340 + fh + 64, { width: W - 128, display: 'flex', alignItems: 'baseline', gap: 24, opacity: capIn, transform: `translateX(${(1 - capIn) * -30}px)` })}>
        <span style={{ fontFamily: HF, fontWeight: 600, fontSize: 44, color: pal.sub, fontVariantNumeric: 'tabular-nums' }}>0{si + 1}</span>
        <span style={{ fontFamily: HF, fontWeight: 600, fontSize: 64, lineHeight: 1.05, color: pal.ink }}>{sh.cap}</span>
      </div>
      <div style={abs(64, 1830, { width: W - 128, display: 'flex', justifyContent: 'space-between', fontFamily: HF, fontWeight: 600, fontSize: 24, letterSpacing: '0.16em', color: pal.sub })}>
        <span>FIG. L — SCREEN RECORDING</span><span>PENTASTAR 3.6 V6</span>
      </div>
    </div>
  );
}

function EngineCard({ T, CUES, st, pal }) {
  const start = CUES.Pentastar, end = CUES.Lineup;
  if (T < start || T >= end) return null;
  const e = st.e, s0 = CUES[SCENE_OF[e.id]], u = T - s0;
  const nameIn = M.enter(T, s0 + 0.02, s0 + 0.4), metaIn = M.enter(T, s0 + 0.15, s0 + 0.5), prog = M.draw(T, s0, s0 + 0.55);
  const cnt = M.draw(T, s0 + 0.2, s0 + 1.1);
  const lim = st.rpm > e.limit * 0.93 && st.load > 0;
  const jx = lim ? Math.sin(T * 97) * 4 : 0, jy = lim ? Math.cos(T * 83) * 3 : 0;
  const punch = M.enter(T, s0, s0 + 0.3, 1.06, 1) * M.draw(T, s0, s0 + 3, 1, 1.035);
  const phase = firePhase(T), fp = Math.floor(phase) % e.cyl;
  const stats = [['HP', fmt(e.hp * cnt)], ['NM', fmt(e.nm * cnt)], ['REDLINE', fmt(e.limit * cnt)]];
  return (
    <div style={abs(0, 0, { width: W, height: H, transform: `translate(${jx}px,${jy}px) scale(${punch})` })}>
      <div style={abs(64, 72, { width: W - 128, display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', paddingBottom: 20, borderBottom: `1.5px solid ${pal.line}`, fontFamily: HF, fontWeight: 600, fontSize: 30, letterSpacing: '0.18em', color: pal.ink })}>
        <span>MACHINE V</span><span style={{ color: pal.sub }}>{e.no} / 06</span>
      </div>
      <div style={abs(64, 168, { fontFamily: HF, fontWeight: 600, fontSize: 44, letterSpacing: '0.12em', textTransform: 'uppercase', color: pal.sub, opacity: metaIn, transform: `translateX(${(1 - metaIn) * -40}px)` })}>{e.make}</div>
      <div style={abs(56, 220, { height: 270, overflow: 'hidden', width: W - 112 })}>
        <div style={{ fontFamily: HF, fontWeight: 600, fontSize: Math.min(300, (W - 112) / (e.name.length * 0.5)), lineHeight: 0.9, letterSpacing: '-0.02em', color: pal.ink, transform: `translateY(${(1 - nameIn) * 100}%)` }}>{e.name.toUpperCase()}</div>
      </div>
      <div style={abs(64, 500, { fontFamily: BF, fontWeight: 500, fontSize: 46, color: pal.ink, opacity: metaIn })}>{e.spec} <span style={{ color: pal.sub }}>· {e.asp}</span></div>
      <Frame pal={pal} style={{ left: 64, top: 600, width: W - 128, height: 800 }}>
        <div style={abs(96, 10, { width: 760, height: 760 })}>
          <Gauge size={760} e={e} rpm={st.rpm} prog={prog} pal={pal} />
          <div style={abs(0, 520, { width: 760, textAlign: 'center', fontFamily: HF, fontWeight: 600, fontSize: 130, lineHeight: 1, color: pal.ink, fontVariantNumeric: 'tabular-nums' })}>{fmt(st.rpm)}</div>
          <div style={abs(0, 652, { width: 760, textAlign: 'center', fontFamily: HF, fontWeight: 600, fontSize: 28, letterSpacing: '0.3em', color: pal.sub })}>RPM × 1000</div>
        </div>
        <div style={abs(24, 754, { fontFamily: HF, fontWeight: 600, fontSize: 24, letterSpacing: '0.16em', color: pal.sub })}>FIG. {e.no} — TACHOMETER</div>
        <div style={abs(W - 128 - 24, 754, { transform: 'translateX(-100%)', whiteSpace: 'nowrap', fontFamily: HF, fontWeight: 600, fontSize: 24, letterSpacing: '0.16em', color: lim ? pal.ink : pal.sub })}>{lim ? 'LIMITER' : 'LIMIT ' + fmt(e.limit)}</div>
      </Frame>
      <div style={abs(64, 1436, { width: W - 128, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24 })}>
        {stats.map(([k, v], i) => (
          <div key={k} style={{ position: 'relative', height: 176, border: `1.5px solid ${pal.line}`, boxSizing: 'border-box', padding: '18px 24px', opacity: M.enter(T, s0 + 0.12 + i * 0.08, s0 + 0.4 + i * 0.08) }}>
            <Corners c={pal.ink} s={18} />
            <div style={{ fontFamily: HF, fontWeight: 600, fontSize: 26, letterSpacing: '0.2em', color: pal.sub }}>{k}</div>
            <div style={{ fontFamily: HF, fontWeight: 600, fontSize: 96, lineHeight: 1.1, color: pal.ink, fontVariantNumeric: 'tabular-nums' }}>{v}</div>
          </div>
        ))}
      </div>
      <div style={abs(64, 1660, { width: W - 128, height: 196, display: 'flex', justifyContent: 'space-between', alignItems: 'center', opacity: M.enter(T, s0 + 0.25, s0 + 0.6) })}>
        <Cylinders e={e} phase={phase} load={st.load} pal={pal} cell={e.w ? 42 : e.cyl > 8 ? 52 : 60} />
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 10 }}>
          <div style={{ fontFamily: HF, fontWeight: 600, fontSize: 26, letterSpacing: '0.2em', color: pal.sub }}>FIRING ORDER</div>
          <div style={{ display: 'flex', gap: e.cyl > 8 ? 8 : 12, fontFamily: HF, fontWeight: 600, fontSize: e.cyl > 8 ? 34 : 44, fontVariantNumeric: 'tabular-nums' }}>
            {e.fo.map((c, i) => <span key={i} style={{ color: i === fp ? pal.ink : pal.sub, borderBottom: `3px solid ${i === fp ? pal.acc : 'transparent'}`, paddingBottom: 4 }}>{c}</span>)}
          </div>
        </div>
      </div>
    </div>
  );
}

function Lineup({ T, CUES, st, pal }) {
  const s0 = CUES.Lineup, end = CUES.Outro;
  if (T < s0 || T >= end) return null;
  const f = RL.E.f140, n = Math.max(0, Math.min(1.05, (st.rpm - f.idle) / (f.limit - f.idle)));
  const push = M.draw(T, s0, end, 1, 1.04);
  return (
    <div style={abs(0, 0, { width: W, height: H, transform: `scale(${push})` })}>
      <div style={abs(64, 120, { fontFamily: HF, fontWeight: 600, fontSize: 170, lineHeight: 0.92, color: pal.ink, opacity: M.enter(T, s0 + 0.05, s0 + 0.3), transform: `translateY(${M.enter(T, s0 + 0.05, s0 + 0.35, 40, 0)}px)` })}>SIX ENGINES.</div>
      <div style={abs(64, 280, { fontFamily: HF, fontWeight: 600, fontSize: 170, lineHeight: 0.92, color: pal.sub, opacity: M.enter(T, s0 + 0.8, s0 + 1.05), transform: `translateY(${M.enter(T, s0 + 0.8, s0 + 1.1, 40, 0)}px)` })}>ONE SIMULATOR.</div>
      <div style={abs(64, 540, { width: W - 128, display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 32 })}>
        {RL.ORDER.map((id, i) => {
          const e = RL.E[id], a = M.pop(T, s0 + 0.1 + i * 0.1, s0 + 0.4 + i * 0.1), rpm = e.idle + n * (e.limit - e.idle);
          return (
            <div key={id} style={{ position: 'relative', height: 420, border: `1.5px solid ${pal.line}`, boxSizing: 'border-box', opacity: Math.min(1, a * 1.4), transform: `scale(${0.85 + 0.15 * a})` }}>
              <Corners c={pal.ink} s={18} />
              <div style={abs(80, 22, { width: 300, height: 300 })}><Gauge size={300} e={e} rpm={rpm} prog={1} pal={pal} labels={false} tickW={0.7} /></div>
              <div style={abs(24, 316, { fontFamily: HF, fontWeight: 600, fontSize: 56, lineHeight: 1, color: pal.ink })}>{e.name.toUpperCase()}</div>
              <div style={abs(24, 372, { fontFamily: BF, fontWeight: 500, fontSize: 26, color: pal.sub })}>{e.spec}</div>
              <div style={abs(456 - 24, 330, { transform: 'translateX(-100%)', fontFamily: HF, fontWeight: 600, fontSize: 40, color: pal.ink, fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' })}>{fmt(e.hp)}<span style={{ fontSize: 24, color: pal.sub, marginLeft: 6 }}>HP</span></div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Outro({ T, CUES, st }) {
  const s0 = CUES.Outro, end = s0 + 2, pal = PAL.dark;
  if (T < s0) return null;
  const a = M.pop(T, s0, s0 + 0.3), b = M.enter(T, s0 + 0.35, s0 + 0.7), c = M.pop(T, s0 + 0.55, s0 + 0.85);
  const fade = M.enter(T, end - 0.45, end - 0.05, 1, 0);
  const bar = Math.min(1, st.rpm / RL.E.f140.tachMax);
  return (
    <div style={abs(0, 0, { width: W, height: H, opacity: fade })}>
      <div style={abs(0, 640, { width: W, textAlign: 'center', fontFamily: HF, fontWeight: 600, fontSize: 230, lineHeight: 0.9, color: pal.ink, opacity: Math.min(1, a * 2), transform: `scale(${1.4 - 0.4 * a})` })}>MACHINE V</div>
      <div style={abs(0, 880, { width: W, textAlign: 'center', fontFamily: BF, fontWeight: 500, fontSize: 54, color: pal.ink, opacity: b, transform: `translateY(${(1 - b) * 24}px)` })}>Pick an engine. Rev it yourself.</div>
      <div style={abs(W / 2, 1060, { transform: `translateX(-50%) scale(${0.8 + 0.2 * c})`, opacity: Math.min(1, c * 1.5) })}>
        <div style={{ position: 'relative', background: K.acc, padding: '30px 56px', fontFamily: HF, fontWeight: 600, fontSize: 64, letterSpacing: '0.02em', color: K.paper, whiteSpace: 'nowrap' }}>
          <Corners c={K.paper} s={22} />machinev.vercel.app
        </div>
      </div>
      <div style={abs(160, 1560, { width: W - 320, height: 6, background: pal.grid })}>
        <div style={{ width: `${bar * 100}%`, height: '100%', background: pal.acc }}></div>
      </div>
      <div style={abs(160, 1590, { width: W - 320, display: 'flex', justifyContent: 'space-between', fontFamily: HF, fontWeight: 600, fontSize: 28, letterSpacing: '0.2em', color: pal.sub })}>
        <span>F140 · 6.5 L V12</span><span style={{ fontVariantNumeric: 'tabular-nums' }}>{fmt(st.rpm)} RPM</span>
      </div>
    </div>
  );
}

function AudioTrack({ T, playing, sound }) {
  const ref = React.useRef(null);
  const [blocked, setBlocked] = React.useState(false);
  const live = React.useRef({ playing, T });
  live.current = { playing, T };
  React.useEffect(() => {
    const unlock = () => {
      const v = ref.current; if (!v) return;
      if (live.current.playing) { v.currentTime = live.current.T; v.play().then(() => setBlocked(false)).catch(() => {}); }
      else { v.play().then(() => { v.pause(); setBlocked(false); }).catch(() => {}); }
    };
    window.addEventListener('pointerdown', unlock, true); window.addEventListener('keydown', unlock, true);
    return () => { window.removeEventListener('pointerdown', unlock, true); window.removeEventListener('keydown', unlock, true); };
  }, []);
  React.useEffect(() => {
    const v = ref.current; if (!v) return;
    v.muted = !sound;
    if (playing) { if (Math.abs(v.currentTime - T) > 0.25) v.currentTime = T; if (v.paused) v.play().then(() => setBlocked(false)).catch(e => { if (e && e.name === 'NotAllowedError' && sound) setBlocked(true); }); }
    else { if (!v.paused) v.pause(); if (Math.abs(v.currentTime - T) > 0.04) v.currentTime = T; }
  }, [T, playing, sound]);
  return <React.Fragment>
    {blocked && <div style={abs(W / 2, H / 2, { transform: 'translate(-50%,-50%)', background: K.acc, color: K.paper, padding: '40px 72px', fontFamily: HF, fontWeight: 600, fontSize: 72, letterSpacing: '0.06em', whiteSpace: 'nowrap', cursor: 'pointer', zIndex: 10 })}><Corners c={K.paper} s={26} />TAP FOR SOUND</div>}
    <video ref={ref} src="reel-audio.wav" preload="auto" playsInline data-om-exportable-video-play-start="0" data-om-exportable-video-play-end={String(RL.DUR)} style={{ position: 'absolute', left: 0, top: 0, width: 2, height: 2, opacity: 0, pointerEvents: 'none' }}></video>
  </React.Fragment>;
}

function Piece({ tw }) {
  const { T, CUES, playing } = useComposition();
  const st = RL.state(T);
  const light = T >= CUES.Pentastar && T < CUES.Outro;
  const cardPal = tw.ground === 'Steel' ? PAL.dark : PAL.light;
  const pal = light ? cardPal : PAL.dark;
  const cuts = [CUES.Title, CUES.Live, CUES.Live + 2, CUES.Live + 4, CUES.Pentastar, CUES.HEMI, CUES.B57, CUES.M156, CUES.F140, CUES.W12, CUES.Lineup, CUES.Outro];
  let flash = 0; for (const c of cuts) if (T >= c && T < c + 0.3) flash = Math.max(flash, M.enter(T, c, c + 0.28, 0.55, 0));
  return (
    <div data-screen-label={`t=${Math.floor(T)}s`} style={{ position: 'absolute', inset: 0, width: W, height: H, overflow: 'hidden', background: pal.bg, fontFamily: BF }}>
      <Grid pal={pal} T={T} />
      <Ignition T={T} CUES={CUES} st={st} />
      <Title T={T} CUES={CUES} st={st} />
      <Live T={T} CUES={CUES} playing={playing} />
      <EngineCard T={T} CUES={CUES} st={st} pal={cardPal} />
      <Lineup T={T} CUES={CUES} st={st} pal={cardPal} />
      <Outro T={T} CUES={CUES} st={st} />
      <div style={abs(0, 0, { width: W, height: H, background: light ? K.acc : K.paper, opacity: flash * (light ? 0.6 : 0.35), pointerEvents: 'none' })}></div>
      <div style={abs(28, 28, { width: W - 56, height: H - 56, pointerEvents: 'none' })}><Corners c={pal.sub} s={30} w={2} /></div>
      <AudioTrack T={T} playing={playing} sound={tw.sound} />
    </div>
  );
}

function ReelApp() {
  const [tw, setTweak] = useTweaks(window.TWEAK_DEFAULTS);
  return (
    <React.Fragment>
      <CompositionStage width={W} height={H} scenes={window.OM_SCENES} playback={window.OM_PLAYBACK} bg={K.a900}>
        <Piece tw={tw} />
      </CompositionStage>
      <TweaksPanel>
        <TweakSection label="Reel" />
        <TweakToggle label="Motion editor" value={tw.motionEditor} onChange={v => setTweak('motionEditor', v)} />
        <TweakToggle label="Sound in preview" value={tw.sound} onChange={v => setTweak('sound', v)} />
        <TweakRadio label="Engine cards" value={tw.ground} options={['Paper', 'Steel']} onChange={v => setTweak('ground', v)} />
      </TweaksPanel>
    </React.Fragment>
  );
}
window.ReelApp = ReelApp;
