// Staging for "मौत से बड़ा — Part 1: Bhai Dooj" (Yamraj + Yamuna): every value is a pure function of the frame number.
// FORMAT (decided 2026-11-11 06:49 IST, Sisa title-cards-only): NO subtitles during the story —
// the narration carries it. Only text: the hook as a FULL-SCREEN title card (first 3 s),
// the "मौत से बड़ा · भाग 1" Part badge, and the spoken follow/share CTA (L12).
// QUALITY BAR (littlelafda notes, 2026-11-11): character consistency above all (same Yamuna/Yamraj
// faces/outfits in EVERY shot — the kit's deterministic castdefs guarantee this by construction);
// fully built authentic Indian backgrounds (riverbank, carved temple, home with diyas/rangoli/toran);
// natural daylight + warm golden hour, saturated colour, shallow-DOF feel; role-accurate props;
// mostly static shots with a slow push-in/drift, hard cuts, subtle in-shot movement.
// RE-TIMED to the real Puck voiceover (66.20 s, 1986 f) — timing.py 2026-11-11.
// One cut per line at the gap midpoint; all gaps < 1 s (max 16 f = 0.53 s).
import { clamp, lin, smooth, smoother, easeOut, easeIn, easeInOut, back, spring, lerp, lerp3, add3, catmull, camKeys, kick, blinkAt, idle, q } from "./motion.js";
import { groundAt, chanEnd, floorH, terrainH } from "./terrain.js";
import { YAMUNA, YAMRAJ, BHAI, BEHEN, VIL_A, VIL_B, VIL_C } from "./castdefs.js";

export const FPS = 30, TOTAL = 1986; // RE-TIMED to the real Puck voiceover (66.20 s, timing.py 2026-11-11)

// ---------------- subtitles ----------------
// One subtitle per shot = the shot's spoken line. The hook (first 3 s = 90 frames) shows
// the hook line BIG in the centre; the last 60 frames also show the series end card.
export const LINES = [
  "मौत के देवता को अपने घर कौन बुलाता है? एक बहन ने बुलाया था।",
  "उसका नाम था यमुना — नदी की देवी। और उसका भाई था — यमराज, मौत के देवता।",
  "यमराज इतने व्यस्त रहते थे कि सालों से अपनी बहन से मिलने नहीं आए थे।",
  "यमुना रोज़ नदी किनारे खड़ी होकर इंतज़ार करती थी — भाई, कब आओगे?",
  "एक दिन उसने सन्देश भेजा — भाई, इस दिन मेरे घर आना, मैं तुम्हारा तिलक करूँगी।",
  "और यमराज आ गए। यमुना ने उनका तिलक किया, आरती उतारी, और अपने हाथों से खाना खिलाया।",
  "खाना खाकर यमराज बोले — बहन, माँगो, क्या चाहिए तुम्हें? मैं वरदान दूँगा।",
  "यमुना बोली — भाई, जो बहन इस दिन अपने भाई का तिलक करे, उसे अकाल मृत्यु का डर न रहे।",
  "यमराज मुस्कुराए और बोले — ऐसा ही होगा। आज से जो भाई-बहन इस दिन मिलेंगे, उन्हें मौत का डर नहीं सताएगा।",
  "उसी दिन से भाई दूज मनाया जाने लगा — भाई अपनी बहन के घर जाता है, बहन उसका तिलक करती है।",
  "भाई और बहन का ये रिश्ता, मौत से भी बड़ा है।",
  "अगर आपका भी कोई भाई है, तो ये video उसे भेजिए।",
];
export const HOOK = "मौत के देवता को अपने घर किसने बुलाया?";
export const ENDCARD = "मौत से बड़ा · भाग 1";

// ---------------- world layout (same village as the boy kit) ----------------
const houses = [];
{
  let s = 5;
  const r = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  const rowL = [[-11, 54, 1], [-12.5, 63, 0], [-11.5, 72, 2], [-13, 82, 1], [-12, 92, 0], [-14, 103, 2], [-12, 114, 1], [-25, 60, 0], [-27, 76, 2], [-26, 95, 1]];
  const rowR = [[11, 58, 0], [12.5, 68, 2], [11.5, 79, 1], [13, 89, 0], [12, 100, 2], [14, 111, 1], [25, 66, 1], [27, 84, 0], [26, 104, 2]];
  for (const [x, z, k] of rowL) houses.push([x, z, 5 + r() * 2.5, 4.2 + r() * 1.5, 2.9 + r() * 0.6, Math.PI / 2, k, r() < 0.45]);
  for (const [x, z, k] of rowR) houses.push([x, z, 5 + r() * 2.5, 4.2 + r() * 1.5, 2.9 + r() * 0.6, -Math.PI / 2, k, r() < 0.45]);
}
export const VILLAGE = {
  houses,
  palms: [[-19, 50, 10], [19, 52, 9], [-6, 120, 11], [33, 72, 9.5], [-35, 88, 10.5], [36, 98, 8.5], [-31, 66, 9], [7, 133, 10], [44, 60, 10], [-46, 74, 9]],
  trees: [[-6.5, 47, 2.6, 2.4], [17, 75, 3, 2.8], [-19, 108, 2.8, 2.6], [40, 118, 3.2, 3], [-42, 120, 3, 2.8], [55, 40, 2.6, 2.4], [-60, 45, 2.8, 2.6], [70, -40, 3, 2.8], [-50, -48, 2.8, 2.6]],
  hay: [[-20, 58, 1], [19.5, 63, 0.9], [-21, 86, 1.1], [33, 79, 1], [-33, 104, 0.9]],
  fields: [[85, 85, 70, 55, 1, 0.05], [-90, 90, 75, 60, 0, -0.04], [80, 150, 60, 45, 0, 0.1], [-85, 160, 70, 50, 1, 0], [40, -95, 80, 55, 1, 0.08], [-70, -100, 90, 60, 0, -0.05], [170, -40, 60, 70, 0, 0.1]],
};
export const LANE = [[0.5, 150], [0.3, 110], [0.2, 70], [0.4, 40], [0.5, 27]];
// main.js imports these to build the world; the Bhai Dooj shots do not use them directly.
export const CLINIC = [92, -246, 0.3];
export const ROAD = [[2, 82], [40, 87], [90, 82], [138, 68], [174, 44], [190, 12], [192, -22], [180, -58], [158, -98], [132, -142], [110, -186], [96, -228]];
export const MAPCAM = { pos: [92, 520, 44], look: [92, 0, -80], fov: 50 };
export const SHORT = [[0.4, -22], [6, -70], [26, -130], [56, -190], [86, -236]];

