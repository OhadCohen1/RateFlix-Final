import { useState } from 'react';
import { MAX_STARS } from '../theme';

interface StarRatingProps {
  /** Current value (user's rating or average) */
  value: number;
  /** When provided, the stars are interactive */
  onChange?: (score: number) => void;
  disabled?: boolean;
}

const StarRating = ({ value, onChange, disabled = false }: StarRatingProps) => {
  const [hovered, setHovered] = useState(0);
  const interactive = Boolean(onChange) && !disabled;
  const displayed = hovered || value;

  return (
    <div className="flex items-center gap-0.5" dir="ltr" role="radiogroup" aria-label="דירוג">
      {Array.from({ length: MAX_STARS }, (_, i) => {
        const score = i + 1;
        const filled = score <= displayed;
        return (
          <button
            key={score}
            type="button"
            role="radio"
            aria-checked={score === value}
            aria-label={`${score} כוכבים`}
            disabled={!interactive}
            onClick={() => onChange?.(score)}
            onMouseEnter={() => interactive && setHovered(score)}
            onMouseLeave={() => interactive && setHovered(0)}
            className={`text-xl leading-none transition-transform ${
              interactive ? 'cursor-pointer hover:scale-125' : 'cursor-default'
            } ${filled ? 'text-amber-400' : 'text-surface-700'}`}
          >
            ★
          </button>
        );
      })}
    </div>
  );
};

export default StarRating;
