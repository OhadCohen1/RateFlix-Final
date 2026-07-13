import { useEffect, useRef, useState } from 'react';
import type { FormEvent, ReactNode } from 'react';
import { fetchMovies } from '../services/movieService';
import type { Item } from '../types';

interface SearchBoxProps {
  value: string;
  onChange: (value: string) => void;
  /** מופעל ב-submit או בבחירת הצעה */
  onSearch: (query: string) => void;
}

const MAX_SUGGESTIONS = 6;
const DEBOUNCE_MS = 250;

/** מדגיש את החלק שתואם לחיפוש */
const highlightMatch = (name: string, query: string): ReactNode => {
  const index = name.toLowerCase().indexOf(query.toLowerCase());
  if (index < 0) return name;
  return (
    <>
      {name.slice(0, index)}
      <span className="font-bold text-brand-400">{name.slice(index, index + query.length)}</span>
      {name.slice(index + query.length)}
    </>
  );
};

const SearchBox = ({ value, onChange, onSearch }: SearchBoxProps) => {
  const [suggestions, setSuggestions] = useState<Item[]>([]);
  const [open, setOpen] = useState(false);
  const [searched, setSearched] = useState(false);
  const skipNextFetch = useRef(false);

  // הצעות חיות עם debounce בזמן הקלדה.
  useEffect(() => {
    if (skipNextFetch.current) {
      skipNextFetch.current = false;
      return;
    }
    const query = value.trim();
    if (query.length < 2) {
      setSuggestions([]);
      setOpen(false);
      setSearched(false);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const movies = await fetchMovies({ search: query });
        setSuggestions(movies.slice(0, MAX_SUGGESTIONS));
        setSearched(true);
        setOpen(true);
      } catch {
        setSuggestions([]);
        setOpen(false);
      }
    }, DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [value]);

  const pickSuggestion = (item: Item) => {
    skipNextFetch.current = true; // selecting fills the input - don't re-open the dropdown
    onChange(item.name);
    setOpen(false);
    onSearch(item.name);
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setOpen(false);
    onSearch(value);
  };

  return (
    <form onSubmit={handleSubmit} className="relative flex gap-2">
      <div className="relative">
        <input
          type="search"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => suggestions.length > 0 && setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          onKeyDown={(e) => e.key === 'Escape' && setOpen(false)}
          placeholder="חיפוש לפי שם או תגית..."
          className="w-64 rounded-lg border border-surface-700 bg-surface-800 px-3 py-2 text-sm text-zinc-100 outline-none placeholder:text-zinc-500 focus:border-brand-500"
        />

        {/* רשימת הצעות */}
        {open && (
          <ul className="absolute top-full right-0 left-0 z-20 mt-1 overflow-hidden rounded-xl border border-surface-700 bg-surface-900 shadow-2xl shadow-black/50">
            {suggestions.length === 0 && searched ? (
              <li className="px-3 py-3 text-sm text-zinc-500">לא נמצאו סרטים</li>
            ) : (
              suggestions.map((item) => (
                <li key={item.id}>
                  <button
                    type="button"
                    // onMouseDown רץ לפני blur, ככה הבחירה לא נבלעת.
                    onMouseDown={(e) => {
                      e.preventDefault();
                      pickSuggestion(item);
                    }}
                    className="flex w-full items-center gap-3 px-3 py-2 text-right transition-colors hover:bg-surface-800"
                  >
                    {item.imageUrl ? (
                      <img
                        src={item.imageUrl}
                        alt=""
                        className="h-12 w-8 shrink-0 rounded object-cover"
                      />
                    ) : (
                      <span className="flex h-12 w-8 shrink-0 items-center justify-center rounded bg-surface-800 text-sm font-bold text-surface-700">
                        {item.name.charAt(0)}
                      </span>
                    )}
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm text-zinc-100">
                        {highlightMatch(item.name, value.trim())}
                      </span>
                      <span className="block text-xs text-zinc-500">
                        {[item.year, item.categoryName].filter(Boolean).join(' • ')}
                      </span>
                    </span>
                    {item.ratingCount > 0 && (
                      <span className="shrink-0 text-xs text-amber-400">
                        ★ {item.avgRating.toFixed(1)}
                      </span>
                    )}
                  </button>
                </li>
              ))
            )}
          </ul>
        )}
      </div>

      <button
        type="submit"
        className="rounded-lg bg-surface-800 px-4 py-2 text-sm font-medium text-zinc-200 transition-colors hover:bg-surface-700"
      >
        חיפוש
      </button>
    </form>
  );
};

export default SearchBox;