// ---------------- light presets ----------------
const LP = {
  day: { az: 112, el: 50, sun: [1.2, 1.12, 0.97], amb: [0.36, 0.37, 0.46], gnd: [0.32, 0.27, 0.2], top: "#3f80d4", mid: "#8fb7e6", hor: "#c4d8ee", fog: [120, 1300], sat: 1.1, lift: [0.02, 0.025, 0.05], gain: [1, 1, 1], card: [1, 1, 1], cloud: [1, 1, 1], disc: 0 },
  morning: { az: 28, el: 20, sun: [1.38, 1.04, 0.74], amb: [0.34, 0.34, 0.47], gnd: [0.3, 0.24, 0.19], top: "#4f8ad8", mid: "#a6c3e4", hor: "#f0dcbc", fog: [110, 1200], sat: 1.12, lift: [0.025, 0.02, 0.05], gain: [1.02, 1, 0.97], card: [1.03, 0.98, 0.93], cloud: [1, 0.93, 0.86], disc: 0.003 },
  golden: { az: 168, el: 10, sun: [1.62, 0.98, 0.52], amb: [0.31, 0.28, 0.48], gnd: [0.27, 0.21, 0.19], top: "#6d7cc4", mid: "#e6a98e", hor: "#ffcf8e", fog: [90, 1100], sat: 1.14, lift: [0.03, 0.02, 0.06], gain: [1.04, 0.99, 0.94], card: [1.06, 0.94, 0.82], cloud: [1, 0.84, 0.72], disc: 0.004 },
  court: { az: 140, el: 38, sun: [0.85, 0.8, 0.95], amb: [0.3, 0.3, 0.44], gnd: [0.24, 0.22, 0.26], top: "#5a6ea8", mid: "#8a94b8", hor: "#b8a888", fog: [100, 1100], sat: 1.05, lift: [0.02, 0.02, 0.05], gain: [1, 0.98, 1.02], card: [0.98, 0.97, 1], cloud: [0.9, 0.88, 0.95], disc: 0 },
};
const hexMix = (a, b, t) => { const A = parseInt(a.slice(1), 16), B = parseInt(b.slice(1), 16); const ch = (s) => Math.round(((A >> s) & 255) * (1 - t) + ((B >> s) & 255) * t).toString(16).padStart(2, "0"); return `#${ch(16)}${ch(8)}${ch(0)}`; };
const blendL = (a, b, t) => {
  const o = {};
  for (const k of Object.keys(a)) {
    const x = a[k], y = b[k];
    o[k] = typeof x === "string" ? hexMix(x, y, t) : Array.isArray(x) ? x.map((v, i) => lerp(v, y[i], t)) : lerp(x, y, t);
  }
  let d = b.az - a.az; if (d > 180) d -= 360; if (d < -180) d += 360; o.az = a.az + d * t;
  return o;
};
const lightSeq = (seq, f) => {
  if (f <= seq[0][0]) return LP[seq[0][1]];
  for (let i = 0; i < seq.length - 1; i++) if (f <= seq[i + 1][0]) return blendL(LP[seq[i][1]], LP[seq[i + 1][1]], smooth(lin(seq[i][0], seq[i + 1][0], f)));
  return LP[seq[seq.length - 1][1]];
};

// ---------------- helpers ----------------
const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const norm = (a) => { const l = Math.hypot(...a) || 1; return a.map((v) => v / l); };
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const dist = (a, b) => Math.hypot(...sub(a, b));
const camRight = (c) => norm(cross(sub(c.look, c.pos), [0, 1, 0]));
const camUp = (c) => norm(cross(camRight(c), sub(c.look, c.pos)));
const lightAng = (c, L, mirror = 1) => {
  const d = [Math.cos(L.el * Math.PI / 180) * Math.cos(L.az * Math.PI / 180), Math.sin(L.el * Math.PI / 180), Math.cos(L.el * Math.PI / 180) * Math.sin(L.az * Math.PI / 180)];
  const r = camRight(c), u = camUp(c);
  const sx = (d[0] * r[0] + d[1] * r[1] + d[2] * r[2]) * mirror, sy = d[0] * u[0] + d[1] * u[1] + d[2] * u[2];
  return q(Math.atan2(-Math.max(0.25, sy), sx), 0.35);
};
const mirrorOf = (c, dir) => { const r = camRight(c); return dir[0] * r[0] + dir[1] * r[2] < 0 ? -1 : 1; };
const ext = (f, a, b) => f >= a && f < b;
const ht = (x, z, p) => groundAt(x, z, p);
let CAMNOW = null;
const pullTo = (p, d = 0.9) => { if (!CAMNOW) return p; const v = sub(CAMNOW.pos, p), l = Math.hypot(...v) || 1; return add3(p, v.map((x) => (x * Math.min(d, l * 0.5)) / l)); };
const walkPhase = (d) => q(d / 1.25, 1 / 24);

