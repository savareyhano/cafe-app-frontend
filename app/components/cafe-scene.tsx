import { CAFE_NAME } from "~/lib/config";
import { cn } from "~/lib/utils";

/*
 * Full-screen looping café for the staff sign-in: three customers queue, step up to the counter,
 * take a cup from the barista and walk off, then come round again. One 12 s cycle; the customers
 * share it a third apart, so the queue always moves and the loop has no seam. The barista's 4 s
 * cycle hands a cup over at the exact moment each customer reaches the counter.
 *
 * The room is drawn at 1440×900. The counter and people are drawn in their own small units
 * (floor at y=300) and scaled into the room as one group.
 */

const CYCLE = 12; // seconds, one customer's full trip
const WALKS: [number, number][] = [
  [0, 8], // off-screen → back of the queue
  [33, 41], // → middle
  [66, 74], // → counter
  [92, 100], // → out past the right edge
];
const STOPS = { off: -60, back: 80, middle: 165, counter: 262, out: 920 };

/** Keyframes that wiggle only while walking: legs swing and the body bobs, standing still otherwise. */
function walkingKeyframes(name: string, at: (step: number) => string, rest: string) {
  const frames: string[] = [];
  for (let p = 0; p <= 100; p++) {
    const walking = WALKS.some(([a, b]) => p > a && p < b);
    frames.push(`${p}%{transform:${walking ? at(p) : rest}}`);
  }
  return `@keyframes ${name}{${frames.join("")}}`;
}

const CSS = `
@keyframes cs-path{
  0%{transform:translate(${STOPS.off}px,300px)}
  8%,33%{transform:translate(${STOPS.back}px,300px)}
  41%,66%{transform:translate(${STOPS.middle}px,300px)}
  74%,92%{transform:translate(${STOPS.counter}px,300px)}
  100%{transform:translate(${STOPS.out}px,300px)}
}
${walkingKeyframes("cs-leg-a", (p) => `rotate(${p % 2 ? 16 : -16}deg)`, "rotate(0deg)")}
${walkingKeyframes("cs-leg-b", (p) => `rotate(${p % 2 ? -16 : 16}deg)`, "rotate(0deg)")}
${walkingKeyframes("cs-bob", (p) => `translateY(${p % 2 ? -2.5 : 0}px)`, "translateY(0px)")}
@keyframes cs-cup{0%,84%{opacity:0}86%,100%{opacity:1}}
@keyframes cs-arm{0%,25%{transform:rotate(-55deg)}42%,60%{transform:rotate(78deg)}75%,100%{transform:rotate(8deg)}}
@keyframes cs-counter-cup{0%,40%{opacity:0}44%,55%{opacity:1}56%,100%{opacity:0}}
@keyframes cs-steam{0%{opacity:0;transform:translateY(4px)}40%{opacity:.75}100%{opacity:0;transform:translateY(-14px)}}
@keyframes cs-lamp{0%,100%{transform:rotate(-2deg)}50%{transform:rotate(2deg)}}
@keyframes cs-breathe{0%,100%{transform:translateY(0)}50%{transform:translateY(-1.5px)}}

.cs-cust{animation:cs-path ${CYCLE}s linear infinite}
.cs-cust .cs-body{animation:cs-bob ${CYCLE}s linear infinite;animation-delay:inherit}
.cs-cust .cs-leg-a,.cs-cust .cs-leg-b{transform-box:fill-box;transform-origin:50% 0}
.cs-cust .cs-leg-a{animation:cs-leg-a ${CYCLE}s linear infinite;animation-delay:inherit}
.cs-cust .cs-leg-b{animation:cs-leg-b ${CYCLE}s linear infinite;animation-delay:inherit}
.cs-cust .cs-cup{opacity:0;animation:cs-cup ${CYCLE}s steps(1,end) infinite;animation-delay:inherit}
.cs-c2{animation-delay:-${CYCLE / 3}s}
.cs-c3{animation-delay:-${(CYCLE * 2) / 3}s}
.cs-arm{transform-box:fill-box;transform-origin:50% 8%;animation:cs-arm ${CYCLE / 3}s ease-in-out infinite}
.cs-counter-cup{opacity:0;animation:cs-counter-cup ${CYCLE / 3}s steps(1,end) infinite}
.cs-barista{animation:cs-breathe 3s ease-in-out infinite}
.cs-steam path{animation:cs-steam 2.4s ease-out infinite}
.cs-steam path:nth-child(2){animation-delay:.8s}
.cs-steam path:nth-child(3){animation-delay:1.6s}
.cs-lamp{transform-box:fill-box;transform-origin:50% 0;animation:cs-lamp 6s ease-in-out infinite}

/* Order-status poses of the barista: brewing at the machine, serving, waving goodbye, resting */
@keyframes cs-arm-brew{0%,100%{transform:rotate(-62deg)}50%{transform:rotate(-38deg)}}
@keyframes cs-arm-wave{0%,100%{transform:rotate(150deg)}50%{transform:rotate(118deg)}}
.cs-arm.cs-brew{animation:cs-arm-brew 1.6s ease-in-out infinite}
.cs-arm.cs-serve{animation:none;transform:rotate(78deg)}
.cs-arm.cs-wave{animation:cs-arm-wave 1.1s ease-in-out infinite}
.cs-arm.cs-rest{animation:none;transform:rotate(8deg)}

/* Reduced motion: the room holds still, with the queue drawn in place */
@media (prefers-reduced-motion: reduce){.cs-scene *{animation:none!important}.cs-scene .cs-cup,.cs-scene .cs-counter-cup{opacity:0}}
`;

