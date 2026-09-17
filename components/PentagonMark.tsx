// The Radaroma mark: a five-axis pentagon — one vertex per score axis.
// Used wherever a brand glyph or an unscored-café placeholder is needed.
export default function PentagonMark({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className}>
      <polygon
        points="12,2 21.5,8.9 17.9,20.1 6.1,20.1 2.5,8.9"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  )
}