// ---------------- shots ----------------
// "मौत से बड़ा — Part 1: Bhai Dooj" — 12 shots / 12 lines / TOTAL 1986f (RE-TIMED 2026-11-11).
// Camera languages (at least 5): huge close-up (1), orbit reveal (2), low-angle court (3),
// slow push-in (4), tracking (5), three-quarter tilak (6), low-angle boon (7),
// close-up orbit (8), wide blessing (9), high-angle wide + crane (10),
// golden pull-back (11), direct-to-camera CTA (12).
// STAGING RULES (from the boy kit): portrait 9:16 => horizontal fov ~23deg; stage two-shots
// along DEPTH; keep actors + cameras in the open lane (|x| <= 4); never stage against a house wall.
// LOCATIONS: riverbank + ghat (z ~130, water z 132-148, temple at (-6, 126)); Yamraj's court
// = the palace hall (throne z 102, hall z 85-105); home courtyard (z 86-92, tilak/aarti);
// festival lane = market (z 44-56).
const SHOTS = [];
const shot = (id, a, b, fn) => SHOTS.push({ id, a, b, fn });

const thought = (fx, id, f, fi, head, size = 0.7) => {
  if (f >= fi && f < fi + 12) fx.push({ id, kind: "burst", pos: pullTo(head), size, t: q((f - fi + 1) / 12, 0.08), col: "#ffe98a" });
};
const head3 = (A, h = 1.6) => [A[0], A[1] + h, A[2]];
const fgPot = (fx, cam, side, dist, size = 0.32) => {
  const fwd = norm(sub(cam.look, cam.pos)), r = camRight(cam);
  const px = cam.pos[0] + fwd[0] * dist + r[0] * side;
  const pz = cam.pos[2] + fwd[2] * dist + r[2] * side;
  fx.push({ id: "fgpot", kind: "pot", pos: [px, ht(px, pz, 0) + 0.43 * size, pz], size, rot: 0.2, alpha: 0.95 });
};
const dustAt = (fx, f, i, x, y, z) => {
  fx.push({ id: "dust" + i, kind: "glow", pos: [x + 0.12 * Math.sin(f * 0.05 + i * 2.1), y + 0.06 * Math.sin(f * 0.03 + i * 1.7), z], size: 0.07, alpha: 0.25 });
};
const birdsAt = (fx, f, a, b, n = 3, y0 = 30, z0 = 70) => {
  const t = (f - a) / (b - a);
  for (let i = 0; i < n; i++) fx.push({ id: "bird" + i, kind: "bird", pos: [-40 + t * 80 + i * 4, y0 + i * 2.5 + Math.sin(t * 6 + i) * 1.5, z0 - i * 3], size: 1.6, t: q(((f * 0.09 + i * 0.33) % 1), 0.125) });
};
/** a diya (clay lamp) glow above a floating diya on the river — caller passes the water pos */
const diyaGlow = (fx, id, f, x, z, y = 0.25) => {
  fx.push({ id, kind: "glow", pos: [x, y, z], size: 0.16, alpha: 0.55 + 0.15 * Math.sin(f * 0.2) });
};

// 1 HOOK (L01): HUGE close-up — Yamuna's face fills the frame, river + golden sunset behind her.
//    Hook text shows big in the centre for the first 90 frames (the subtitle system draws it).
shot("hook", 0, 144, (f) => {
  const p = 0;
  const A = [0.2, ht(0.2, 130, p), 130];
  const cam = camKeys([
    { f: 0, pos: [0.2, 1.35, 133.4], look: [0.2, 1.25, 130.0], fov: 30 },
    { f: 144, pos: [0.1, 1.3, 132.8], look: [0.2, 1.28, 130.0], fov: 28, ease: (t) => smooth(t) },
  ], f);
  CAMNOW = cam;
  const L = LP.golden, mir = mirrorOf(cam, [0, -1]);
  const idY = idle(f, 5);
  const actors = [
    { id: "yamuna", kind: "front", outfit: YAMUNA, pos: [A[0], A[2]], opts: { expr: f >= 45 ? "shock" : "neutral", armR: f >= 45 ? "chin" : "hang", blink: blinkAt(f, 5), seed: 5, light: lightAng(cam, L, mir), tilt: q(idY.tilt, 0.5), look: q(lerp(0, -0.3, smooth(lin(45, 70, f))), 0.1) } },
  ];
  const fx = [];
  diyaGlow(fx, "dg1", f, -2.2, 134.5);
  diyaGlow(fx, "dg2", f, 2.4, 135.5);
  dustAt(fx, f, 0, 0.4, 1.7, 131.0); dustAt(fx, f, 1, -0.3, 1.9, 131.5); dustAt(fx, f, 2, 0.1, 1.5, 132.0);
  birdsAt(fx, f, 0, 144, 2, 34, 120);
  return { cam, L, actors, fx, p, kicks: [{ f: 45, a: 0.014 }], dof: { focus: dist(cam.pos, add3(A, [0, 1.1, 0])), cInf: 9 }, shadow: { c: A, r: 12 } };
});

