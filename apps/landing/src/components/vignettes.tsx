import type { CSSProperties, ReactNode } from "react";

/**
 * Turns `x:90px;w:300ms` into the custom properties that the vignette keyframes in globals.css read.
 *
 * @remarks
 * Each part keeps its final frame as its base style and animates from these offsets, so the
 * finished scene shows without JavaScript, with motion paused and with reduced motion.
 */
function cue(spec: string) {
  return Object.fromEntries(
    spec.split(";").map((pair) => {
      const [key, value] = pair.split(":");
      return [`--${key}`, value];
    }),
  ) as CSSProperties;
}

function Stage({ children }: { children: ReactNode }) {
  return (
    <svg viewBox="0 0 240 160" aria-hidden className="vignette">
      {children}
    </svg>
  );
}

function Doctor({
  x,
  y = 132,
  arm,
  motion,
  flip,
}: {
  x: number;
  y?: number;
  arm: number;
  motion: string;
  flip?: boolean;
}) {
  return (
    <g transform={`translate(${x} ${y})${flip ? " scale(-1 1)" : ""}`}>
      <use href="#vg-doc" />
      <g transform={`rotate(${arm} 16.5 -53)`}>
        <g className="vg-cue" style={cue(`o:50% 8%;${motion}`)}>
          <use href="#vg-arm" />
        </g>
      </g>
    </g>
  );
}

function Bust({ at, tone, motion }: { at: string; tone: "tint" | "warm"; motion: string }) {
  return (
    <g transform={at}>
      <g className="vg-cue vg-pop" style={cue(`s:0;o:center bottom;t:550ms;${motion}`)}>
        <use href="#vg-bust" className={`vg-paper vg-${tone}`} />
      </g>
    </g>
  );
}

function Ranges({
  y,
  tracks,
  bands,
  dots,
  delay,
}: {
  y: number;
  tracks: number[];
  bands: [number, number][];
  dots: number[];
  delay: number;
}) {
  return (
    <>
      <g className="vg-cue" style={cue(`o:left;s:0,1;w:${delay}ms`)}>
        {tracks.map((x) => (
          <rect key={x} className="vg-track" x={x} y={y} width="32" height="7" rx="3.5" />
        ))}
      </g>
      <g className="vg-cue" style={cue(`w:${delay + 250}ms;t:500ms`)}>
        {bands.map(([x, width]) => (
          <rect key={x} className="vg-band" x={x} y={y} width={width} height="7" rx="3.5" />
        ))}
        {dots.map((x) => (
          <circle key={x} className="vg-ok" cx={x} cy={y + 3.5} r="3" />
        ))}
      </g>
    </>
  );
}

/** Draws the doctor, the arm, a sheet and a person once, for every vignette to reuse. */
export function VignetteDefs() {
  return (
    <svg width="0" height="0" aria-hidden className="absolute">
      <defs>
        <g id="vg-doc">
          <path className="vg-paper" d="M-20 0v-44q0-12 12-14h16q12 2 12 14V0Z" />
          <path className="vg-paper vg-tint" d="m-8-58 8 14 8-14Z" />
          <path className="vg-ink" d="M0-44V-2" />
          <path className="vg-accent" d="M-9-56q-4 15 5 19" />
          <circle className="vg-brand" cx="-3" cy="-36" r="3" />
          <circle className="vg-paper" cy="-70" r="11" />
          <path className="vg-brand" d="M-11.5-70q0-13 11.5-13t11.5 13q-6-6-11.5-5.5T-11.5-70Z" />
          <circle className="vg-eye" cx="-4" cy="-68" r="1.4" />
          <circle className="vg-eye" cx="4" cy="-68" r="1.4" />
          <path className="vg-smile" d="M-2.6-63.5q2.6 1.8 5.2 0" />
        </g>
        <g id="vg-arm" className="vg-paper">
          <rect x="12" y="-57" width="9" height="34" rx="4.5" />
          <circle cx="16.5" cy="-22" r="4.5" />
        </g>
        <rect id="vg-sheet" width="40" height="50" rx="4" />
        <g id="vg-bust">
          <path d="M-16 0v-7q0-12 16-12t16 12V0Z" />
          <circle cy="-31" r="9.5" />
        </g>
      </defs>
    </svg>
  );
}

function Sheet({ at, motion }: { at: string; motion: string }) {
  return (
    <g transform={at}>
      <g className="vg-cue" style={cue(motion)}>
        <use href="#vg-sheet" className="vg-paper" />
      </g>
    </g>
  );
}

