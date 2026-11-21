"use client";

import { memo } from "react";

export type ZoneId = "mine" | "plant" | "center" | "ger" | "junction" | "hills";

// Deterministic pseudo-random so server and client markup match.
// Integer hash (no Math.sin) and rounded to 3 decimals, so Node and the browser produce identical numbers.
const rnd = (n: number) => {
  let h = Math.imul((n + 1) ^ 0x9e3779b9, 0x85ebca6b);
  h = Math.imul(h ^ (h >>> 13), 0xc2b2ae35);
  h ^= h >>> 16;
  return Math.round(((h >>> 0) / 4294967296) * 1000) / 1000;
};

function Apartment({ x, y, w, h, floors, cols, seed, tone }: { x: number; y: number; w: number; h: number; floors: number; cols: number; seed: number; tone: string }) {
  const fh = (h - 10) / floors, cw = (w - 8) / cols;
  const wins = [];
  for (let f = 0; f < floors; f++) for (let c = 0; c < cols; c++) {
    const r = rnd(seed * 97 + f * 13 + c * 7);
    const lit = r > 0.45;
    wins.push(
      <rect key={`${f}-${c}`} x={x + 5 + c * cw} y={y + 6 + f * fh} width={cw * 0.55} height={fh * 0.5} rx={0.6}
        fill={lit ? (r > 0.85 ? "#cfe2ff" : "#ffd98a") : "#183a5c"} opacity={lit ? 0.9 : 0.8}
        className={lit && r > 0.93 ? "window-blink" : undefined} />,
    );
  }
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} fill={tone} />
      <rect x={x} y={y} width={w * 0.18} height={h} fill="#000" opacity={0.18} />
      <rect x={x - 2} y={y - 3} width={w + 4} height={4} fill="#9fb3c8" opacity={0.35} />
      {wins}
    </g>
  );
}

function Ger({ x, y, s = 1, door = "#ff9f43" }: { x: number; y: number; s?: number; door?: string }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <ellipse cx={0} cy={2} rx={20} ry={3} fill="#000" opacity={0.25} />
      <path d="M-18 0 V-12 H18 V0 Z" fill="#eef4f8" />
      <path d="M-18 -12 Q0 -26 18 -12 Z" fill="#dfe8ef" />
      <path d="M-18 -12 H18" stroke="#9fb3c8" strokeWidth={1} />
      <path d="M-18 -6 H18" stroke="#b9c9d6" strokeWidth={0.6} />
      <rect x={-4} y={-9} width={8} height={9} fill={door} rx={1} />
      <circle cx={0} cy={-21} r={2.4} fill="#c7d4de" />
      <rect x={6} y={-27} width={2} height={7} fill="#5b6b78" />
      <circle className="smoke" cx={7} cy={-30} r={3} fill="#cfd8e3" opacity={0.4} style={{ animationDelay: `${(x % 5) * 0.7}s` }} />
    </g>
  );
}

function Pine({ x, y, s = 1, c = "#0f5a4a" }: { x: number; y: number; s?: number; c?: string }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <rect x={-1.2} y={-4} width={2.4} height={6} fill="#4a3a2a" />
      <path d="M0 -26 L9 -10 H-9 Z M0 -18 L11 -2 H-11 Z" fill={c} />
      <path d="M0 -26 L9 -10 H0 Z M0 -18 L11 -2 H0 Z" fill="#000" opacity={0.18} />
    </g>
  );
}

function RoundTree({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <rect x={-1} y={-6} width={2} height={7} fill="#4a3a2a" />
      <circle cx={0} cy={-11} r={7} fill="#11866a" />
      <circle cx={2.5} cy={-13} r={4} fill="#22b38a" opacity={0.7} />
    </g>
  );
}