const C = {
  cream: "#F4EEDF",
  creamDeep: "#E9DFC8",
  wainscot: "#DCE2CC",
  seam: "#C9D2B5",
  sage: "#A3B18A",
  sageDeep: "#8A9A70",
  forest: "#2F4A2E",
  wood: "#C9A57A",
  woodDeep: "#A9845A",
  ink: "#2B2B28",
  lamp: "#F6D89C",
  cup: "#FFFBF2",
};

type Look = { skin: string; hair: string; shirt: string; sleeve: string; hairShape: "short" | "bun" | "cap" };

function Customer({ look, className, x }: { look: Look; className: string; x: number }) {
  return (
    // The transform attribute is the still pose; the CSS animation takes over when motion is allowed
    <g className={cn("cs-cust", className)} transform={`translate(${x} 300)`}>
      <g className="cs-body">
        <rect className="cs-leg-a" x={-10} y={-42} width={9} height={42} rx={4.5} fill={C.ink} />
        <rect className="cs-leg-b" x={1} y={-42} width={9} height={42} rx={4.5} fill="#3F3F3A" />
        <rect x={-18} y={-92} width={36} height={56} rx={15} fill={look.shirt} />
        <rect x={4} y={-84} width={9} height={36} rx={4.5} fill={look.sleeve} />
        <g className="cs-cup">
          <rect x={9} y={-56} width={14} height={16} rx={3.5} fill={C.cup} stroke={C.forest} strokeWidth={1.5} />
          <rect x={9} y={-52} width={14} height={4} fill={C.sage} />
        </g>
        <circle cx={0} cy={-108} r={16} fill={look.skin} />
        {look.hairShape === "short" && <path d="M-16 -110 a16 16 0 0 1 32 -2 q-8 -6 -16 -4 q-9 -4 -16 6z" fill={look.hair} />}
        {look.hairShape === "bun" && (
          <>
            <path d="M-16 -106 a16 16 0 0 1 30 -8 q-10 -2 -18 2 q-7 2 -12 6z" fill={look.hair} />
            <circle cx={-12} cy={-122} r={7} fill={look.hair} />
          </>
        )}
        {look.hairShape === "cap" && (
          <>
            <path d="M-16 -111 a16 16 0 0 1 32 0z" fill={look.hair} />
            <rect x={8} y={-113} width={14} height={4} rx={2} fill={look.hair} />
          </>
        )}
        <circle cx={9} cy={-108} r={1.8} fill={C.ink} />
        <path d="M8 -100 q3 2 6 0" stroke={C.ink} strokeWidth={1.4} fill="none" strokeLinecap="round" />
      </g>
    </g>
  );
}

