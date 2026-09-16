import type { OrnamentMotif } from "@/lib/business-types";
import { cn } from "@/lib/utils";

/**
 * Line-art illustration used as the homepage centrepiece.
 *
 * Drawn rather than photographed on purpose: a new business has no imagery on
 * day one, and a stock photo would be both generic and legally awkward. These
 * are pure paths in `currentColor`, so they take the business's brand color
 * and stay crisp at any size — and each industry gets its own, so the same
 * layout doesn't hand a salon a picture of books.
 */

function Books() {
  return (
    <>
      {/* Stack of closed books */}
      <g strokeWidth="5">
        <rect x="58" y="250" width="284" height="34" rx="6" />
        <rect x="76" y="216" width="248" height="32" rx="6" />
        <rect x="94" y="184" width="212" height="30" rx="6" />
      </g>
      {/* Spine details */}
      <g strokeWidth="3.5" opacity="0.65">
        <path d="M88 258 V276" />
        <path d="M100 258 V276" />
        <path d="M106 224 V240" />
        <path d="M118 224 V240" />
        <path d="M124 191 V207" />
      </g>
      {/* Open book resting on top */}
      <g strokeWidth="5">
        <path d="M200 118 C178 104, 140 98, 112 102 L112 168 C140 164, 178 170, 200 184 Z" />
        <path d="M200 118 C222 104, 260 98, 288 102 L288 168 C260 164, 222 170, 200 184 Z" />
        <path d="M200 118 V184" />
      </g>
      {/* Page lines */}
      <g strokeWidth="3" opacity="0.5">
        <path d="M132 120 C150 122, 168 127, 182 135" />
        <path d="M132 142 C150 144, 168 149, 182 157" />
        <path d="M268 120 C250 122, 232 127, 218 135" />
        <path d="M268 142 C250 144, 232 149, 218 157" />
      </g>
    </>
  );
}

function Dining() {
  return (
    <>
      <g strokeWidth="5">
        <circle cx="200" cy="190" r="86" />
        <circle cx="200" cy="190" r="62" opacity="0.5" />
        {/* Fork */}
        <path d="M96 96 V146 C96 158, 104 166, 114 168 L114 292" />
        <path d="M110 96 V138" opacity="0.6" />
        <path d="M124 96 V138" opacity="0.6" />
        {/* Knife */}
        <path d="M300 96 C314 118, 314 152, 300 168 L300 292" />
      </g>
      <g strokeWidth="3.5" opacity="0.55">
        <path d="M176 176 C186 166, 214 166, 224 176" />
      </g>
    </>
  );
}

function Cup() {
  return (
    <>
      <g strokeWidth="5">
        <path d="M108 168 H286 V212 C286 254, 254 284, 214 284 H180 C140 284, 108 254, 108 212 Z" />
        <path d="M286 186 H310 C330 186, 344 200, 344 218 C344 238, 330 250, 310 250 H286" />
        <path d="M74 300 H320" />
      </g>
      {/* Steam */}
      <g strokeWidth="4" opacity="0.6">
        <path d="M160 132 C172 118, 148 104, 160 88" />
        <path d="M200 126 C212 112, 188 98, 200 82" />
        <path d="M240 132 C252 118, 228 104, 240 88" />
      </g>
    </>
  );
}

function Shears() {
  return (
    <>
      <g strokeWidth="5">
        <circle cx="132" cy="268" r="30" />
        <circle cx="236" cy="268" r="30" />
        <path d="M150 246 L276 96" />
        <path d="M218 246 L92 96" />
        {/* Comb */}
        <path d="M296 180 H352 V300 H296 Z" opacity="0.75" />
      </g>
      <g strokeWidth="3.5" opacity="0.5">
        <path d="M310 192 V288" />
        <path d="M324 192 V288" />
        <path d="M338 192 V288" />
      </g>
    </>
  );
}

function Bloom() {
  return (
    <>
      <g strokeWidth="5">
        <circle cx="200" cy="146" r="34" />
        <path d="M200 112 C176 76, 214 52, 200 28" opacity="0" />
        {[0, 60, 120, 180, 240, 300].map((deg) => (
          <ellipse
            key={deg}
            cx="200"
            cy="92"
            rx="26"
            ry="46"
            transform={`rotate(${deg} 200 146)`}
          />
        ))}
        <path d="M200 180 V296" />
      </g>
      <g strokeWidth="4.5" opacity="0.8">
        <path d="M200 232 C168 226, 146 244, 142 268 C172 274, 194 258, 200 232 Z" />
        <path d="M200 256 C232 250, 254 268, 258 292 C228 298, 206 282, 200 256 Z" />
      </g>
    </>
  );
}

function Barbell() {
  return (
    <>
      <g strokeWidth="5">
        <path d="M120 190 H280" />
        <rect x="88" y="150" width="34" height="80" rx="8" />
        <rect x="278" y="150" width="34" height="80" rx="8" />
        <rect x="56" y="168" width="28" height="44" rx="8" opacity="0.7" />
        <rect x="316" y="168" width="28" height="44" rx="8" opacity="0.7" />
      </g>
      {/* Laurel */}
      <g strokeWidth="4" opacity="0.6">
        <path d="M128 268 C160 248, 240 248, 272 268" />
        <path d="M148 262 C150 248, 160 240, 172 238" />
        <path d="M200 252 C202 238, 210 230, 222 228" />
        <path d="M252 262 C250 248, 240 240, 228 238" />
      </g>
    </>
  );
}

function Bag() {
  return (
    <>
      <g strokeWidth="5">
        <path d="M96 150 H304 L286 300 H114 Z" />
        <path d="M156 150 V116 C156 88, 176 70, 200 70 C224 70, 244 88, 244 116 V150" />
      </g>
      <g strokeWidth="4" opacity="0.55">
        <path d="M140 196 H260" />
        <path d="M148 236 H252" />
      </g>
    </>
  );
}

const MOTIFS: Record<OrnamentMotif, () => React.JSX.Element> = {
  books: Books,
  dining: Dining,
  cup: Cup,
  shears: Shears,
  bloom: Bloom,
  barbell: Barbell,
  bag: Bag,
};

export function Ornament({
  motif,
  className,
}: {
  motif: OrnamentMotif;
  className?: string;
}) {
  const Motif = MOTIFS[motif] ?? Books;
  return (
    <svg
      viewBox="0 0 400 340"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className={cn("h-auto w-full", className)}
    >
      <Motif />
    </svg>
  );
}

/** Small symmetrical divider — a diamond between two fading rules. Industry
 * neutral, used to break up long stretches of copy. */
export function Flourish({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center justify-center gap-3", className)} aria-hidden>
      <span className="rule-fade h-px w-16 sm:w-24" />
      <svg viewBox="0 0 24 24" className="size-3 text-brand" fill="none" stroke="currentColor">
        <path d="M12 2 L20 12 L12 22 L4 12 Z" strokeWidth="1.5" />
      </svg>
      <span className="rule-fade h-px w-16 sm:w-24" />
    </div>
  );
}
