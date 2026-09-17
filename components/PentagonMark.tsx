// The Radaroma mark: a five-axis pentagon with a filled shape inside —
// one vertex per score axis. Used for the wordmark's "o", the concierge
// header, and as the unscored-café placeholder.
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
      <polygon
        points="12,6.8 17.4,10.7 15.3,17.2 8.7,17.2 6.6,10.7"
        fill="currentColor"
        opacity="0.85"
      />
    </svg>
  )
}