function Lamp({ x, y }: { x: number; y: number }) {
  return (
    <g>
      <rect x={x - 0.8} y={y - 26} width={1.6} height={26} fill="#5d7690" />
      <path d={`M${x} ${y - 26} q6 -2 9 1`} stroke="#5d7690" strokeWidth={1.6} fill="none" />
      <circle className="lamp-glow" cx={x + 9} cy={y - 24} r={9} fill="url(#lampGlow)" style={{ animationDelay: `${(x % 7) * 0.4}s` }} />
      <circle cx={x + 9} cy={y - 24.5} r={1.8} fill="#fff6c9" />
    </g>
  );
}

function Car({ color, bus = false }: { color: string; bus?: boolean }) {
  return bus ? (
    <g>
      <rect x={0} y={-15} width={46} height={14} rx={3} fill={color} />
      <rect x={3} y={-12.5} width={36} height={5} rx={1} fill="#062035" opacity={0.85} />
      <rect x={41} y={-12.5} width={3} height={6} fill="#e3eeff" />
      <circle cx={10} cy={-1} r={3} fill="#0b1422" /><circle cx={36} cy={-1} r={3} fill="#0b1422" />
      <circle cx={46} cy={-5} r={1.6} fill="#fff6c9" />
    </g>
  ) : (
    <g>
      <path d="M0 -6 h4 l4 -5 h10 l5 5 h3 v5 h-26 z" fill={color} />
      <path d="M9 -10 h8 l3.5 4 h-12.5 z" fill="#0a2238" opacity={0.85} />
      <circle cx={6} cy={-1} r={2.4} fill="#0b1422" /><circle cx={20} cy={-1} r={2.4} fill="#0b1422" />
      <circle cx={26} cy={-4} r={1.3} fill="#fff6c9" />
    </g>
  );
}

