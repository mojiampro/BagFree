import { useId, type ReactNode } from "react";
import type { AdArtKind } from "@/lib/ads";

/*
 * Flat illustrations for the sponsored slides, drawn inline so nothing is fetched.
 * Illustration colours live only in this palette; UI colours stay in the Tailwind theme.
 */
const C = {
  white: "#ffffff",
  peach: "#ff9f6b",
  apricot: "#ffe1a8",
  cream: "#fff4da",
  gold: "#e7b03a",
  goldDark: "#d99a22",
  wall: "#f8eedb",
  roofRed: "#c42b32",
  roofBlue: "#2457a6",
  shadow: "#3a2a55",
  sand: "#d7c3a2",
  sandDark: "#c4ae89",
  dusk: "#5b4b8a",
  sunset: "#f29e6d",
  sun: "#ffc98b",
  stone: "#e9d8c0",
  stoneMid: "#dcc6a6",
  stoneDark: "#cdb591",
  river: "#2e3d73",
  shimmer: "#f7c99b",
  boat: "#f4f1ea",
  leaf: "#7cc8a4",
  mint: "#e9f6d6",
  forest: "#2f5d50",
  bulb: "#ffd25e",
  tomato: "#e4572e",
  ocean: "#2e86ab",
  amber: "#f3a712",
  plum: "#a23b72",
  stall: "#fff8ec",
  grass: "#b9c9a7",
  grassDark: "#9db088",
  night: "#1b1d3a",
  nightPurple: "#3b2350",
  block: "#2a2b4a",
  blockDark: "#24253f",
  neonRed: "#e63946",
  neonGold: "#ffb703",
  window: "#ffe8a3",
  street: "#3a2c3f",
  sky: "#4fa3e0",
  skyLight: "#cdebff",
  glass: "#e8f3fb",
  glassBlue: "#9fd0f2",
  frame: "#9fc3dd",
  water: "#3e7cb1",
  latte: "#f3e2cb",
  latteDark: "#e7cda8",
  wood: "#b98a5e",
  woodDark: "#a47649",
  tree: "#5e8c61",
  trunk: "#8e5e3b",
  coffee: "#8b5a2b",
  foam: "#f4e3cf",
  royal: "#1e3a9e",
  royalLight: "#2f57d0",
  tag: "#d6e0ef",
  wheel: "#0d1a3a",
};

function Sky({ id, top, bottom }: { id: string; top: string; bottom: string }) {
  return (
    <>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={top} />
          <stop offset="1" stopColor={bottom} />
        </linearGradient>
      </defs>
      <rect width="400" height="250" fill={`url(#${id})`} />
    </>
  );
}

const MARKET_STALLS: [string, number][] = [
  [C.tomato, 10],
  [C.ocean, 108],
  [C.amber, 206],
  [C.plum, 304],
];

