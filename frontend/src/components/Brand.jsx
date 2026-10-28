export default function Brand({ dark = false, compact = false }) {
  return (
    <span className="inline-flex shrink-0 items-center gap-1.5 sm:gap-2">
      <img
        src="/brand/vedu-mark.svg"
        alt=""
        className="h-8 w-8 sm:h-10 sm:w-10"
      />
      {!compact && (
        <span
          className={`text-lg font-extrabold tracking-tight sm:text-2xl ${dark ? "text-white" : "text-slate-900"}`}
        >
          VEDU<span className="text-blue-500">.</span>
        </span>
      )}
    </span>
  );
}