function CityIllustrationBase({ onZone, active }: { onZone: (z: ZoneId) => void; active: ZoneId | null }) {
  const zoneProps = (id: ZoneId, label: string) => ({
    className: "city-zone",
    role: "button",
    tabIndex: 0,
    "aria-label": label,
    "aria-pressed": active === id,
    onClick: () => onZone(id),
    onKeyDown: (e: React.KeyboardEvent) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onZone(id); } },
  });

  const blocks = [
    { x: 470, y: 330, w: 54, h: 118, floors: 9, cols: 4, tone: "#1d4166" },
    { x: 530, y: 352, w: 70, h: 96, floors: 7, cols: 5, tone: "#204a73" },
    { x: 608, y: 316, w: 46, h: 132, floors: 10, cols: 3, tone: "#1a3c60" },
    { x: 660, y: 344, w: 76, h: 104, floors: 8, cols: 6, tone: "#22507b" },
    { x: 744, y: 360, w: 50, h: 88, floors: 6, cols: 4, tone: "#1d4166" },
    { x: 420, y: 372, w: 44, h: 76, floors: 5, cols: 3, tone: "#22507b" },
    { x: 800, y: 376, w: 44, h: 72, floors: 5, cols: 3, tone: "#1a3c60" },
  ];

  return (
    <svg viewBox="0 0 1200 620" className="h-auto w-full select-none" role="img"
      aria-label="Эрдэнэт хот, Орхон аймгийн уран сайхны 2D дүрслэл: ил уурхай, баяжуулах үйлдвэр, орон сууц, гэр хороолол, зам, толгод">
      <defs>
        <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#04101e" />
          <stop offset="0.55" stopColor="#0a2340" />
          <stop offset="1" stopColor="#123a5a" />
        </linearGradient>
        <linearGradient id="mtn1" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#1b3e5e" /><stop offset="1" stopColor="#0d2741" /></linearGradient>
        <linearGradient id="mtn2" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#11524f" /><stop offset="1" stopColor="#0b3238" /></linearGradient>
        <linearGradient id="hill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#0f6b57" /><stop offset="1" stopColor="#0a3f3a" /></linearGradient>
        <linearGradient id="ground" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#0c3a3b" /><stop offset="1" stopColor="#071f2d" /></linearGradient>
        <linearGradient id="road" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#1b2a3c" /><stop offset="1" stopColor="#111c2a" /></linearGradient>
        <radialGradient id="lampGlow"><stop offset="0" stopColor="#ffe9a8" stopOpacity="0.9" /><stop offset="1" stopColor="#ffe9a8" stopOpacity="0" /></radialGradient>
        <radialGradient id="moon"><stop offset="0" stopColor="#f8fafc" /><stop offset="0.6" stopColor="#c9f6ff" /><stop offset="1" stopColor="#7fb2ff" stopOpacity="0" /></radialGradient>
        <linearGradient id="pitWall" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#b9774a" /><stop offset="1" stopColor="#6f4430" /></linearGradient>
        <filter id="soft" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="6" /></filter>
      </defs>

      {/* sky */}
      <rect width="1200" height="620" fill="url(#sky)" />
      {Array.from({ length: 46 }, (_, i) => (
        <circle key={i} cx={rnd(i) * 1200} cy={rnd(i + 99) * 190} r={rnd(i + 7) * 1.3 + 0.3} fill="#e6fbff" opacity={0.25 + rnd(i + 3) * 0.5} />
      ))}
      <circle cx={1010} cy={92} r={48} fill="url(#moon)" opacity={0.35} />
      <circle cx={1010} cy={92} r={22} fill="#eafcff" opacity={0.92} />

      {/* clouds */}
      {[{ y: 70, d: 70, s: 1, o: 0.12 }, { y: 130, d: 95, s: 0.7, o: 0.09 }, { y: 48, d: 120, s: 1.3, o: 0.07 }].map((c, i) => (
        <g key={i} className="cloud" style={{ animationDuration: `${c.d}s`, animationDelay: `${-i * 25}s` }}>
          <g transform={`translate(0 ${c.y}) scale(${c.s})`} opacity={c.o} fill="#dff8ff">
            <ellipse cx={60} cy={10} rx={60} ry={14} /><ellipse cx={95} cy={0} rx={38} ry={16} /><ellipse cx={40} cy={2} rx={28} ry={12} />
          </g>
        </g>
      ))}

      {/* far mountains */}
      <path d="M0 270 L90 205 L170 240 L260 170 L360 232 L450 188 L560 236 L660 176 L760 226 L860 168 L960 222 L1060 186 L1200 236 V620 H0 Z" fill="url(#mtn1)" />
      <path d="M260 170 L285 186 L272 190 L258 182 Z M660 176 L690 194 L672 196 Z M860 168 L888 186 L870 188 Z" fill="#d9f6ff" opacity={0.18} />

      {/* green hills (zone) */}
      <g {...zoneProps("hills", "Ногоон толгод, байгаль орчин")}>
        <path d="M0 330 Q120 250 250 300 T520 292 T800 300 T1200 300 V620 H0 Z" fill="url(#mtn2)" />
        {Array.from({ length: 26 }, (_, i) => (
          <Pine key={i} x={20 + i * 44 + rnd(i) * 20} y={Math.round(300 + Math.sin(i * 0.8) * 16 + rnd(i + 5) * 12)} s={0.55 + rnd(i + 2) * 0.35} c={i % 3 ? "#0e5c4b" : "#0b4b3f"} />
        ))}
        {/* Friendship monument on the hill */}
        <g transform="translate(300 262)">
          <path d="M-14 22 L-3 -26 H3 L14 22 Z" fill="#cfe9f2" opacity={0.85} />
          <path d="M0 -26 V22" stroke="#7fa7bd" strokeWidth={1} />
          <circle cx={0} cy={-30} r={4} fill="#7fb2ff" opacity={0.75} className="lamp-glow" />
        </g>
      </g>

      {/* open-pit mine + plant (right) */}
      <g {...zoneProps("mine", "Эрдэнэтийн ил уурхай")}>
        <ellipse cx={985} cy={360} rx={190} ry={62} fill="#4b2f22" />
        {[0, 1, 2, 3, 4, 5, 6].map((k) => (
          <ellipse key={k} cx={985 + k * 4} cy={358 + k * 5} rx={185 - k * 24} ry={58 - k * 7.6} fill={k % 2 ? "#a7663f" : "#c07a4b"} stroke="#6f4430" strokeWidth={1.2} opacity={0.96} />
        ))}
        <ellipse cx={1013} cy={392} rx={22} ry={6} fill="#1f6f86" opacity={0.85} />
        {/* haul road + trucks */}
        <path d="M820 352 Q900 330 980 344 T1100 372" stroke="#e7b48a" strokeWidth={2} fill="none" strokeDasharray="3 4" opacity={0.7} />
        <g transform="translate(905 338)"><rect width={16} height={8} rx={1.5} fill="#ffc24b" /><rect x={11} y={-4} width={6} height={5} fill="#ffc24b" /><circle cx={4} cy={9} r={2.2} fill="#111" /><circle cx={13} cy={9} r={2.2} fill="#111" /></g>
        <g transform="translate(1050 356)"><rect width={16} height={8} rx={1.5} fill="#ffc24b" /><circle cx={4} cy={9} r={2.2} fill="#111" /><circle cx={13} cy={9} r={2.2} fill="#111" /></g>
      </g>
      <g {...zoneProps("plant", "Эрдэнэт үйлдвэр, баяжуулах фабрик")}>
        <rect x={860} y={404} width={150} height={44} fill="#26445f" />
        <rect x={880} y={380} width={60} height={24} fill="#2c5272" />
        <path d="M860 404 L900 386 L940 404 Z" fill="#335d80" />
        {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => <rect key={i} x={866 + i * 17} y={414} width={9} height={6} fill={i % 3 ? "#ffd98a" : "#cfe2ff"} opacity={0.85} />)}
        <rect x={1020} y={372} width={12} height={76} fill="#3a5f80" />
        <rect x={1040} y={392} width={10} height={56} fill="#3a5f80" />
        <rect x={1020} y={372} width={12} height={5} fill="#ff5a6e" />
        <circle className="smoke" cx={1026} cy={362} r={8} fill="#cfd8e3" opacity={0.35} />
        <circle className="smoke" cx={1045} cy={384} r={6} fill="#cfd8e3" opacity={0.3} style={{ animationDelay: "2.2s" }} />
        <path d="M940 404 L1020 380" stroke="#5d7690" strokeWidth={3} />
      </g>

      {/* city ground */}
      <path d="M0 440 Q300 420 600 438 T1200 440 V620 H0 Z" fill="url(#ground)" />

      {/* ger district (left) */}
      <g {...zoneProps("ger", "Гэр хороолол")}>
        <rect x={20} y={392} width={380} height={64} fill="transparent" />
        {[0, 1, 2, 3, 4, 5].map((i) => <path key={i} d={`M${30 + i * 62} 452 h56`} stroke="#8a6a48" strokeWidth={1.4} strokeDasharray="2 3" />)}
        {[{ x: 52, y: 428 }, { x: 110, y: 418 }, { x: 172, y: 432 }, { x: 236, y: 416 }, { x: 300, y: 430 }, { x: 352, y: 418 }, { x: 80, y: 452 }, { x: 206, y: 452 }, { x: 330, y: 452 }].map((g, i) => (
          <Ger key={i} x={g.x} y={g.y} s={i > 5 ? 1.05 : 0.85} door={i % 2 ? "#ff9f43" : "#ff6b6b"} />
        ))}
        {/* wooden houses with tin roofs */}
        {[{ x: 140, c: "#2f7fa8" }, { x: 268, c: "#3d8a5a" }].map((h, i) => (
          <g key={i} transform={`translate(${h.x} 446)`}>
            <rect x={-12} y={-14} width={24} height={14} fill="#7a5a3c" />
            <path d="M-15 -14 L0 -25 L15 -14 Z" fill={h.c} />
            <rect x={-4} y={-10} width={6} height={5} fill="#ffd98a" />
          </g>
        ))}
      </g>

      {/* city centre */}
      <g {...zoneProps("center", "Эрдэнэт хотын төв, орон сууцны хороолол")}>
        {blocks.map((b, i) => <Apartment key={i} {...b} seed={i + 1} />)}
        {/* Culture palace */}
        <g transform="translate(560 448)">
          <rect x={-60} y={-40} width={120} height={40} fill="#d9e6ee" />
          <rect x={-66} y={-46} width={132} height={7} fill="#eef5f9" />
          {Array.from({ length: 9 }, (_, i) => <rect key={i} x={-54 + i * 13} y={-38} width={4} height={36} fill="#9fb8c8" />)}
          <path d="M-30 -46 L0 -60 L30 -46 Z" fill="#b8673a" />
          <rect x={-8} y={-16} width={16} height={16} fill="#7fb2ff" opacity={0.5} />
        </g>
        {/* park */}
        {[640, 662, 690, 716, 742].map((x, i) => <RoundTree key={i} x={x} y={452} s={0.85 + (i % 2) * 0.2} />)}
      </g>

      {/* road + junction */}
      <g {...zoneProps("junction", "Гол зам, Барилгачдын талбайн уулзвар")}>
        <path d="M0 500 Q600 478 1200 500 V548 Q600 526 0 548 Z" fill="url(#road)" />
        <path d="M0 524 Q600 502 1200 524" stroke="#ffd98a" strokeWidth={1.6} strokeDasharray="14 12" fill="none" opacity={0.7} />
        <path d="M560 462 L540 500 H620 L600 462 Z" fill="#16243a" />
        {[0, 1, 2, 3, 4].map((i) => <rect key={i} x={552 + i * 12} y={503} width={7} height={3} fill="#e6eef5" opacity={0.75} transform="skewX(-10)" />)}
        {/* traffic light */}
        <g transform="translate(628 498)"><rect x={-1} y={-30} width={2} height={30} fill="#5d7690" /><rect x={-4} y={-44} width={8} height={16} rx={2} fill="#0b1422" /><circle cx={0} cy={-40} r={2.4} fill="#ff5a6e" className="lamp-glow" /><circle cx={0} cy={-33} r={2.4} fill="#0d3b2f" /></g>
      </g>

      {/* vehicles */}
      <g style={{ pointerEvents: "none" }}>
        <g className="car-r" style={{ animationDuration: "16s" }}><g transform="translate(0 518)"><Car color="#7fb2ff" bus /></g></g>
        <g className="car-r" style={{ animationDuration: "11s", animationDelay: "-5s" }}><g transform="translate(0 520)"><Car color="#f8fafc" /></g></g>
        <g className="car-r" style={{ animationDuration: "13s", animationDelay: "-9s" }}><g transform="translate(0 521)"><Car color="#ff5a6e" /></g></g>
        <g className="car-l" style={{ animationDuration: "14s", animationDelay: "-3s" }}><g transform="translate(0 540)"><Car color="#5fd0a8" /></g></g>
        <g className="car-l" style={{ animationDuration: "19s", animationDelay: "-11s" }}><g transform="translate(0 541)"><Car color="#ffc24b" bus /></g></g>
      </g>

      {/* streetlights + foreground */}
      {[60, 200, 340, 480, 700, 840, 980, 1120].map((x) => <Lamp key={x} x={x} y={500 - Math.abs(600 - x) * -0.0 - (x > 600 ? (x - 600) * 0.03 : (600 - x) * 0.03) + 18} />)}
      <path d="M0 560 Q600 540 1200 560 V620 H0 Z" fill="#061322" opacity={0.85} />
      {[30, 110, 190, 1010, 1090, 1170].map((x, i) => <Pine key={x} x={x} y={600} s={0.9 + rnd(i) * 0.3} c="#0b4b3f" />)}
    </svg>
  );
}

export const CityIllustration = memo(CityIllustrationBase);