export function FilesArt() {
  return (
    <Stage>
      <path className="vg-ground" d="M20 132h200" />
      <Sheet at="translate(166 30) rotate(10)" motion="x:90px;y:-80px;r:40deg" />
      <Sheet at="translate(150 26) rotate(-6)" motion="x:100px;y:-70px;r:-30deg;w:160ms" />
      <rect className="vg-paper" x="120" y="38" width="62" height="86" rx="6" />
      <rect className="vg-brand" x="129" y="48" width="20" height="6" rx="3" />
      <path className="vg-rule" d="M130 66h38M130 78h30M130 90h36M130 102h24" />
      <g className="vg-cue vg-pop" style={cue("s:0;o:center bottom;w:1080ms;t:450ms")}>
        <path className="vg-ink" d="M145 33q6-10 12 0" />
        <rect className="vg-brand" x="141" y="32" width="20" height="11" rx="3" />
      </g>
      <Doctor
        x={78}
        arm={-62}
        motion="k:vignette-swing;r:-28deg;t:440ms;n:2;w:620ms;e:ease-in-out"
      />
    </Stage>
  );
}

export function StudiesArt() {
  return (
    <Stage>
      <path className="vg-ground" d="M20 132h200" />
      <rect className="vg-paper" x="104" y="20" width="100" height="108" rx="6" />
      <rect className="vg-track" x="114" y="30" width="80" height="38" rx="3" />
      <path className="vg-rule" d="M120 52h14l4-10 5 18 4-14 3 6h12l4-10 5 18 4-14 3 6h10" />
      {[
        [78, 72, 500],
        [94, 56, 800],
        [110, 64, 1100],
      ].map(([y, width, delay]) => (
        <rect
          key={y}
          className="vg-cue vg-tint"
          style={cue(`o:left;s:0,1;t:450ms;w:${delay}ms`)}
          x="112"
          y={y}
          width={width}
          height="10"
          rx="3"
        />
      ))}
      <path className="vg-rule" d="M116 83h64M116 99h48M116 115h56" />
      <Doctor
        x={64}
        arm={-70}
        motion="k:vignette-swing;r:-12deg;t:600ms;n:2;w:400ms;e:ease-in-out"
      />
    </Stage>
  );
}

export function FamilyArt() {
  return (
    <Stage>
      <path className="vg-ground" d="M16 118h208" />
      <Bust at="translate(92 112)" tone="tint" motion="w:200ms" />
      <Bust at="translate(132 112) scale(.92)" tone="warm" motion="w:380ms" />
      <Bust at="translate(172 112) scale(.96)" tone="tint" motion="w:560ms" />
      <Bust at="translate(208 112) scale(.72)" tone="warm" motion="w:740ms" />
      <Ranges
        y={126}
        tracks={[76, 116, 156, 192]}
        bands={[
          [84, 15],
          [120, 19],
          [166, 13],
          [196, 21],
        ]}
        dots={[91, 132, 172, 203]}
        delay={1000}
      />
      <Doctor
        x={38}
        y={118}
        arm={-100}
        motion="k:vignette-swing;r:12deg;t:900ms;n:2;w:200ms;e:ease-in-out"
      />
    </Stage>
  );
}

export function DoctorSummaryArt() {
  return (
    <Stage>
      <path className="vg-ground" d="M12 132h216" />
      <rect className="vg-paper" x="30" y="74" width="52" height="14" rx="2" />
      <g transform="translate(118 50) rotate(-4)">
        <g className="vg-cue" style={cue("x:-88px;f:1;w:1000ms")}>
          <g className="vg-cue" style={cue("y:30px;t:800ms")}>
            <use href="#vg-sheet" className="vg-paper" />
            <path className="vg-rule" d="M8 12h24M8 21h18M8 30h24M8 39h14" />
          </g>
        </g>
      </g>
      <rect className="vg-paper" x="20" y="84" width="72" height="44" rx="6" />
      <path className="vg-ink" d="M32 96h48" />
      <circle className="vg-brand" cx="80" cy="115" r="3" />
      <Doctor x={196} arm={-60} flip motion="r:30deg;f:1;t:500ms;w:1300ms" />
    </Stage>
  );
}