const Steam = ({ x, y }: { x: number; y: number }) => (
  <g className="cs-steam" transform={`translate(${x} ${y})`} fill="none" stroke="#FFFFFF" strokeWidth={2.2} strokeLinecap="round">
    <path d="M-4 0 q-4 -6 0 -12 q4 -6 0 -12" />
    <path d="M2 0 q-4 -6 0 -12 q4 -6 0 -12" />
    <path d="M8 0 q-4 -6 0 -12 q4 -6 0 -12" />
  </g>
);

/** A pendant lamp with its pool of warm light; `delay` staggers the sway so they don't move in step. */
const Lamp = ({ x, drop, delay }: { x: number; drop: number; delay: number }) => (
  <>
    <ellipse cx={x} cy={drop + 70} rx={150} ry={80} fill={C.lamp} opacity={0.22} />
    <g className="cs-lamp" style={{ animationDelay: `${delay}s` }}>
      <line x1={x} y1={0} x2={x} y2={drop} stroke={C.forest} strokeWidth={3} />
      <path d={`M${x - 34} ${drop + 30} a34 34 0 0 1 68 0z`} fill={C.sage} />
      <circle cx={x} cy={drop + 33} r={8} fill={C.lamp} />
    </g>
  </>
);

/** Wooden sign over the bar with the café's name (VITE_CAFE_NAME), in the brand face. */
function NameSign() {
  const x = 637; // centre of the bar in room units
  const w = 330;
  const h = 100;
  const y = 236;
  // Long names shrink to stay inside the board
  const size = Math.min(60, (w - 60) / (CAFE_NAME.length * 0.56));
  return (
    <g>
      {[x - w / 2 + 44, x + w / 2 - 44].map((sx) => (
        <line key={sx} x1={sx} y1={0} x2={sx} y2={y + 6} stroke={C.forest} strokeWidth={3} />
      ))}
      <rect x={x - w / 2} y={y} width={w} height={h} rx={20} fill="#7E5535" />
      <rect x={x - w / 2 + 9} y={y + 9} width={w - 18} height={h - 18} rx={13} fill="none" stroke={C.wood} strokeWidth={3} />
      <text
        x={x}
        y={y + h / 2 + 2}
        textAnchor="middle"
        dominantBaseline="central"
        fontFamily='"Fraunces", Georgia, serif'
        fontWeight={600}
        fontSize={size}
        fill={C.cream}
      >
        {CAFE_NAME}
      </text>
    </g>
  );
}

/** Small round café table with two stools, standing on the floor at `x`. */
const Table = ({ x }: { x: number }) => (
  <g>
    <rect x={x - 70} y={700} width={22} height={60} rx={6} fill={C.woodDeep} />
    <rect x={x + 48} y={700} width={22} height={60} rx={6} fill={C.woodDeep} />
    <rect x={x - 80} y={690} width={42} height={12} rx={6} fill={C.wood} />
    <rect x={x + 38} y={690} width={42} height={12} rx={6} fill={C.wood} />
    <rect x={x - 5} y={640} width={10} height={120} fill={C.forest} />
    <ellipse cx={x} cy={636} rx={60} ry={10} fill={C.wood} />
    <rect x={x - 12} y={618} width={18} height={18} rx={4} fill={C.cup} stroke={C.forest} strokeWidth={2} />
  </g>
);