// 2 INTRO (L02): SLOW DRIFT REVEAL — camera drifts gently from Yamuna at the ghat to reveal Yamraj
//    standing at the temple steps 2.5 m behind her, dark robes against golden light.
shot("intro", 144, 322, (f) => {
  const p = 0;
  const Y = [0.2, ht(0.2, 130, p), 130];
  const R = [-0.4, ht(-0.4, 127.5, p), 127.5];
  const cam = camKeys([
    { f: 144, pos: [1.2, 1.6, 133.8], look: [0.2, 1.2, 130.0], fov: 38 },
    { f: 322, pos: [-1.0, 1.6, 134.5], look: [-0.1, 1.3, 128.5], fov: 38, ease: (t) => smooth(t) },
  ], f);
  CAMNOW = cam;
  const L = LP.golden, mir = mirrorOf(cam, [0, -1]);
  const actors = [
    { id: "yamuna", kind: "front", outfit: YAMUNA, pos: [Y[0], Y[2]], opts: { expr: "smile", armR: "belly", blink: blinkAt(f, 5), seed: 5, light: lightAng(cam, L, mir), tilt: q(idle(f, 5).tilt, 0.5) } },
    { id: "yamraj", kind: "front", outfit: YAMRAJ, pos: [R[0], R[2]], opts: { expr: "stern", armL: "hip", armR: "hang", blink: blinkAt(f, 7), seed: 7, light: -2.2, tilt: q(idle(f, 7).tilt, 0.5) } },
  ];
  const fx = [];
  diyaGlow(fx, "dg1", f, -2.2, 134.5);
  diyaGlow(fx, "dg2", f, 2.4, 135.5);
  thought(fx, "th2", f, 275, head3(R, 2.2), 0.5);
  birdsAt(fx, f, 144, 322, 2, 34, 120);
  return { cam, L, actors, fx, p, kicks: [{ f: 275, a: 0.01 }], dof: { focus: dist(cam.pos, add3(R, [0, 1.4, 0])), cInf: 9 }, shadow: { c: [0, 0, 129], r: 12 } };
});

// 3 BUSY (L03): LOW-ANGLE COURT — inside the palace hall, Yamraj near the throne gestures
//    while two attendants wait 2.5 m behind him. He is busy — years pass without a visit.
shot("busy", 322, 453, (f) => {
  const p = 0;
  const R = [0.4, ht(0.4, 99.5, p), 99.5];
  const A1 = [-1.4, ht(-1.4, 101.5, p), 101.5];
  const A2 = [1.6, ht(1.6, 101.5, p), 101.5];
  const cam = camKeys([
    { f: 322, pos: [0.2, 0.85, 90.5], look: [0.2, 1.6, 99.5], fov: 38 },
    { f: 453, pos: [0.1, 0.8, 91.0], look: [0.2, 1.65, 99.5], fov: 37, ease: (t) => smooth(t) },
  ], f);
  CAMNOW = cam;
  const L = LP.court, mir = mirrorOf(cam, [0, -1]);
  const busy = f >= 380;
  const actors = [
    { id: "yamraj", kind: "front", outfit: YAMRAJ, pos: [R[0], R[2]], opts: { expr: busy ? "stern" : "neutral", armR: busy ? "point" : "hang", armL: "hip", blink: blinkAt(f, 7), seed: 7, light: -2.2, tilt: q(busy ? 2 * Math.sin(f * 0.1) : idle(f, 7).tilt, 0.5) } },
    { id: "vil_a", kind: "front", outfit: VIL_A, pos: [A1[0], A1[2]], opts: { expr: "neutral", armL: "hang", armR: "hang", blink: blinkAt(f, 17), seed: 17, light: -2.2, tilt: q(idle(f, 17).tilt, 0.5) } },
    { id: "vil_c", kind: "front", outfit: VIL_C, pos: [A2[0], A2[2]], opts: { expr: "neutral", armL: "hang", armR: "hang", blink: blinkAt(f, 19), seed: 19, light: -2.2, tilt: q(idle(f, 19).tilt, 0.5) } },
  ];
  const fx = [];
  dustAt(fx, f, 0, 0.0, 1.8, 96.0); dustAt(fx, f, 1, 1.0, 2.2, 97.0); dustAt(fx, f, 2, -1.0, 1.6, 95.0);
  return { cam, L, actors, fx, p, kicks: [{ f: 380, a: 0.01 }], dof: { focus: dist(cam.pos, add3(R, [0, 1.4, 0])), cInf: 9 }, shadow: { c: [0.2, 0, 100], r: 12 } };
});

// 4 WAITING (L04): SLOW PUSH-IN — Yamuna stands at the ghat every day, looking at the horizon,
//    a diya floats past on the river. Warm morning light, birds, river shimmer.
shot("waiting", 453, 604, (f) => {
  const p = 0;
  const Y = [0.0, ht(0.0, 130, p), 130];
  const cam = camKeys([
    { f: 453, pos: [0.0, 1.6, 126.5], look: [0.0, 1.25, 130.0], fov: 38 },
    { f: 604, pos: [0.0, 1.55, 127.2], look: [0.0, 1.28, 130.0], fov: 36, ease: (t) => smooth(t) },
  ], f);
  CAMNOW = cam;
  const L = LP.morning, mir = mirrorOf(cam, [0, -1]);
  const call = f >= 565;
  const actors = [
    { id: "yamuna", kind: "front", outfit: YAMUNA, pos: [Y[0], Y[2]], opts: { expr: call ? "shock" : "neutral", armR: call ? "up" : "hang", blink: blinkAt(f, 5), seed: 5, light: lightAng(cam, L, mir), tilt: q(idle(f, 5).tilt, 0.5), look: q(call ? 0.3 : 0, 0.1) } },
  ];
  const fx = [];
  diyaGlow(fx, "dg1", f, -2.2, 134.5);
  diyaGlow(fx, "dg2", f, 2.4, 135.5);
  diyaGlow(fx, "dg3", f, 0.5 + 0.008 * (f - 453), 136.0); // a diya drifting on the river
  dustAt(fx, f, 0, 0.3, 1.6, 131.0); dustAt(fx, f, 1, -0.4, 1.8, 131.5);
  birdsAt(fx, f, 453, 604, 3, 34, 120);
  return { cam, L, actors, fx, p, kicks: [{ f: 565, a: 0.01 }], dof: { focus: dist(cam.pos, add3(Y, [0, 1.1, 0])), cInf: 9 }, shadow: { c: Y, r: 12 } };
});

