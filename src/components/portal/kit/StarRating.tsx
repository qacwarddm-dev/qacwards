"use client";

import { Star } from "lucide-react";

/**
 * Five-star rating, shared by the QAC Feedback list (read-only, supports half
 * fills for an averaged score) and the Program Rep service-evaluation form
 * (interactive, whole stars only — a single respondent can't give half a
 * star). One component so the fill geometry can't drift between the two.
 */
export default function StarRating({
  value,
  onChange,
  size = 20,
}: {
  /** 0-5, half-steps allowed in read-only mode. */
  value: number;
  /** Present -> interactive; omitted -> read-only display. */
  onChange?: (value: number) => void;
  size?: number;
}) {
  const stars = [1, 2, 3, 4, 5];

  if (!onChange) {
    return (
      <span className="inline-flex items-center gap-[4px]" role="img" aria-label={`${value} out of 5 stars`}>
        {stars.map((n) => {
          const fill = Math.max(0, Math.min(1, value - (n - 1)));
          return (
            <span key={n} className="relative inline-block" style={{ width: size, height: size }}>
              <Star
                className="absolute inset-0 text-[color:var(--color-gray)]/40"
                width={size}
                height={size}
                strokeWidth={1.5}
              />
              {fill > 0 && (
                <span
                  className="absolute inset-0 overflow-hidden"
                  style={{ width: `${fill * 100}%` }}
                >
                  <Star
                    className="fill-yellow text-yellow"
                    width={size}
                    height={size}
                    strokeWidth={1.5}
                  />
                </span>
              )}
            </span>
          );
        })}
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-[4px]">
      {stars.map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          aria-label={`Rate ${n} out of 5`}
          aria-pressed={value >= n}
          className="transition-transform hover:scale-110"
        >
          <Star
            width={size}
            height={size}
            strokeWidth={1.5}
            className={value >= n ? "fill-yellow text-yellow" : "text-[color:var(--color-gray)]/40"}
          />
        </button>
      ))}
    </span>
  );
}
