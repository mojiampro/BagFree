const STAR_PATH =
  "M12 2.5l2.94 5.96 6.56.95-4.75 4.63 1.12 6.54L12 17.5l-5.87 3.08 1.12-6.54L2.5 9.41l6.56-.95L12 2.5z";

/** One star filled from 0 (empty) to 1 (full); 0.5 renders a half star. */
export function StarShape({ fill, size = 20 }: { fill: number; size?: number }) {
  const percent = Math.max(0, Math.min(1, fill)) * 100;
  return (
    <span className="relative inline-block shrink-0" style={{ width: size, height: size }}>
      <svg viewBox="0 0 24 24" width={size} height={size} className="absolute inset-0 text-line" aria-hidden="true">
        <path d={STAR_PATH} fill="currentColor" />
      </svg>
      <span className="absolute inset-0 overflow-hidden" style={{ width: `${percent}%` }}>
        <svg viewBox="0 0 24 24" width={size} height={size} className="text-star" aria-hidden="true">
          <path d={STAR_PATH} fill="currentColor" />
        </svg>
      </span>
    </span>
  );
}

export function StarDisplay({ rating, size = 18 }: { rating: number; size?: number }) {
  return (
    <span className="inline-flex items-center gap-0.5" role="img" aria-label={`${rating} จาก 5 ดาว`}>
      {[0, 1, 2, 3, 4].map((index) => (
        <StarShape key={index} fill={rating - index} size={size} />
      ))}
    </span>
  );
}