// 5 MESSAGE (L05): TRACKING — Yamuna walks to the water's edge and releases a diya;
//    a white bird flies across the sky carrying the message.
shot("message", 604, 763, (f) => {
  const p = 0;
  const zw = lerp(129.0, 130.8, smooth(lin(604, 664, f)));
  const Y = [0.0, ht(0.0, zw, p), zw];
  const cam = camKeys([
    { f: 604, pos: [1.8, 1.6, 127.0], look: [0.0, 1.2, 130.0], fov: 38 },
    { f: 763, pos: [0.6, 1.5, 127.8], look: [0.0, 1.2, 130.5], fov: 37, ease: (t) => smooth(t) },
  ], f);
  CAMNOW = cam;
  const L = LP.morning, mir = mirrorOf(cam, [0, -1]);
  const release = f >= 660;
  const actors = [];
  if (!release) {
    actors.push({ id: "yamuna", kind: "side", wide: true, outfit: YAMUNA, pos: [Y[0], Y[2]], dir: [0, 1], opts: { mode: "walk", phase: walkPhase(129.0 - zw), expr: "smile", blink: blinkAt(f, 5), seed: 5, light: lightAng(cam, L, mir), lean0: 3 } });
  } else {
    actors.push({ id: "yamuna", kind: "front", outfit: YAMUNA, pos: [Y[0], Y[2]], opts: { expr: "smile", armR: "point", blink: blinkAt(f, 5), seed: 5, light: lightAng(cam, L, mir), tilt: q(3, 0.5) } });
  }
  const fx = [];
  diyaGlow(fx, "dg1", f, -2.2, 134.5);
  diyaGlow(fx, "dg2", f, 2.4, 135.5);
  const dx = release ? 0.5 + 0.012 * (f - 660) : 0.5;
  diyaGlow(fx, "dg3", f, dx, 136.0);
  thought(fx, "th5", f, 660, head3(Y, 1.9), 0.45);
  birdsAt(fx, f, 604, 763, 3, 34, 120);
  return { cam, L, actors, fx, p, kicks: [{ f: 660, a: 0.01 }], dof: { focus: dist(cam.pos, add3(Y, [0, 1.1, 0])), cInf: 9 }, shadow: { c: Y, r: 12 } };
});

// 6 TILAK (L06): THREE-QUARTER — home courtyard. Yamraj stands in front, Yamuna in profile
//    beside him applies the tilak; aarti thali and rangoli between them, marigold overhead.
shot("tilak", 763, 961, (f) => {
  const p = 0;
  const R = [0.5, ht(0.5, 88.8, p), 88.8];
  const Y = [-0.6, ht(-0.6, 90.6, p), 90.6];
  const cam = camKeys([
    { f: 763, pos: [0.2, 1.6, 94.8], look: [0.1, 1.35, 89.2], fov: 38 },
    { f: 961, pos: [0.1, 1.55, 94.2], look: [0.1, 1.35, 89.2], fov: 37, ease: (t) => smooth(t) },
  ], f);
  CAMNOW = cam;
  const L = LP.day, mir = mirrorOf(cam, [0, -1]);
  const tilak = f >= 820;
  const actors = [
    { id: "yamraj", kind: "front", outfit: YAMRAJ, pos: [R[0], R[2]], opts: { expr: tilak ? "smile" : "neutral", armL: "hang", armR: "hang", blink: blinkAt(f, 7), seed: 7, light: -2.2, tilt: q(tilak ? 2 : idle(f, 7).tilt, 0.5) } },
    { id: "yamuna", kind: "side", wide: true, outfit: YAMUNA, pos: [Y[0], Y[2]], dir: [1, 0], opts: { mode: "stand", expr: tilak ? "smile" : "neutral", armR: tilak ? "point" : "hang", blink: blinkAt(f, 5), seed: 5, light: lightAng(cam, L, mir), lean0: 4, look: 0.6 } },
  ];
  const fx = [];
  thought(fx, "th6", f, 820, head3(R, 2.2), 0.55);
  diyaGlow(fx, "dg6a", f, 0.0, 89.6, 1.0);
  dustAt(fx, f, 0, 0.0, 1.6, 89.5); dustAt(fx, f, 1, 0.8, 1.8, 89.0); dustAt(fx, f, 2, -0.5, 1.5, 90.0);
  birdsAt(fx, f, 763, 961, 2, 32, 80);
  return { cam, L, actors, fx, p, kicks: [{ f: 820, a: 0.012 }], dof: { focus: dist(cam.pos, add3(R, [0, 1.4, 0])), cInf: 9 }, shadow: { c: [0.1, 0, 89.5], r: 12 } };
});

