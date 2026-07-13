import type { Item } from '../types';
import StarRating from './StarRating';

interface MovieCardProps {
  item: Item;
  /** הציון שהמשתמש נתן לסרט (אם יש) */
  userScore?: number;
  /** אם נשלח handler, הכוכבים לחיצים */
  onRate?: (itemId: string, score: number) => void;
  /** אם נשלח handler, מציגים גם הסרת דירוג */
  onDeleteRating?: (itemId: string) => void;
  /** מצב לב למועדפים + toggle */
  isFavorite?: boolean;
  onToggleFavorite?: (itemId: string, next: boolean) => void;
}

const MovieCard = ({
  item,
  userScore,
  onRate,
  onDeleteRating,
  isFavorite = false,
  onToggleFavorite,
}: MovieCardProps) => {
  return (
    <article className="flex flex-col overflow-hidden rounded-xl border border-surface-700 bg-surface-900 transition-transform hover:-translate-y-1 hover:border-surface-700/80">
      {/* Poster */}
      <div className="relative aspect-2/3 w-full bg-surface-800">
        {item.imageUrl ? (
          <img
            src={item.imageUrl}
            alt={`פוסטר של ${item.name}`}
            className="h-full w-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-linear-to-br from-surface-800 to-surface-950">
            <span className="text-5xl font-black text-surface-700">{item.name.charAt(0)}</span>
          </div>
        )}

        {item.predictedScore !== undefined && (
          <span className="absolute top-2 right-2 rounded-full bg-brand-500 px-2.5 py-1 text-xs font-bold text-white shadow">
            ניבוי {item.predictedScore.toFixed(1)} ★
          </span>
        )}

        {onToggleFavorite && (
          <button
            type="button"
            onClick={() => onToggleFavorite(item.id, !isFavorite)}
            aria-label={isFavorite ? 'הסרה מהמועדפים' : 'הוספה למועדפים'}
            className="absolute top-2 left-2 rounded-full bg-surface-950/70 p-1.5 text-lg leading-none backdrop-blur transition-transform hover:scale-110"
          >
            {isFavorite ? '❤️' : '🤍'}
          </button>
        )}
      </div>

      {/* Details */}
      <div className="flex flex-1 flex-col gap-2 p-4">
        <div className="flex items-baseline justify-between gap-2">
          <h3 className="text-lg font-bold text-zinc-50">{item.name}</h3>
          {(item.year || item.categoryName) && (
            <span className="shrink-0 text-sm text-zinc-500">
              {[item.year, item.categoryName].filter(Boolean).join(' • ')}
            </span>
          )}
        </div>

        {item.ratingCount > 0 && (
          <div className="flex items-center gap-2 text-sm">
            <span className="font-semibold text-amber-400">★ {item.avgRating.toFixed(1)}</span>
            <span className="text-zinc-500">({item.ratingCount} דירוגים)</span>
          </div>
        )}

        {item.description && (
          <p className="line-clamp-3 text-sm leading-relaxed text-zinc-400">{item.description}</p>
        )}

        {item.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {item.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-surface-800 px-2 py-0.5 text-xs text-zinc-300"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {(onRate || userScore) && (
          <div className="mt-auto flex items-center justify-between pt-2">
            <div className="flex items-center gap-2">
              <span className="text-xs text-zinc-500">הדירוג שלי:</span>
              <StarRating
                value={userScore ?? 0}
                onChange={onRate ? (score) => onRate(item.id, score) : undefined}
              />
            </div>
            {userScore && onDeleteRating && (
              <button
                type="button"
                onClick={() => onDeleteRating(item.id)}
                className="text-xs text-zinc-600 transition-colors hover:text-brand-400"
              >
                הסר דירוג
              </button>
            )}
          </div>
        )}
      </div>
    </article>
  );
};

export default MovieCard;
