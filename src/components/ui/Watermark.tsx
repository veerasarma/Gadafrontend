import clsx from "clsx";

type Props = {
  /** Optional logo; if omitted we render the text fallback */
  src?: string;
  /** Shown when src is not provided */
  text?: string;
  /** Approx max height on large screens (px). Mobile scales down automatically. */
  size?: number; // default 22
  /** 0..1 opacity */
  opacity?: number; // default 0.45
  /** bottom-right | top-right | bottom-left | top-left */
  position?: "br" | "tr" | "bl" | "tl";
  className?: string;
};

export default function Watermark({
  src,
  text = "GADA",
  size = 22,
  opacity = 0.45,
  position = "br",
  className,
}: Props) {
  const pos = {
    br: "bottom-2 right-2",
    tr: "top-2 right-2",
    bl: "bottom-2 left-2",
    tl: "top-2 left-2",
  }[position];

  return (
    <div
      className={clsx(
        "pointer-events-none select-none absolute z-10",
        pos,
        className
      )}
      aria-hidden="true"
    >
      {src ? (
        <img
          src={src}
          alt=""
          style={{
            // Small, responsive height. Example: 16–22 px depending on viewport.
            height: `clamp(14px, 3.5vw, ${size}px)`,
            opacity,
          }}
          className="block [filter:drop-shadow(0_1px_1px_rgba(0,0,0,.35))] mix-blend-soft-light"
        />
      ) : (
        <span
          className="font-semibold tracking-wide text-white mix-blend-soft-light
                     [filter:drop-shadow(0_1px_1px_rgba(0,0,0,.35))]"
          style={{
            fontSize: "clamp(10px, 2.8vw, 12px)",
            opacity,
          }}
        >
          {text}
        </span>
      )}
    </div>
  );
}