export function QuestionsArt() {
  return (
    <Stage>
      <path className="vg-ground" d="M12 132h216" />
      <g className="vg-cue vg-pop" style={cue("s:0;o:left bottom;t:500ms")}>
        <path
          className="vg-paper"
          d="M32 26h88a12 12 0 0 1 12 12v28a12 12 0 0 1-12 12H48l-18 12 4-12h-2a12 12 0 0 1-12-12V38a12 12 0 0 1 12-12Z"
        />
        <path className="vg-accent" d="M36 44q0-7 7-7t7 7c0 5-7 5-7 10" />
        <circle className="vg-brand" cx="43" cy="62" r="2.2" />
      </g>
      <path
        className="vg-rule vg-draw"
        pathLength={1}
        style={cue("w:500ms;t:450ms")}
        d="M60 44h56"
      />
      <path
        className="vg-rule vg-draw"
        pathLength={1}
        style={cue("w:750ms;t:450ms")}
        d="M60 54h44"
      />
      <path
        className="vg-rule vg-draw"
        pathLength={1}
        style={cue("w:1000ms;t:450ms")}
        d="M60 64h50"
      />
      <g className="vg-cue vg-pop" style={cue("s:0;o:left bottom;t:500ms;w:1300ms")}>
        <path
          className="vg-paper"
          d="M52 94h56a10 10 0 0 1 10 10v8a10 10 0 0 1-10 10H52a10 10 0 0 1-10-10v-8a10 10 0 0 1 10-10Z"
        />
        <path className="vg-accent" d="M53 104q0-5 5-5t5 5c0 3.5-5 3.5-5 7" />
        <path className="vg-rule" d="M72 108h34" />
      </g>
      <Doctor
        x={190}
        arm={-40}
        flip
        motion="k:vignette-swing;r:-20deg;t:700ms;n:2;w:600ms;e:ease-in-out"
      />
    </Stage>
  );
}

export function SettledArt() {
  return (
    <Stage>
      <path className="vg-ground" d="M12 132h216" />
      {[16, 162].map((x) => (
        <g key={x}>
          <rect className="vg-paper" x={x} y="44" width="62" height="82" rx="6" />
          <rect className="vg-brand" x={x + 9} y="54" width="18" height="6" rx="3" />
          <path className="vg-rule" d={`M${x + 10} 72h40M${x + 10} 86h42M${x + 10} 100h34`} />
        </g>
      ))}
      <path className="vg-alert vg-cue" style={cue("f:1;t:500ms;w:1700ms")} d="M26 86h42" />
      <path
        className="vg-accent vg-draw"
        pathLength={1}
        style={cue("w:400ms;t:900ms")}
        d="M78 64q42-34 84 0"
      />
      <circle
        className="vg-brand vg-cue vg-pop"
        style={cue("s:0;w:300ms;t:400ms")}
        cx="78"
        cy="64"
        r="3.5"
      />
      <circle
        className="vg-brand vg-cue vg-pop"
        style={cue("s:0;w:1250ms;t:400ms")}
        cx="162"
        cy="64"
        r="3.5"
      />
      <Doctor x={120} arm={-130} flip motion="r:60deg;f:1;t:600ms;w:200ms" />
    </Stage>
  );
}

export function EpisodeArt() {
  return (
    <Stage>
      <path className="vg-ground" d="M12 132h216" />
      <path
        className="vg-accent vg-draw"
        pathLength={1}
        style={cue("w:900ms;t:600ms")}
        d="M76 46v-8h140v8"
      />
      {[
        [76, "x:96px;y:-16px;r:14deg"],
        [124, "y:-34px;r:-10deg;w:150ms"],
        [172, "x:-96px;y:-12px;r:-14deg;w:300ms"],
      ].map(([x, motion]) => (
        <g key={x} transform={`translate(${x} 56)`}>
          <g className="vg-cue" style={cue(`t:650ms;${motion}`)}>
            <rect className="vg-paper" width="44" height="60" rx="5" />
            <path className="vg-rule" d="M9 16h26M9 26h18M22 44h14" />
            <circle className="vg-brand" cx="14" cy="44" r="3.5" />
          </g>
        </g>
      ))}
      <Doctor
        x={40}
        arm={-95}
        motion="k:vignette-swing;r:-10deg;t:700ms;n:2;w:300ms;e:ease-in-out"
      />
    </Stage>
  );
}

export function TrendsArt() {
  return (
    <Stage>
      <path className="vg-ground" d="M12 132h216" />
      <rect className="vg-paper" x="14" y="24" width="150" height="96" rx="6" />
      <rect
        className="vg-band vg-cue"
        style={cue("s:1,0;t:600ms")}
        x="24"
        y="40"
        width="130"
        height="26"
        rx="5"
      />
      <path
        className="vg-accent vg-draw"
        pathLength={1}
        style={cue("w:400ms;t:1600ms")}
        d="m32 104 28-12 28 6 28-26 28-10"
      />
      <circle
        className="vg-brand vg-cue vg-pop"
        style={cue("s:0;w:1950ms;t:400ms")}
        cx="144"
        cy="62"
        r="4.5"
      />
      <Doctor x={196} arm={-128} flip motion="r:-40deg;f:1;t:1600ms;w:400ms;e:linear" />
    </Stage>
  );
}
