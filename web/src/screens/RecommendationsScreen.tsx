import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import MovieCard from '../components/MovieCard';
import { fetchRecommendations } from '../services/movieService';
import { getApiErrorMessage } from '../utils/errors';
import type { Item } from '../types';
import { MAX_STARS } from '../theme';

/** ממיר ציון חזוי לאחוז התאמה */
const matchPercent = (item: Item): number =>
  Math.round(((item.predictedScore ?? item.avgRating) / MAX_STARS) * 100);

const RecommendationsScreen = () => {
  const [items, setItems] = useState<Item[]>([]);
  const [source, setSource] = useState<'knn' | 'popular' | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const result = await fetchRecommendations();
        setItems(result.items);
        setSource(result.source);
      } catch (err) {
        setError(getApiErrorMessage(err));
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, []);

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="mb-2 text-3xl font-black text-zinc-50">המלצות בשבילך</h1>
      <p className="mb-4 text-zinc-400">מבוסס אלגוריתם KNN</p>

      {/* איך זה עובד בקצרה */}
      <div className="mb-6 rounded-xl border-r-4 border-amber-500 bg-surface-900 p-4">
        <h2 className="mb-1 font-bold text-amber-400">🧠 איך עובד ה-KNN?</h2>
        <p className="text-sm leading-relaxed text-zinc-400">
          האלגוריתם מוצא משתמשים עם דפוסי דירוג דומים לשלך ("שכנים קרובים"), ומציע סרטים שהם
          אהבו ואתה טרם ראית. הדמיון מחושב באמצעות Cosine Similarity על מטריצת הדירוגים.
        </p>
      </div>

      {source === 'popular' && (
        <p className="mb-6 rounded-lg border border-sky-500/40 bg-sky-500/10 px-3 py-2 text-sm text-sky-400">
          עדיין לא דירגת מספיק סרטים, אז אלו הסרטים המדורגים ביותר אצלנו. דרגו כמה סרטים
          בקטלוג כדי לקבל המלצות אישיות!
        </p>
      )}

      {loading ? (
        <p className="py-16 text-center text-zinc-500">מחשב המלצות...</p>
      ) : error ? (
        <p className="rounded-lg border border-brand-500/40 bg-brand-500/10 px-3 py-2 text-sm text-brand-400">
          {error}
        </p>
      ) : items.length === 0 ? (
        <div className="py-16 text-center text-zinc-500">
          <p className="mb-4">אין עדיין מספיק נתונים כדי להמליץ</p>
          <Link to="/" className="font-medium text-brand-400 hover:underline">
            עברו לקטלוג ודרגו כמה סרטים
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {items.map((item, index) => (
            <div key={item.id} className="flex flex-col gap-2">
              <MovieCard item={item} />
              {/* פס התאמה */}
              <div className="rounded-lg border border-surface-700 bg-surface-900 px-3 py-2">
                <div className="mb-1 flex items-center justify-between text-xs">
                  <span className="font-semibold text-emerald-400">
                    {matchPercent(item)}% התאמה
                  </span>
                  <span className="text-zinc-600">#{index + 1}</span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-surface-700" dir="ltr">
                  <div
                    className="h-full rounded-full bg-emerald-500"
                    style={{ width: `${matchPercent(item)}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
};

export default RecommendationsScreen;
