import { useCallback, useEffect, useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import InputField from '../components/InputField';
import MovieCard from '../components/MovieCard';
import { createMovie, deleteMovie, fetchMovies } from '../services/movieService';
import { fetchCategories, createCategory, deleteCategory } from '../services/categoryService';
import { fetchAdminStats } from '../services/adminService';
import { getApiErrorMessage } from '../utils/errors';
import type { Item, Category, AdminStats } from '../types';

type AdminTab = 'stats' | 'create' | 'manage' | 'categories';

const TABS: { value: AdminTab; label: string }[] = [
  { value: 'stats', label: 'אנליטיקות' },
  { value: 'create', label: 'הוספת סרט' },
  { value: 'manage', label: 'ניהול קטלוג' },
  { value: 'categories', label: 'קטגוריות' },
];

const AdminScreen = () => {
  const [tab, setTab] = useState<AdminTab>('stats');

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="mb-6 text-3xl font-black text-zinc-50">ניהול מערכת</h1>

      <div className="mb-8 flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button
            key={t.value}
            type="button"
            onClick={() => setTab(t.value)}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              tab === t.value
                ? 'bg-brand-500 text-white'
                : 'bg-surface-800 text-zinc-300 hover:bg-surface-700'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'stats' && <StatsTab />}
      {tab === 'create' && <CreateMovieTab />}
      {tab === 'manage' && <ManageMoviesTab />}
      {tab === 'categories' && <CategoriesTab />}
    </main>
  );
};

/* ------------------------------ Analytics ------------------------------ */