/** The barista behind the counter. `pose` picks an order-status arm; without it the arm runs the room's serving loop. */
function Barista({ pose }: { pose?: "brew" | "serve" | "wave" | "rest" }) {
  return (
    <g className="cs-barista">
      <rect x={382} y={168} width={40} height={60} rx={16} fill={C.cup} />
      <rect x={388} y={180} width={28} height={48} rx={8} fill={C.sage} />
      <circle cx={402} cy={150} r={16} fill="#C68B63" />
      <path d="M386 148 a16 16 0 0 1 32 -2 q-8 -8 -18 -6 q-8 0 -14 8z" fill="#2A211B" />
      <circle cx={394} cy={150} r={1.8} fill={C.ink} />
      <path d="M391 158 q3 2 6 0" stroke={C.ink} strokeWidth={1.4} fill="none" strokeLinecap="round" />
      <g className={cn("cs-arm", pose && `cs-${pose}`)}>
        <rect x={381} y={176} width={10} height={40} rx={5} fill={C.cup} />
        <circle cx={386} cy={216} r={5.5} fill="#C68B63" />
      </g>
    </g>
  );
}

/** Counter and espresso machine; the machine steams while it's brewing. */
function Bar({ steaming = true }: { steaming?: boolean }) {
  return (
    <>
      <rect x={290} y={215} width={190} height={12} rx={4} fill={C.sage} />
      <rect x={296} y={227} width={184} height={73} fill={C.forest} />
      <rect x={310} y={240} width={150} height={4} rx={2} fill={C.sageDeep} opacity={0.5} />
      <rect x={430} y={168} width={40} height={47} rx={8} fill="#5B5F57" />
      <rect x={438} y={178} width={24} height={8} rx={3} fill={C.sage} />
      <rect x={447} y={190} width={6} height={8} fill="#3D403A" />
      <rect x={443} y={202} width={14} height={13} rx={3} fill={C.cup} />
      {steaming && <Steam x={446} y={198} />}
    </>
  );
}

export type StatusPose = "waiting" | "brewing" | "ready" | "done";

/**
 * The same barista at the same counter, for the order-status page: waiting for payment, brewing
 * at the machine, serving a steaming cup on the counter, then waving goodbye.
 */
export function StatusScene({ pose, className }: { pose: StatusPose; className?: string }) {
  const arm = { waiting: "rest", brewing: "brew", ready: "serve", done: "wave" } as const;
  return (
    <div className={cn("cs-scene overflow-hidden rounded-2xl", className)} aria-hidden>
      <style>{CSS}</style>
      <svg viewBox="270 92 230 158" className="block h-auto w-full">
        <rect x={270} y={92} width={230} height={158} fill={C.cream} />
        <ellipse cx={340} cy={110} rx={70} ry={34} fill={C.lamp} opacity={0.3} />
        <rect x={300} y={118} width={60} height={5} rx={2.5} fill={C.forest} />
        {[306, 324, 342].map((x, i) => (
          <rect key={x} x={x} y={105} width={12} height={13} rx={3} fill={i % 2 ? C.sage : C.cup} />
        ))}
        <Barista pose={arm[pose]} />
        <Bar steaming={pose === "brewing"} />
        {pose === "ready" && (
          <g>
            <rect x={300} y={197} width={16} height={18} rx={4} fill={C.cup} stroke={C.forest} strokeWidth={1.5} />
            <rect x={300} y={201} width={16} height={4} fill={C.sage} />
            <Steam x={304} y={194} />
          </g>
        )}
      </svg>
    </div>
  );
}

