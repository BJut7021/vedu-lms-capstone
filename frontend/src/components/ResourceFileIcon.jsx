export default function ResourceFileIcon({ format }) {
  return (
    <svg
      role="img"
      aria-label={`Định dạng ${format.label}`}
      viewBox="0 0 38 46"
      className="h-11 w-9 shrink-0 drop-shadow-sm"
    >
      <path
        d="M5 1h19l13 13v26a5 5 0 0 1-5 5H5a4 4 0 0 1-4-4V5a4 4 0 0 1 4-4Z"
        fill={format.color}
      />
      <path
        d="M24 1v10a3 3 0 0 0 3 3h10L24 1Z"
        fill="white"
        fillOpacity=".38"
      />
      <path
        d="M8 19h13M8 23h8"
        stroke="white"
        strokeOpacity=".5"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <text
        x="19"
        y="36"
        textAnchor="middle"
        fontFamily="Arial,sans-serif"
        fontSize={format.label.length > 3 ? 8 : 10}
        fontWeight="700"
        fill="white"
      >
        {format.label}
      </text>
    </svg>
  );
}
