(function (w) {
  const E = {
    v6: { id: 'v6', no: '01', make: 'Dodge Challenger', name: 'Pentastar', spec: '3.6 L V6', asp: 'Naturally aspirated', hp: 305, nm: 363, idle: 760, limit: 6400, tachMax: 7000, cyl: 6,
      fo: [1, 2, 3, 4, 5, 6], banks: [[1, 3, 5], [2, 4, 6]],
      snd: { k: 1.45, lp: 5200, drive: 1.7, noise: 0.22, g: [1, 0.9, 1.07, 0.93, 1.03, 0.87], pops: 0.35, body: 115 } },
    v8: { id: 'v8', no: '02', make: 'Dodge Challenger R/T', name: 'HEMI', spec: '5.7 L V8', asp: 'Naturally aspirated', hp: 375, nm: 542, idle: 640, limit: 5900, tachMax: 7000, cyl: 8,
      fo: [1, 8, 4, 3, 6, 5, 7, 2], banks: [[1, 3, 5, 7], [2, 4, 6, 8]],
      snd: { k: 1.25, lp: 3000, drive: 2.3, noise: 0.25, g: [1.14, 0.8, 0.9, 1.07, 0.84, 1.1, 1.02, 0.76], pops: 0.6, body: 88, lope: 0.6 } },
    i6: { id: 'i6', no: '03', make: 'BMW 530d', name: 'B57', spec: '3.0 L I6 Diesel', asp: 'Turbocharged', hp: 286, nm: 650, idle: 720, limit: 5000, tachMax: 6000, cyl: 6,
      fo: [1, 5, 3, 6, 2, 4], banks: [[1, 2, 3, 4, 5, 6]],
      snd: { k: 1.3, lp: 2400, drive: 1.4, noise: 0.18, g: [1, 0.96, 1.03, 0.97, 1.02, 0.95], pops: 0, body: 78, knock: 0.9, turbo: 0.55 } },
    m156: { id: 'm156', no: '04', make: 'Mercedes-AMG C 63', name: 'M156', spec: '6.2 L V8', asp: 'Naturally aspirated', hp: 457, nm: 600, idle: 680, limit: 7200, tachMax: 8000, cyl: 8,
      fo: [1, 5, 4, 2, 6, 3, 7, 8], banks: [[5, 6, 7, 8], [1, 2, 3, 4]],
      snd: { k: 1.6, lp: 4300, drive: 3.4, noise: 0.35, g: [1.18, 0.78, 0.92, 1.08, 0.82, 1.12, 1.04, 0.74], pops: 1.2, body: 96 } },
    f140: { id: 'f140', no: '05', make: 'Ferrari 812 Superfast', name: 'F140', spec: '6.5 L V12', asp: 'Naturally aspirated', hp: 789, nm: 718, idle: 950, limit: 8900, tachMax: 10000, cyl: 12,
      fo: [1, 7, 5, 11, 3, 9, 6, 12, 2, 8, 4, 10], banks: [[7, 8, 9, 10, 11, 12], [1, 2, 3, 4, 5, 6]],
      snd: { k: 1.9, lp: 9500, drive: 1.9, noise: 0.2, g: [1, 0.97, 1.02, 0.98, 1.01, 0.99, 1, 0.97, 1.02, 0.98, 1.01, 0.99], pops: 0.45, body: 190, scream: 1 } },
    w12: { id: 'w12', no: '06', make: 'Bentley Continental GT', name: 'W12', spec: '6.0 L W12', asp: 'Twin-turbocharged', hp: 626, nm: 900, idle: 600, limit: 6400, tachMax: 7000, cyl: 12,
      fo: [1, 12, 5, 8, 3, 10, 6, 7, 2, 11, 4, 9], banks: [[1, 2, 3, 4, 5, 6], [7, 8, 9, 10, 11, 12]], w: true,
      snd: { k: 1.2, lp: 2300, drive: 1.5, noise: 0.2, g: [1, 0.98, 1.01, 0.99, 1, 0.98, 1.01, 0.99, 1, 0.98, 1.01, 0.99], pops: 0.1, body: 72, turbo: 1 } },
  };
  const ORDER = ['v6', 'v8', 'i6', 'm156', 'f140', 'w12'];
  const BPM = 120;
  // keyframes: [t, rpm, load, flag]  flag: 'L' limiter until next key, 'C' cranking, 'O' off
  const SEG = [];
  function pull(eng, t0, d) {
    const e = E[eng], s = d / 3, L = e.limit, I = e.idle;
    SEG.push({ eng, t0, t1: t0 + d, k: [
      [0, I, 0], [0.12, I, 1], [0.55, I + (L - I) * 0.55, 1], [1.12, L * 0.97, 1], [1.2, L * 0.66, 0.15], [1.28, L * 0.66, 1],
      [1.7, L * 0.86, 1], [2.12, L * 0.985, 1, 'L'], [2.48, L * 0.985, 1], [2.75, L * 0.6, 0], [3.0, L * 0.4, 0],
    ].map(k => [t0 + k[0] * s, k[1], k[2], k[3]]) });
  }
  SEG.push({ eng: 'v6', t0: 0, t1: 8, k: [
    [0, 0, 0, 'O'], [0.6, 0, 0, 'C'], [1.6, 230, 0.6], [1.85, 1650, 0.35], [2.4, 1100, 0.1], [3.0, 790, 0.05], [3.2, 780, 1],
    [3.42, 3600, 0.1], [3.65, 1500, 0], [3.72, 1300, 1], [4.08, 5600, 1], [4.2, 5600, 0], [4.8, 1900, 0], [5.4, 800, 0],
    [5.5, 800, 1], [5.78, 4300, 0], [6.3, 1500, 0], [6.9, 800, 0], [7.0, 800, 1], [7.95, 6200, 1], [8, 6200, 1],
  ] });
  SEG.push({ eng: 'v6', t0: 8, t1: 15, live: true, k: [[8, 0, 0, 'O'], [15, 0, 0, 'O']] });
  ORDER.forEach((id, i) => pull(id, 15 + i * 3, 3));
  pull('f140', 33, 4);
  SEG.push({ eng: 'f140', t0: 37, t1: 39, k: [[0, 3560, 0], [0.5, 1500, 0], [0.9, 950, 0], [1.3, 950, 0], [1.5, 0, 0, 'O'], [2, 0, 0, 'O']].map(k => [37 + k[0], k[1], k[2], k[3]]) });
  // screen-capture excerpts used in the Live section: at = offset into section, src = seconds into reel-clip.mp4
  const CLIP = [
    { at: 0, dur: 2, src: 1.6, cap: 'Free-rev to 8,700 rpm' },
    { at: 2, dur: 2, src: 11.5, cap: 'X-ray view: the crankshaft' },
    { at: 4, dur: 3, src: 19.0, cap: 'Headers glowing under load' },
  ];
  const sm = x => x * x * (3 - 2 * x);
  function state(t) {
    let seg = SEG[SEG.length - 1];
    for (const s of SEG) if (t >= s.t0 && t < s.t1) { seg = s; break; }
    const k = seg.k, e = E[seg.eng];
    let i = 0; while (i < k.length - 2 && t >= k[i + 1][0]) i++;
    const a = k[i], b = k[i + 1], x = Math.max(0, Math.min(1, (t - a[0]) / Math.max(1e-6, b[0] - a[0])));
    let rpm, load, fuel = 1, crank = 0;
    if (a[3] === 'L') { const f = (t * 13) % 1; rpm = a[1] - 320 * f; load = f < 0.45 ? 1 : 0; }
    else if (a[3] === 'C') { rpm = 210 + 25 * Math.sin(t * 40); load = 0; fuel = 0; crank = 1; }
    else if (a[3] === 'O') { rpm = 0; load = 0; fuel = 0; }
    else { rpm = a[1] + (b[1] - a[1]) * sm(x); load = a[2] + (b[2] - a[2]) * x; }
    return { eng: seg.eng, e, rpm: Math.max(0, rpm), load, fuel, crank, seg };
  }
  w.REEL = { E, ORDER, BPM, SEG, state, CLIP, LIVE: [8, 15], DUR: 39 };
})(typeof window !== 'undefined' ? window : globalThis);