function scene(kind: AdArtKind, skyId: string): ReactNode {
  switch (kind) {
    case "palace":
      return (
        <>
          <Sky id={skyId} top={C.peach} bottom={C.apricot} />
          <circle cx="320" cy="70" r="30" fill={C.cream} opacity=".9" />
          <path d="M70 200 L92 40 L114 200Z" fill={C.gold} />
          <circle cx="92" cy="160" r="26" fill={C.gold} />
          <rect x="64" y="180" width="56" height="22" fill={C.goldDark} />
          <rect x="160" y="150" width="190" height="52" fill={C.wall} />
          <g fill={C.shadow} opacity=".35">
            {[178, 208, 288, 318].map((x) => (
              <rect key={x} x={x} y="166" width="14" height="36" />
            ))}
          </g>
          <path d="M150 156 L255 100 L360 156Z" fill={C.roofRed} />
          <path d="M168 138 L255 82 L342 138Z" fill={C.roofBlue} />
          <path d="M190 118 L255 64 L320 118Z" fill={C.roofRed} />
          <path d="M255 64 L255 36 M150 156 L140 146 M360 156 L370 146" stroke={C.gold} strokeWidth="5" strokeLinecap="round" />
          <rect y="200" width="400" height="50" fill={C.sand} />
          <rect y="200" width="400" height="6" fill={C.sandDark} />
        </>
      );
    case "arun":
      return (
        <>
          <Sky id={skyId} top={C.dusk} bottom={C.sunset} />
          <circle cx="90" cy="150" r="40" fill={C.sun} opacity=".85" />
          <path d="M200 182 L218 30 L236 182Z" fill={C.stone} />
          <path d="M182 182 C190 120 246 120 254 182Z" fill={C.stoneMid} />
          <path d="M140 182 L150 110 L160 182Z M276 182 L286 110 L296 182Z" fill={C.stoneMid} />
          <path d="M110 182 L116 140 L122 182Z M314 182 L320 140 L326 182Z" fill={C.stoneDark} />
          <rect y="182" width="400" height="68" fill={C.river} />
          <g opacity=".35" fill={C.shimmer}>
            <rect x="208" y="190" width="20" height="4" rx="2" />
            <rect x="198" y="202" width="40" height="3" rx="1.5" />
            <rect x="190" y="214" width="56" height="3" rx="1.5" />
            <rect x="70" y="196" width="40" height="3" rx="1.5" />
          </g>
          <path d="M300 222 h64 l-8 10 h-50z" fill={C.boat} />
          <rect x="318" y="210" width="26" height="12" fill={C.roofRed} />
        </>
      );
    case "market":
      return (
        <>
          <Sky id={skyId} top={C.leaf} bottom={C.mint} />
          <path d="M0 40 Q100 70 200 40 T400 40" stroke={C.forest} strokeWidth="2" fill="none" />
          <g fill={C.bulb}>
            {[
              [40, 52],
              [100, 60],
              [160, 52],
              [240, 50],
              [300, 58],
              [360, 50],
            ].map(([cx, cy]) => (
              <circle key={cx} cx={cx} cy={cy} r="5" />
            ))}
          </g>
          {MARKET_STALLS.map(([color, x]) => (
            <g key={x}>
              <path d={`M${x} 120 L${x + 43} 92 L${x + 86} 120Z`} fill={color} />
              <path d={`M${x} 120 h86 v8 h-86z`} fill={color} opacity=".8" />
              <rect x={x + 6} y="128" width="74" height="62" fill={C.stall} />
              <g fill={color} opacity=".6">
                <rect x={x + 14} y="150" width="16" height="16" rx="3" />
                <rect x={x + 36} y="146" width="16" height="20" rx="3" />
                <rect x={x + 58} y="152" width="14" height="14" rx="3" />
              </g>
            </g>
          ))}
          <rect y="190" width="400" height="60" fill={C.grass} />
          <rect y="190" width="400" height="5" fill={C.grassDark} />
        </>
      );
    case "chinatown":
      return (
        <>
          <Sky id={skyId} top={C.night} bottom={C.nightPurple} />
          <rect x="20" y="70" width="80" height="180" fill={C.block} />
          <rect x="130" y="40" width="90" height="210" fill={C.blockDark} />
          <rect x="250" y="80" width="70" height="170" fill={C.block} />
          <rect x="340" y="56" width="60" height="194" fill={C.blockDark} />
          <rect x="104" y="60" width="22" height="96" rx="4" fill={C.neonRed} />
          <rect x="224" y="74" width="22" height="80" rx="4" fill={C.neonGold} />
          <rect x="322" y="70" width="18" height="70" rx="4" fill={C.neonRed} />
          <rect x="30" y="92" width="60" height="18" rx="4" fill={C.neonGold} />
          <g fill={C.window} opacity=".9">
            {[
              [110, 70],
              [110, 88],
              [110, 106],
              [230, 84],
              [230, 102],
              [326, 80],
              [326, 98],
            ].map(([x, y]) => (
              <rect key={`${x}-${y}`} x={x} y={y} width="10" height="10" />
            ))}
          </g>
          <rect y="200" width="400" height="50" fill={C.street} />
          <path d="M150 200 a50 22 0 0 0 100 0z" fill={C.boat} />
          <rect x="150" y="196" width="100" height="6" rx="3" fill={C.neonRed} />
          <path
            d="M180 186 q-8 -14 0 -26 M200 182 q-8 -16 0 -30 M220 186 q-8 -14 0 -26"
            stroke={C.white}
            strokeWidth="3"
            fill="none"
            opacity=".55"
            strokeLinecap="round"
          />
        </>
      );
    case "mall":
      return (
        <>
          <Sky id={skyId} top={C.sky} bottom={C.skyLight} />
          <path d="M70 190 L110 70 Q200 30 290 70 L330 190Z" fill={C.glass} />
          <path d="M110 70 Q200 30 290 70 L300 100 Q200 64 100 100Z" fill={C.glassBlue} />
          <path
            d="M140 80 L130 190 M170 66 L165 190 M200 60 L200 190 M230 66 L235 190 M260 80 L270 190 M95 130 H305 M84 160 H316"
            stroke={C.frame}
            strokeWidth="2"
          />
          <rect y="190" width="400" height="60" fill={C.water} />
          <g opacity=".4" fill={C.glass}>
            <rect x="150" y="200" width="100" height="4" rx="2" />
            <rect x="130" y="214" width="140" height="3" rx="1.5" />
          </g>
          <path d="M40 222 h60 l-8 10 h-44z" fill={C.white} />
          <rect x="56" y="212" width="24" height="10" fill={C.amber} />
        </>
      );
    case "cafe":
      return (
        <>
          <Sky id={skyId} top={C.latte} bottom={C.latteDark} />
          <rect y="176" width="400" height="74" fill={C.wood} />
          <rect y="176" width="400" height="8" fill={C.woodDark} />
          <ellipse cx="60" cy="120" rx="34" ry="44" fill={C.tree} />
          <ellipse cx="350" cy="110" rx="30" ry="50" fill={C.tree} />
          <rect x="52" y="150" width="16" height="28" fill={C.trunk} />
          <rect x="342" y="150" width="16" height="28" fill={C.trunk} />
          <path d="M150 112 h110 v40 a40 40 0 0 1 -40 40 h-30 a40 40 0 0 1 -40 -40z" fill={C.white} />
          <path d="M260 124 a18 18 0 0 1 0 36" stroke={C.white} strokeWidth="10" fill="none" />
          <ellipse cx="205" cy="114" rx="52" ry="10" fill={C.coffee} />
          <path d="M190 114 q15 -10 30 0 q-15 8 -30 0z" fill={C.foam} />
          <ellipse cx="205" cy="196" rx="76" ry="8" fill={C.white} opacity=".85" />
          <path d="M190 96 q-8 -14 0 -26 M212 92 q-8 -16 0 -30" stroke={C.white} strokeWidth="3" fill="none" opacity=".7" strokeLinecap="round" />
        </>
      );
    case "promo":
      return (
        <>
          <Sky id={skyId} top={C.royal} bottom={C.royalLight} />
          <g opacity=".15" fill={C.white}>
            <circle cx="60" cy="40" r="60" />
            <circle cx="360" cy="220" r="80" />
          </g>
          <rect x="120" y="70" width="110" height="140" rx="16" fill={C.white} />
          <rect x="152" y="46" width="46" height="28" rx="8" fill="none" stroke={C.white} strokeWidth="8" />
          <rect x="134" y="96" width="82" height="6" rx="3" fill={C.tag} />
          <rect x="134" y="112" width="60" height="6" rx="3" fill={C.tag} />
          <circle cx="140" cy="214" r="9" fill={C.wheel} />
          <circle cx="210" cy="214" r="9" fill={C.wheel} />
          <g transform="rotate(-12 290 120)">
            <rect x="236" y="90" width="120" height="64" rx="10" fill={C.bulb} />
            <circle cx="252" cy="122" r="7" fill={C.royal} />
            <text x="300" y="130" textAnchor="middle" fontFamily="ui-monospace, monospace" fontWeight="700" fontSize="22" fill={C.royal}>
              -10%
            </text>
          </g>
        </>
      );
  }
}

export function AdArt({ kind }: { kind: AdArtKind }) {
  // Unique per instance: the same slide can be on screen twice (banner + popup).
  const skyId = `sky-${useId().replace(/:/g, "")}`;
  return (
    <svg viewBox="0 0 400 250" preserveAspectRatio="xMidYMid slice" className="size-full" aria-hidden="true">
      {scene(kind, skyId)}
    </svg>
  );
}