// 7 BOON (L07): LOW-ANGLE — Yamraj after the meal, warm and generous, gestures "ask";
//    Yamuna kneels/folds hands 2.5 m in front of him (depth staging), golden light.
shot("boon", 961, 1125, (f) => {
  const p = 0;
  const R = [0.4, ht(0.4, 88.8, p), 88.8];
  const Y = [-0.3, ht(-0.3, 91.2, p), 91.2];
  const cam = camKeys([
    { f: 961, pos: [0.0, 0.85, 94.5], look: [0.0, 1.6, 89.0], fov: 38 },
    { f: 1125, pos: [0.0, 0.8, 94.0], look: [0.0, 1.65, 89.0], fov: 37, ease: (t) => smooth(t) },
  ], f);
  CAMNOW = cam;
  const L = blendL(LP.day, LP.golden, 0.4), mir = mirrorOf(cam, [0, -1]);
  const ask = f >= 1040;
  const actors = [
    { id: "yamraj", kind: "front", outfit: YAMRAJ, pos: [R[0], R[2]], opts: { expr: ask ? "grin" : "smile", armR: ask ? "point" : "hang", armL: "hip", blink: blinkAt(f, 7), seed: 7, light: -2.2, tilt: q(ask ? 2 : idle(f, 7).tilt, 0.5) } },
    { id: "yamuna", kind: "front", outfit: YAMUNA, pos: [Y[0], Y[2]], opts: { expr: "smile", armL: "belly", armR: "belly", blink: blinkAt(f, 5), seed: 5, light: lightAng(cam, L, mir), tilt: q(idle(f, 5).tilt, 0.5) } },
  ];
  const fx = [];
  thought(fx, "th7", f, 1040, head3(R, 2.2), 0.5);
  diyaGlow(fx, "dg7a", f, 0.0, 89.6, 1.0);
  diyaGlow(fx, "dg7b", f, -1.5, 90.5, 1.0);
  dustAt(fx, f, 0, 0.2, 1.7, 90.0); dustAt(fx, f, 1, -0.4, 1.9, 89.5);
  return { cam, L, actors, fx, p, kicks: [{ f: 1040, a: 0.01 }], dof: { focus: dist(cam.pos, add3(R, [0, 1.4, 0])), cInf: 9 }, shadow: { c: [0.1, 0, 90], r: 12 } };
});

// 8 WISH (L08): CLOSE-UP ORBIT — Yamuna, hands folded, speaks her wish; camera swings slightly
//    to Yamraj listening behind her. The emotional core of the story.
shot("wish", 1125, 1322, (f) => {
  const p = 0;
  const Y = [0.0, ht(0.0, 90.6, p), 90.6];
  const R = [0.5, ht(0.5, 88.4, p), 88.4];
  const cam = camKeys([
    { f: 1125, pos: [0.0, 1.55, 94.8], look: [0.0, 1.25, 90.4], fov: 36 },
    { f: 1322, pos: [1.6, 1.5, 93.5], look: [-0.1, 1.25, 90.0], fov: 35, ease: (t) => smooth(t) },
  ], f);
  CAMNOW = cam;
  const L = blendL(LP.day, LP.golden, 0.5), mir = mirrorOf(cam, [0, -1]);
  const wish = f >= 1180;
  const actors = [
    { id: "yamuna", kind: "front", outfit: YAMUNA, pos: [Y[0], Y[2]], opts: { expr: wish ? "smile" : "neutral", armL: "belly", armR: "belly", blink: blinkAt(f, 5), seed: 5, light: lightAng(cam, L, mir), tilt: q(idle(f, 5).tilt, 0.5), headTilt: q(wish ? -2 : 0, 1) } },
    { id: "yamraj", kind: "front", outfit: YAMRAJ, pos: [R[0], R[2]], opts: { expr: "smile", armL: "hip", armR: "hang", blink: blinkAt(f, 7), seed: 7, light: -2.2, tilt: q(idle(f, 7).tilt, 0.5) } },
  ];
  const fx = [];
  thought(fx, "th8", f, 1180, head3(Y, 1.8), 0.5);
  diyaGlow(fx, "dg8a", f, 0.0, 89.6, 1.0);
  dustAt(fx, f, 0, 0.2, 1.6, 90.0); dustAt(fx, f, 1, -0.4, 1.8, 89.5);
  return { cam, L, actors, fx, p, kicks: [{ f: 1180, a: 0.01 }], dof: { focus: dist(cam.pos, add3(Y, [0, 1.2, 0])), cInf: 9 }, shadow: { c: [0.1, 0, 90], r: 12 } };
});

