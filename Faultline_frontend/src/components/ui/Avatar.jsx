const palette = ["#4f46e5","#0891b2","#059669","#d97706","#dc2626","#7c3aed","#db2777"];

function colorFor(initials) {
  const code = initials.charCodeAt(0) + (initials.charCodeAt(1) || 0);
  return palette[code % palette.length];
}

export default function Avatar({ initials, size = "sm", color }) {
  const bg = color || colorFor(initials || "?");
  const sizeClass = size === "lg" ? "w-10 h-10 text-sm" : size === "md" ? "w-8 h-8 text-xs" : "w-7 h-7 text-xs";
  return (
    <span
      className={`inline-flex items-center justify-center rounded-full font-bold text-white flex-shrink-0 ${sizeClass}`}
      style={{ background: bg }}
    >
      {(initials || "?").slice(0, 2)}
    </span>
  );
}