export function CafeRoom({ className }: { className?: string }) {
  return (
    <div className={cn("cs-scene [container-type:size]", className)} aria-hidden>
      <style>{CSS}</style>
      {/* Wide screens: slice fills the screen and crops the sides evenly. Below lg the room is drawn
          at full height and slid so the queue, counter and barista (room x≈300–720) stay in view. */}
      <svg
        viewBox="0 0 1440 900"
        preserveAspectRatio="xMidYMax slice"
        className="block size-full max-lg:absolute max-lg:bottom-0 max-lg:left-[calc(50cqw-56cqh)] max-lg:h-[100cqh] max-lg:w-[160cqh] max-lg:max-w-none"
      >
        {/* Room: cream plaster, sage wainscot with panel seams, then the floor */}
        <rect width={1440} height={900} fill={C.cream} />
        <rect y={560} width={1440} height={200} fill={C.wainscot} />
        <rect y={552} width={1440} height={10} fill={C.sage} />
        {Array.from({ length: 12 }, (_, i) => (
          <rect key={i} x={i * 120 + 16} y={584} width={88} height={150} rx={10} fill="none" stroke={C.seam} strokeWidth={3} />
        ))}
        <rect y={760} width={1440} height={140} fill={C.creamDeep} />
        <rect y={760} width={1440} height={6} fill="#DCCFB2" />

        {/* Windows */}
        {[90, 1160].map((x) => (
          <g key={x}>
            <rect x={x} y={170} width={210} height={230} rx={22} fill="#DCE4CD" stroke={C.forest} strokeWidth={8} />
            <line x1={x + 105} y1={170} x2={x + 105} y2={400} stroke={C.forest} strokeWidth={6} />
            <line x1={x} y1={285} x2={x + 210} y2={285} stroke={C.forest} strokeWidth={6} />
          </g>
        ))}

        <Lamp x={330} drop={110} delay={0} />
        <Lamp x={470} drop={150} delay={-2} />
        <NameSign />
        <Lamp x={900} drop={110} delay={-4} />
        <Lamp x={1300} drop={140} delay={-1} />

        {/* Plants at both ends of the room */}
        {[60, 1370].map((x) => (
          <g key={x}>
            <rect x={x - 24} y={690} width={48} height={70} rx={10} fill={C.wood} />
            <ellipse cx={x - 14} cy={664} rx={16} ry={32} fill={C.sageDeep} transform={`rotate(-22 ${x - 14} 664)`} />
            <ellipse cx={x + 16} cy={660} rx={16} ry={34} fill={C.sage} transform={`rotate(20 ${x + 16} 660)`} />
            <ellipse cx={x} cy={648} rx={13} ry={34} fill={C.forest} />
          </g>
        ))}
        <Table x={1050} />

        {/* The bar, its staff and the queue, drawn in their own units and scaled into the room */}
        <g transform="translate(40 295) scale(1.55)">
          {/* Cup shelf behind the bar */}
          <rect x={300} y={96} width={160} height={6} rx={3} fill={C.forest} />
          {[312, 336, 360, 412, 436].map((x, i) => (
            <rect key={x} x={x} y={80} width={16} height={16} rx={4} fill={i % 2 ? C.sage : C.cup} />
          ))}
          <rect x={384} y={74} width={20} height={22} rx={4} fill={C.wood} />

          <Barista />
          <Bar />
          {/* The cup being handed over */}
          <g className="cs-counter-cup">
            <rect x={296} y={199} width={14} height={16} rx={3.5} fill={C.cup} stroke={C.forest} strokeWidth={1.5} />
            <Steam x={299} y={196} />
          </g>

          {/* Queue */}
          <Customer className="cs-c3" x={STOPS.back} look={{ skin: "#E9BC94", hair: "#7A4A2A", shirt: "#D9A441", sleeve: "#C58F2F", hairShape: "bun" }} />
          <Customer className="cs-c2" x={STOPS.middle} look={{ skin: "#8D5A3B", hair: C.forest, shirt: "#C47F5A", sleeve: "#AE6A47", hairShape: "cap" }} />
          <Customer className="cs-c1" x={STOPS.counter} look={{ skin: "#F1C9A5", hair: "#1F1B18", shirt: C.sageDeep, sleeve: "#76875D", hairShape: "short" }} />
        </g>
      </svg>
    </div>
  );
}