// 9 BLESSING (L09): WIDE — Yamraj raises his hand in blessing; a golden burst blooms above
//    them both, diyas brighten, warm golden light floods the courtyard.
shot("blessing", 1322, 1556, (f) => {
  const p = 0;
  const R = [0.4, ht(0.4, 88.8, p), 88.8];
  const Y = [-0.4, ht(-0.4, 90.6, p), 90.6];
  const cam = camKeys([
    { f: 1322, pos: [0.0, 1.8, 96.5], look: [0.0, 1.3, 89.5], fov: 42 },
    { f: 1556, pos: [0.0, 1.7, 95.5], look: [0.0, 1.3, 89.5], fov: 40, ease: (t) => smooth(t) },
  ], f);
  CAMNOW = cam;
  const L = LP.golden, mir = mirrorOf(cam, [0, -1]);
  const bless = f >= 1390;
  const actors = [
    { id: "yamraj", kind: "front", outfit: YAMRAJ, pos: [R[0], R[2]], opts: { expr: bless ? "grin" : "smile", armR: bless ? "up" : "hang", armL: "hip", blink: blinkAt(f, 7), seed: 7, light: -2.2, tilt: q(bless ? 2 : idle(f, 7).tilt, 0.5) } },
    { id: "yamuna", kind: "front", outfit: YAMUNA, pos: [Y[0], Y[2]], opts: { expr: bless ? "laugh" : "smile", armL: "belly", armR: bless ? "up" : "hang", blink: blinkAt(f, 5), seed: 5, light: lightAng(cam, L, mir), tilt: q(idle(f, 5).tilt, 0.5) } },
  ];
  const fx = [];
  if (bless) {
    fx.push({ id: "bless1", kind: "burst", pos: pullTo([0.0, 3.4, 89.5]), size: 1.6, t: q((f - 1390 + 1) / 40, 0.025), col: "#ffe98a" });
    if (f >= 1390 && f < 1412) fx.push({ id: "bless2", kind: "chips", pos: pullTo([0.0, 3.2, 89.5]), size: 1.8, t: q((f - 1390) / 22, 0.05), seed: 9 });
    fx.push({ id: "bless3", kind: "glow", pos: [0.0, 2.6, 89.5], size: 0.6, alpha: 0.5 });
  }
  diyaGlow(fx, "dg9a", f, 0.0, 89.6, 1.0);
  diyaGlow(fx, "dg9b", f, -1.5, 90.5, 1.0);
  diyaGlow(fx, "dg9c", f, 1.5, 90.5, 1.0);
  dustAt(fx, f, 0, 0.2, 1.7, 90.0); dustAt(fx, f, 1, -0.4, 1.9, 89.5); dustAt(fx, f, 2, 0.6, 1.5, 90.2);
  birdsAt(fx, f, 1322, 1556, 2, 32, 80);
  return { cam, L, actors, fx, p, kicks: [{ f: 1390, a: 0.016 }], dof: { focus: dist(cam.pos, add3(R, [0, 1.4, 0])), cInf: 10 }, shadow: { c: [0, 0, 90], r: 12 } };
});

// 10 TRADITION (L10): HIGH-ANGLE WIDE + CRANE DOWN — the festival lane: a brother arrives at
//     his sister's home, she does his tilak; villagers celebrate, marigold everywhere, diyas lit.
shot("tradition", 1556, 1749, (f) => {
  const p = 0;
  const B = [0.4, ht(0.4, 50, p), 50];
  const S = [-0.3, ht(-0.3, 51.5, p), 51.5];
  const cam = camKeys([
    { f: 1556, pos: [0.4, 5.0, 62.0], look: [0.4, 1.0, 50.0], fov: 50 },
    { f: 1749, pos: [0.4, 3.0, 59.0], look: [0.4, 1.2, 50.0], fov: 47, ease: (t) => smooth(t) },
  ], f);
  CAMNOW = cam;
  const L = blendL(LP.day, LP.golden, 0.3), mir = mirrorOf(cam, [0, -1]);
  const arrive = f >= 1650;
  const crowd = [[VIL_A, -2.0, 48.5, 7], [VIL_B, 2.0, 48.5, 9], [VIL_C, -2.0, 51.5, 11]];
  const actors = crowd.map(([o, x, z, seed], i) => {
    const P = [x, ht(x, z, p), z];
    return { id: "c" + i, kind: "front", outfit: o, pos: [P[0], P[2]], opts: { expr: i % 2 ? "grin" : "smile", armL: i % 3 === 0 ? "hip" : "hang", armR: i % 2 ? "up" : "hang", blink: blinkAt(f, seed), seed, light: -2.2, tilt: q(2 * Math.sin(f * 0.1 + i), 0.5), bob: q(idle(f, seed).bob, 0.01) } };
  });
  actors.push({ id: "bhai", kind: "front", outfit: BHAI, pos: [B[0], B[2]], opts: { expr: arrive ? "grin" : "smile", armL: "hang", armR: arrive ? "point" : "hang", blink: blinkAt(f, 23), seed: 23, light: lightAng(cam, L, mir), tilt: q(idle(f, 23).tilt, 0.5) } });
  actors.push({ id: "behen", kind: "front", outfit: BEHEN, pos: [S[0], S[2]], opts: { expr: arrive ? "laugh" : "smile", armL: "belly", armR: arrive ? "point" : "hang", blink: blinkAt(f, 25), seed: 25, light: -2.2, tilt: q(idle(f, 25).tilt, 0.5) } });
  const fx = [];
  thought(fx, "th10", f, 1650, head3(B, 2.0), 0.5);
  diyaGlow(fx, "dg10a", f, -2.0, 48.5, 1.2);
  diyaGlow(fx, "dg10b", f, 2.0, 48.5, 1.2);
  birdsAt(fx, f, 1556, 1749, 3, 34, 64);
  return { cam, L, actors, fx, p, kicks: [{ f: 1650, a: 0.012 }], dof: { focus: dist(cam.pos, add3(B, [0, 1.2, 0])), cInf: 10 }, shadow: { c: [0.4, 0, 50], r: 14 } };
});