const StatsTab = () => {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchAdminStats()
      .then(setStats)
      .catch((err) => setError(getApiErrorMessage(err)));
  }, []);

  if (error) return <p className="text-brand-400">{error}</p>;
  if (!stats) return <p className="text-zinc-500">טוען נתונים...</p>;

  const tiles = [
    { value: stats.totals.users, label: 'משתמשים' },
    { value: stats.totals.movies, label: 'סרטים' },
    { value: stats.totals.ratings, label: 'דירוגים' },
    { value: stats.totals.favorites, label: 'מועדפים' },
    { value: stats.avgScore, label: 'ציון ממוצע' },
  ];

  return (
    <div className="flex flex-col gap-8">
      {/* Totals */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {tiles.map((tile) => (
          <div
            key={tile.label}
            className="rounded-xl border border-surface-700 bg-surface-900 p-4 text-center"
          >
            <div className="text-3xl font-black text-zinc-50">{tile.value}</div>
            <div className="mt-1 text-sm text-zinc-500">{tile.label}</div>
          </div>
        ))}
      </div>

      {/* ביצועי מנוע ההמלצות */}
      <section className="rounded-xl border border-surface-700 bg-surface-900 p-5">
        <h2 className="mb-3 text-lg font-bold text-zinc-50">ביצועי מנוע ההמלצות</h2>
        <div className="grid grid-cols-2 gap-4 text-center sm:grid-cols-4">
          <div>
            <div className="text-2xl font-black text-emerald-400">{stats.engine.avgMs} ms</div>
            <div className="mt-1 text-sm text-zinc-500">זמן חישוב ממוצע</div>
          </div>
          <div>
            <div className="text-2xl font-black text-zinc-50">{stats.engine.maxMs} ms</div>
            <div className="mt-1 text-sm text-zinc-500">זמן מקסימלי</div>
          </div>
          <div>
            <div className="text-2xl font-black text-zinc-50">{stats.engine.runs}</div>
            <div className="mt-1 text-sm text-zinc-500">חישובים סה"כ</div>
          </div>
          <div>
            <div className="text-2xl font-black text-emerald-400">
              {stats.engine.runs > 0
                ? Math.round((stats.engine.knnRuns / stats.engine.runs) * 100)
                : 0}
              %
            </div>
            <div className="mt-1 text-sm text-zinc-500">המלצות מותאמות אישית (KNN)</div>
          </div>
        </div>
        <p className="mt-3 text-xs text-zinc-600">המדדים האלו נאספים בכל בקשת המלצות.</p>
      </section>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        {/* Top movies */}
        <section className="rounded-xl border border-surface-700 bg-surface-900 p-5">
          <h2 className="mb-3 text-lg font-bold text-zinc-50">הסרטים המובילים</h2>
          {stats.topMovies.length === 0 ? (
            <p className="text-sm text-zinc-500">אין עדיין דירוגים</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-surface-700 text-right text-zinc-500">
                  <th className="pb-2 font-medium">סרט</th>
                  <th className="pb-2 font-medium">ציון</th>
                  <th className="pb-2 font-medium">דירוגים</th>
                </tr>
              </thead>
              <tbody>
                {stats.topMovies.map((movie) => (
                  <tr key={movie.movieId} className="border-b border-surface-800 last:border-0">
                    <td className="py-2 font-medium text-zinc-100">{movie.title}</td>
                    <td className="py-2 text-amber-400">★ {movie.avgScore}</td>
                    <td className="py-2 text-zinc-400">{movie.ratingsCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>

        {/* Recent engine runs */}
        <section className="rounded-xl border border-surface-700 bg-surface-900 p-5">
          <h2 className="mb-3 text-lg font-bold text-zinc-50">חישובי המלצות אחרונים</h2>
          {stats.recentLogs.length === 0 ? (
            <p className="text-sm text-zinc-500">אין עדיין רשומות</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-surface-700 text-right text-zinc-500">
                  <th className="pb-2 font-medium">משתמש</th>
                  <th className="pb-2 font-medium">מקור</th>
                  <th className="pb-2 font-medium">זמן</th>
                </tr>
              </thead>
              <tbody>
                {stats.recentLogs.map((log) => (
                  <tr key={log.id} className="border-b border-surface-800 last:border-0">
                    <td className="py-2 text-zinc-100">{log.userEmail}</td>
                    <td className="py-2">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs ${
                          log.source === 'knn'
                            ? 'bg-emerald-500/15 text-emerald-400'
                            : 'bg-sky-500/15 text-sky-400'
                        }`}
                      >
                        {log.source === 'knn' ? 'KNN אישי' : 'פופולרי'}
                      </span>
                    </td>
                    <td className="py-2 text-zinc-400">{log.executionTimeMs} ms</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      </div>
    </div>
  );
};

/* ----------------------------- Create movie ---------------------------- */

const CreateMovieTab = () => {
  const [title, setTitle] = useState('');
  const [year, setYear] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState('');

  const [titleError, setTitleError] = useState('');
  const [apiError, setApiError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [created, setCreated] = useState<Item | null>(null);

  useEffect(() => {
    fetchCategories().then(setCategories).catch(() => setCategories([]));
  }, []);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    setImageFile(file);
    setImagePreview(file ? URL.createObjectURL(file) : '');
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setApiError('');
    setCreated(null);

    if (!title.trim()) {
      setTitleError('נא להזין שם סרט');
      return;
    }
    setTitleError('');

    // שולחים multipart: שדות טקסט + קובץ image.
    const formData = new FormData();
    formData.append('title', title.trim());
    if (year.trim()) formData.append('year', year.trim());
    if (categoryId) formData.append('categoryId', categoryId);
    if (imageFile) formData.append('image', imageFile);

    setSubmitting(true);
    try {
      const movie = await createMovie(formData);
      setCreated(movie);
      setTitle('');
      setYear('');
      setCategoryId('');
      setImageFile(null);
      setImagePreview('');
    } catch (error) {
      setApiError(getApiErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="grid grid-cols-1 gap-10 lg:grid-cols-2">
      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
        <p className="text-sm text-zinc-500">
          הפוסטר יעלה ל-Cloudinary, והתקציר והתגיות ייווצרו אוטומטית על ידי Gemini AI
        </p>
        <InputField
          label="שם הסרט"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          error={titleError}
          placeholder="למשל: Inception"
        />

        <InputField
          label="שנת יציאה (אופציונלי)"
          type="number"
          value={year}
          onChange={(e) => setYear(e.target.value)}
          placeholder="למשל: 2014"
        />

        <div className="flex flex-col gap-1.5">
          <label htmlFor="category" className="text-sm font-medium text-zinc-300">
            קטגוריה (אופציונלי)
          </label>
          <select
            id="category"
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="rounded-lg border border-surface-700 bg-surface-800 px-3 py-2.5 text-zinc-100 outline-none focus:border-brand-500"
          >
            <option value="">ללא קטגוריה</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="poster" className="text-sm font-medium text-zinc-300">
            פוסטר (אופציונלי)
          </label>
          <input
            id="poster"
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="rounded-lg border border-surface-700 bg-surface-800 px-3 py-2 text-sm text-zinc-400 file:ml-3 file:rounded-md file:border-0 file:bg-surface-700 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-zinc-200"
          />
          {imagePreview && (
            <img
              src={imagePreview}
              alt="תצוגה מקדימה של הפוסטר"
              className="mt-2 max-h-64 w-40 rounded-lg object-cover"
            />
          )}
        </div>

        {apiError && (
          <p className="rounded-lg border border-brand-500/40 bg-brand-500/10 px-3 py-2 text-sm text-brand-400">
            {apiError}
          </p>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="mt-2 rounded-lg bg-brand-500 py-2.5 font-semibold text-white transition-colors hover:bg-brand-600 disabled:opacity-50"
        >
          {submitting ? 'מעלה ומייצר תקציר עם AI...' : 'יצירת סרט'}
        </button>
      </form>

      <div>
        {created ? (
          <div className="flex flex-col gap-3">
            <p className="rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-400">
              הסרט נוצר בהצלחה! כך הוא ייראה בקטלוג:
            </p>
            <div className="max-w-xs">
              <MovieCard item={created} />
            </div>
            {!created.description && (
              <p className="text-sm text-amber-400">
                שימו לב: התקציר לא נוצר - בדקו שמפתח ה-Gemini מוגדר בשרת
              </p>
            )}
          </div>
        ) : (
          <div className="flex h-full min-h-48 items-center justify-center rounded-xl border border-dashed border-surface-700 text-sm text-zinc-600">
            הסרט שייווצר יוצג כאן
          </div>
        )}
      </div>
    </div>
  );
};

/* ----------------------------- Manage movies --------------------------- */

const ManageMoviesTab = () => {
  const [movies, setMovies] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setMovies(await fetchMovies({}));
      setError('');
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const handleDelete = async (itemId: string) => {
    try {
      await deleteMovie(itemId);
      setMovies((prev) => prev.filter((m) => m.id !== itemId));
      setConfirmId(null);
    } catch (err) {
      setError(getApiErrorMessage(err));
    }
  };

  if (loading) return <p className="text-zinc-500">טוען קטלוג...</p>;
  if (error) return <p className="text-brand-400">{error}</p>;

  return (
    <div>
      <p className="mb-4 text-sm text-zinc-500">
        מחיקת סרט מסירה גם את כל הדירוגים והמועדפים שלו
      </p>
      <ul className="flex flex-col gap-2">
        {movies.map((movie) => (
          <li
            key={movie.id}
            className="flex items-center gap-3 rounded-lg border border-surface-700 bg-surface-900 p-3"
          >
            {movie.imageUrl ? (
              <img src={movie.imageUrl} alt="" className="h-14 w-10 rounded object-cover" />
            ) : (
              <div className="flex h-14 w-10 items-center justify-center rounded bg-surface-800 font-bold text-surface-700">
                {movie.name.charAt(0)}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <div className="truncate font-semibold text-zinc-100">{movie.name}</div>
              <div className="text-xs text-zinc-500">
                {movie.ratingCount > 0
                  ? `★ ${movie.avgRating.toFixed(1)} (${movie.ratingCount} דירוגים)`
                  : 'ללא דירוגים'}
              </div>
            </div>
            {confirmId === movie.id ? (
              <div className="flex items-center gap-2">
                <span className="text-sm text-zinc-400">בטוח?</span>
                <button
                  type="button"
                  onClick={() => handleDelete(movie.id)}
                  className="rounded-lg bg-brand-500 px-3 py-1.5 text-sm font-semibold text-white hover:bg-brand-600"
                >
                  מחק
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmId(null)}
                  className="rounded-lg bg-surface-800 px-3 py-1.5 text-sm text-zinc-300 hover:bg-surface-700"
                >
                  ביטול
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmId(movie.id)}
                className="rounded-lg border border-surface-700 px-3 py-1.5 text-sm text-zinc-400 transition-colors hover:border-brand-500 hover:text-brand-400"
              >
                מחיקה
              </button>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
};

/* ------------------------------ Categories ----------------------------- */

const CategoriesTab = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [newName, setNewName] = useState('');
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      setCategories(await fetchCategories());
    } catch (err) {
      setError(getApiErrorMessage(err));
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const handleAdd = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    if (!newName.trim()) return;
    try {
      await createCategory(newName.trim());
      setNewName('');
      await load();
    } catch (err) {
      setError(getApiErrorMessage(err));
    }
  };

  const handleDelete = async (categoryId: string) => {
    setError('');
    try {
      await deleteCategory(categoryId);
      setCategories((prev) => prev.filter((c) => c.id !== categoryId));
    } catch (err) {
      setError(getApiErrorMessage(err));
    }
  };

  return (
    <div className="max-w-lg">
      <form onSubmit={handleAdd} className="mb-6 flex gap-2">
        <input
          type="text"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="שם קטגוריה חדשה..."
          className="flex-1 rounded-lg border border-surface-700 bg-surface-800 px-3 py-2 text-zinc-100 outline-none placeholder:text-zinc-500 focus:border-brand-500"
        />
        <button
          type="submit"
          className="rounded-lg bg-brand-500 px-4 py-2 font-semibold text-white transition-colors hover:bg-brand-600"
        >
          הוספה
        </button>
      </form>

      {error && <p className="mb-4 text-sm text-brand-400">{error}</p>}

      <ul className="flex flex-col gap-2">
        {categories.map((cat) => (
          <li
            key={cat.id}
            className="flex items-center justify-between rounded-lg border border-surface-700 bg-surface-900 px-4 py-2.5"
          >
            <span className="font-medium text-zinc-100">{cat.name}</span>
            <button
              type="button"
              onClick={() => handleDelete(cat.id)}
              aria-label={`מחיקת הקטגוריה ${cat.name}`}
              className="text-zinc-600 transition-colors hover:text-brand-400"
            >
              ✕
            </button>
          </li>
        ))}
        {categories.length === 0 && <p className="text-sm text-zinc-500">אין עדיין קטגוריות</p>}
      </ul>
    </div>
  );
};

export default AdminScreen;
