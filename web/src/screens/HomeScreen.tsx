import { useCallback, useEffect, useState } from 'react';
import MovieCard from '../components/MovieCard';
import SearchBox from '../components/SearchBox';
import { useAuth } from '../context/AuthContext';
import {
  fetchMovies,
  rateMovie,
  deleteRating,
  fetchMyScores,
  fetchFavorites,
  addFavorite,
  removeFavorite,
} from '../services/movieService';
import type { CatalogSort } from '../services/movieService';
import { fetchCategories } from '../services/categoryService';
import { mockItems } from '../data/mockData';
import { getApiErrorMessage } from '../utils/errors';
import type { Item, Category } from '../types';

const SORT_OPTIONS: { value: CatalogSort; label: string }[] = [
  { value: 'newest', label: 'חדש' },
  { value: 'rating', label: 'דירוג' },
  { value: 'popular', label: 'פופולרי' },
];

const chipClass = (active: boolean) =>
  `rounded-full px-3 py-1 text-sm transition-colors ${
    active
      ? 'bg-brand-500 font-semibold text-white'
      : 'bg-surface-800 text-zinc-300 hover:bg-surface-700'
  }`;

const HomeScreen = () => {
  const { user } = useAuth();

  const [items, setItems] = useState<Item[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [search, setSearch] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [sort, setSort] = useState<CatalogSort>('newest');
  const [loading, setLoading] = useState(true);
  const [usingMockData, setUsingMockData] = useState(false);
  const [notice, setNotice] = useState('');
  const [userScores, setUserScores] = useState<Record<string, number>>({});
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
  const [showFavorites, setShowFavorites] = useState(false);
  const [favoriteItems, setFavoriteItems] = useState<Item[]>([]);

  const loadCatalog = useCallback(
    async (query: { search?: string; category?: string; sort?: CatalogSort }) => {
      setLoading(true);
      setNotice('');
      try {
        const movies = await fetchMovies(query);
        setItems(movies);
        setUsingMockData(false);
      } catch {
        // אם ה-API לא זמין, נופלים לנתוני דמו.
        const q = query.search?.trim().toLowerCase();
        setItems(
          q
            ? mockItems.filter(
                (m) => m.name.toLowerCase().includes(q) || m.tags.some((t) => t.includes(q))
              )
            : mockItems
        );
        setUsingMockData(true);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // טעינה ראשונית: קטלוג, קטגוריות והקשר משתמש.
  useEffect(() => {
    void loadCatalog({});
    fetchCategories().then(setCategories).catch(() => setCategories([]));
  }, [loadCatalog]);

  useEffect(() => {
    if (!user) {
      setUserScores({});
      setFavoriteIds(new Set());
      setShowFavorites(false);
      setFavoriteItems([]);
      return;
    }
    fetchMyScores().then(setUserScores).catch(() => setUserScores({}));
    fetchFavorites()
      .then((movies) => setFavoriteIds(new Set(movies.map((m) => m.id))))
      .catch(() => setFavoriteIds(new Set()));
  }, [user]);

  // טוענים מחדש כשסינון/מיון משתנה.
  useEffect(() => {
    setShowFavorites(false);
    void loadCatalog({ search, category: categoryId, sort });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoryId, sort]);

  const handleSearch = (query: string) => {
    setShowFavorites(false);
    void loadCatalog({ search: query, category: categoryId, sort });
  };

  const handleRate = async (itemId: string, score: number) => {
    if (usingMockData) {
      setNotice('דירוג אינו זמין במצב נתוני דמו');
      return;
    }
    try {
      await rateMovie(itemId, score);
      setUserScores((prev) => ({ ...prev, [itemId]: score }));
    } catch (error) {
      setNotice(getApiErrorMessage(error));
    }
  };

  const handleDeleteRating = async (itemId: string) => {
    try {
      await deleteRating(itemId);
      setUserScores((prev) => {
        const next = { ...prev };
        delete next[itemId];
        return next;
      });
    } catch (error) {
      setNotice(getApiErrorMessage(error));
    }
  };

  const handleToggleFavorite = async (itemId: string, next: boolean) => {
    try {
      if (next) {
        await addFavorite(itemId);
      } else {
        await removeFavorite(itemId);
      }
      setFavoriteIds((prev) => {
        const updated = new Set(prev);
        if (next) updated.add(itemId);
        else updated.delete(itemId);
        return updated;
      });
      // בתצוגת מועדפים, הסרה מהלב מורידה מהרשימה מיד.
      if (!next) {
        setFavoriteItems((prev) => prev.filter((m) => m.id !== itemId));
      }
    } catch (error) {
      setNotice(getApiErrorMessage(error));
    }
  };

  const handleToggleFavoritesView = async () => {
    if (showFavorites) {
      setShowFavorites(false);
      return;
    }
    setLoading(true);
    setNotice('');
    try {
      setFavoriteItems(await fetchFavorites());
      setShowFavorites(true);
    } catch (error) {
      setNotice(getApiErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-3xl font-black text-zinc-50">קטלוג הסרטים</h1>

        <SearchBox value={search} onChange={setSearch} onSearch={handleSearch} />
      </div>

      {/* פילטרים ומיון */}
      <div className="mb-6 flex flex-wrap items-center gap-2">
        {user && (
          <>
            <button
              type="button"
              onClick={() => void handleToggleFavoritesView()}
              className={chipClass(showFavorites)}
            >
              ❤ המועדפים שלי
            </button>
            <span className="mx-2 hidden h-5 w-px bg-surface-700 sm:block" />
          </>
        )}
        <button type="button" onClick={() => setCategoryId('')} className={chipClass(!categoryId)}>
          הכול
        </button>
        {categories.map((cat) => (
          <button
            key={cat.id}
            type="button"
            onClick={() => setCategoryId(cat.id === categoryId ? '' : cat.id)}
            className={chipClass(cat.id === categoryId)}
          >
            {cat.name}
          </button>
        ))}

        <span className="mx-2 hidden h-5 w-px bg-surface-700 sm:block" />
        <span className="text-sm text-zinc-500">מיין לפי:</span>
        {SORT_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => setSort(opt.value)}
            className={chipClass(sort === opt.value)}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {usingMockData && (
        <p className="mb-4 rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-sm text-amber-400">
          השרת אינו זמין - מוצגים נתוני דמו מקומיים
        </p>
      )}

      {notice && (
        <p className="mb-4 rounded-lg border border-brand-500/40 bg-brand-500/10 px-3 py-2 text-sm text-brand-400">
          {notice}
        </p>
      )}

      {loading ? (
        <p className="py-16 text-center text-zinc-500">טוען קטלוג...</p>
      ) : (showFavorites ? favoriteItems : items).length === 0 ? (
        <p className="py-16 text-center text-zinc-500">
          {showFavorites ? 'עדיין לא סימנתם מועדפים - לחצו על הלב שעל כרטיס סרט' : 'לא נמצאו סרטים'}
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {(showFavorites ? favoriteItems : items).map((item) => (
            <MovieCard
              key={item.id}
              item={item}
              userScore={userScores[item.id]}
              onRate={user ? handleRate : undefined}
              onDeleteRating={user ? handleDeleteRating : undefined}
              isFavorite={favoriteIds.has(item.id)}
              onToggleFavorite={user ? handleToggleFavorite : undefined}
            />
          ))}
        </div>
      )}

      {!user && !loading && (
        <p className="mt-8 text-center text-sm text-zinc-500">
          התחברו כדי לדרג סרטים ולקבל המלצות אישיות
        </p>
      )}
    </main>
  );
};

export default HomeScreen;