// 11 PUNCHLINE (L11): GOLDEN PULL-BACK — Yamuna and Yamraj walk together along the riverbank
//     at sunset, diyas floating past. "भाई और बहन का ये रिश्ता, मौत से भी बड़ा है।"
shot("punchline", 1749, 1871, (f) => {
  const p = 0;
  const z = lerp(129.0, 130.5, lin(1749, 1800, f));
  const Y = [-0.6, ht(-0.6, z, p), z];
  const R = [0.6, ht(0.6, z - 1.5, p), z - 1.5];
  const cam = camKeys([
    { f: 1749, pos: add3(Y, [0.8, 1.5, 4.2]), look: add3(Y, [0, 1.2, 0]), fov: 38 },
    { f: 1871, pos: add3(Y, [1.4, 2.2, 7.0]), look: add3(Y, [0, 1.2, 0]), fov: 42, ease: (t) => smooth(t) },
  ], f);
  CAMNOW = cam;
  const L = LP.golden, mir = mirrorOf(cam, [0, -1]);
  const actors = [
    { id: "yamuna", kind: "side", wide: true, outfit: YAMUNA, pos: [Y[0], Y[2]], dir: [0, 1], opts: { mode: f < 1800 ? "walk" : "stand", phase: walkPhase(z - 129.0), expr: "smile", blink: blinkAt(f, 5), seed: 5, light: lightAng(cam, L, mir), lean0: 2 } },
    { id: "yamraj", kind: "side", wide: true, outfit: YAMRAJ, pos: [R[0], R[2]], dir: [0, 1], opts: { mode: f < 1800 ? "walk" : "stand", phase: walkPhase(z - 129.0), expr: "smile", blink: blinkAt(f, 7), seed: 7, light: -2.2, lean0: 2 } },
  ];
  const fx = [];
  diyaGlow(fx, "dg11a", f, -2.2, 134.5);
  diyaGlow(fx, "dg11b", f, 2.4, 135.5);
  diyaGlow(fx, "dg11c", f, 0.5 + 0.006 * (f - 1749), 136.0);
  dustAt(fx, f, 0, 0.2, 1.7, 131.0); dustAt(fx, f, 1, -0.4, 1.9, 131.5);
  birdsAt(fx, f, 1749, 1871, 3, 34, 120);
  return { cam, L, actors, fx, p, kicks: [], dof: { focus: dist(cam.pos, add3(Y, [0, 1.2, 0])), cInf: 10 }, shadow: { c: [0, 0, 130], r: 12 } };
});

// 12 CTA (L12): DIRECT-TO-CAMERA — Yamuna faces the camera and gestures to the viewer;
//     Yamraj waves beside her; diyas, warm light; the series end card shows for the last 60 frames.
shot("cta", 1871, 1986, (f) => {
  const p = 0;
  const Y = [0.0, ht(0.0, 130, p), 130];
  const R = [0.7, ht(0.7, 128.5, p), 128.5];
  const cam = camKeys([
    { f: 1871, pos: [0.0, 1.5, 135.0], look: [0.25, 1.25, 130.0], fov: 38 },
    { f: 1986, pos: [0.0, 1.45, 134.4], look: [0.25, 1.28, 130.0], fov: 37, ease: (t) => smooth(t) },
  ], f);
  CAMNOW = cam;
  const L = LP.golden, mir = mirrorOf(cam, [0, -1]);
  const wave = f >= 1940;
  const actors = [
    { id: "yamuna", kind: "front", outfit: YAMUNA, pos: [Y[0], Y[2]], opts: { expr: "grin", armR: "point", blink: blinkAt(f, 5), seed: 5, light: lightAng(cam, L, mir), tilt: q(idle(f, 5).tilt, 0.5) } },
    { id: "yamraj", kind: "front", outfit: YAMRAJ, pos: [R[0], R[2]], opts: { expr: "smile", armR: wave ? "up" : "hang", blink: blinkAt(f, 7), seed: 7, light: -2.2, tilt: q(idle(f, 7).tilt, 0.5) } },
  ];
  const fx = [];
  diyaGlow(fx, "dg12a", f, -2.2, 134.5);
  diyaGlow(fx, "dg12b", f, 2.4, 135.5);
  thought(fx, "th12", f, 1940, head3(Y, 1.9), 0.5);
  dustAt(fx, f, 0, 0.2, 1.7, 131.0); dustAt(fx, f, 1, -0.4, 1.9, 131.5);
  birdsAt(fx, f, 1871, 1986, 2, 34, 120);
  return { cam, L, actors, fx, p, kicks: [{ f: 1940, a: 0.01 }], dof: { focus: dist(cam.pos, add3(Y, [0, 1.2, 0])), cInf: 9 }, shadow: { c: [0, 0, 130], r: 12 } };
});

export const SHOTLIST = SHOTS.map((s) => ({ id: s.id, a: s.a, b: s.b }));
export const shotAt = (f) => SHOTS.find((s) => f >= s.a && f < s.b) || SHOTS[SHOTS.length - 1];

export const frameState = (f) => {
  const s = shotAt(f), r = s.fn(f);
  const cam = { ...r.cam, pos: [...r.cam.pos], look: [...r.cam.look] };
  const [kx, ky] = kick(f, r.kicks || []);
  if (kx || ky) {
    const d = dist(cam.pos, cam.look), R = camRight(cam), U = camUp(cam);
    cam.look = add3(cam.look, [R[0] * kx * d + U[0] * ky * d, R[1] * kx * d + U[1] * ky * d, R[2] * kx * d + U[2] * ky * d]);
  }
  const world = { progress: r.p ?? 0, slab: null, plug: null, short: false, ...(r.world || {}) };
  // text layer: the hook (first 90 frames) is a FULL-SCREEN title card; the current line is
  // kept as a subtitle ONLY when window.SUBS is on (default OFF — title-cards-only format);
  // the series end card shows for the last 60 frames.
  const idx = SHOTS.indexOf(s);
  const sub = f < 90 ? { text: HOOK, kind: "hook" } : { text: LINES[idx], kind: "bottom" };
  const end = f >= TOTAL - 60 ? ENDCARD : null;
  return { shot: s.id, cam, light: r.L, actors: r.actors || [], fx: r.fx || [], world, flash: r.flash || 0, vign: r.vign ?? 0.18, dof: r.dof, shadow: r.shadow, sub, end };
};
