import { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  ScrollView,
  RefreshControl,
  Pressable,
  Image,
  Keyboard,
  StyleSheet,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MovieCard from '@/components/MovieCard';
import Chip from '@/components/Chip';
import Popup from '@/components/Popup';
import { useDebounce } from '@/hooks/useDebounce';
import { mockItems } from '@/data/mockData';
import {
  fetchMovies,
  fetchCategories,
  fetchMyScores,
  rateMovie,
  deleteRating,
} from '@/services/rateflixApi';
import type { CatalogSort } from '@/services/rateflixApi';
import { getApiErrorMessage } from '@/services/api';
import { colors } from '@/constants/theme';
import type { Item, Category } from '@/types';

const SORT_OPTIONS: { value: CatalogSort; label: string }[] = [
  { value: 'newest', label: 'חדש' },
  { value: 'rating', label: 'דירוג' },
  { value: 'popular', label: 'פופולרי' },
];

const filterMock = (query: string): Item[] => {
  const q = query.trim().toLowerCase();
  if (!q) return mockItems;
  return mockItems.filter(
    (m) => m.name.toLowerCase().includes(q) || m.tags.some((t) => t.includes(q))
  );
};

export default function CatalogScreen() {
  const insets = useSafeAreaInsets();

  const [items, setItems] = useState<Item[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [search, setSearch] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [sort, setSort] = useState<CatalogSort>('newest');
  const [refreshing, setRefreshing] = useState(false);
  const [usingMockData, setUsingMockData] = useState(false);
  const [popup, setPopup] = useState<{ message: string; type: 'error' | 'success' } | null>(null);
  const [myScores, setMyScores] = useState<Record<string, number>>({});
  const [suggestions, setSuggestions] = useState<Item[]>([]);
  const skipNextSuggest = useRef(false);
  const chipsScrollRef = useRef<ScrollView>(null);

  const debouncedSearch = useDebounce(search, 250);

  const load = useCallback(
    async (query?: string) => {
      try {
        const [movies, scores] = await Promise.all([
          fetchMovies({ search: query ?? search, category: categoryId, sort }),
          fetchMyScores().catch(() => ({}) as Record<string, number>),
        ]);
        setItems(movies);
        setMyScores(scores);
        setUsingMockData(false);
      } catch {
        // אם ה-API לא זמין, נופלים לנתוני דמו.
        setItems(filterMock(query ?? search));
        setUsingMockData(true);
      }
    },
    [search, categoryId, sort]
  );

  useEffect(() => {
    void load();
    fetchCategories().then(setCategories).catch(() => setCategories([]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoryId, sort]);

  // הצעות חיפוש בזמן הקלדה (עם debounce).
  useEffect(() => {
    if (skipNextSuggest.current) {
      skipNextSuggest.current = false;
      return;
    }
    const query = debouncedSearch.trim();
    if (query.length < 2) {
      setSuggestions([]);
      return;
    }
    fetchMovies({ search: query })
      .then((movies) => setSuggestions(movies.slice(0, 5)))
      .catch(() => setSuggestions([]));
  }, [debouncedSearch]);

  const pickSuggestion = (item: Item) => {
    skipNextSuggest.current = true; // בחירה לא אמורה לפתוח שוב את הרשימה
    setSearch(item.name);
    setSuggestions([]);
    Keyboard.dismiss();
    void load(item.name);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const handleRate = async (itemId: string, score: number) => {
    if (usingMockData) {
      setPopup({ message: 'דירוג אינו זמין במצב נתוני דמו', type: 'error' });
      return;
    }
    try {
      await rateMovie(itemId, score);
      setMyScores((prev) => ({ ...prev, [itemId]: score }));
    } catch (err) {
      setPopup({ message: getApiErrorMessage(err), type: 'error' });
    }
  };

  const handleDeleteRating = async (itemId: string) => {
    try {
      await deleteRating(itemId);
      setMyScores((prev) => {
        const next = { ...prev };
        delete next[itemId];
        return next;
      });
    } catch (err) {
      setPopup({ message: getApiErrorMessage(err), type: 'error' });
    }
  };

  return (
    <View style={styles.flex}>
      {/* כותרת עליונה */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <Text style={styles.headerTitle}>🎬 קטלוג סרטים</Text>
        <TextInput
          style={styles.search}
          value={search}
          onChangeText={setSearch}
          onSubmitEditing={() => {
            setSuggestions([]);
            void load();
          }}
          placeholder="חפש סרט..."
          placeholderTextColor={colors.textFaint}
          returnKeyType="search"
        />
      </View>

      {/* תיבת הצעות חיפוש */}
      {suggestions.length > 0 && (
        <View style={styles.suggestionsBox}>
          {suggestions.map((s, i) => (
            <Pressable
              key={s.id}
              onPress={() => pickSuggestion(s)}
              style={[styles.suggestionRow, i > 0 && styles.suggestionDivider]}
            >
              {s.ratingCount > 0 && (
                <Text style={styles.suggestionRating}>★ {s.avgRating.toFixed(1)}</Text>
              )}
              <View style={styles.suggestionDetails}>
                <Text style={styles.suggestionTitle} numberOfLines={1}>
                  {s.name}
                </Text>
                <Text style={styles.suggestionSub}>
                  {[s.year, s.categoryName].filter(Boolean).join(' • ')}
                </Text>
              </View>
              {s.imageUrl ? (
                <Image source={{ uri: s.imageUrl }} style={styles.suggestionPoster} />
              ) : (
                <View style={[styles.suggestionPoster, styles.suggestionPosterFallback]}>
                  <Text style={styles.suggestionPosterLetter}>{s.name.charAt(0)}</Text>
                </View>
              )}
            </Pressable>
          ))}
        </View>
      )}

      {/* צ'יפים לסינון ומיון */}
      <ScrollView
        ref={chipsScrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.chipsScroll}
        contentContainerStyle={styles.chipsRow}
        onContentSizeChange={() => chipsScrollRef.current?.scrollToEnd({ animated: false })}
      >
        <Text style={styles.chipsLabel}>מיין לפי:</Text>
        {SORT_OPTIONS.map((opt) => (
          <Chip
            key={opt.value}
            label={opt.label}
            active={sort === opt.value}
            onPress={() => setSort(opt.value)}
          />
        ))}
        <View style={styles.chipsDivider} />
        <Chip label="הכול" active={!categoryId} onPress={() => setCategoryId('')} />
        {categories.map((cat) => (
          <Chip
            key={cat.id}
            label={cat.name}
            active={categoryId === cat.id}
            onPress={() => setCategoryId(categoryId === cat.id ? '' : cat.id)}
          />
        ))}
      </ScrollView>

      {usingMockData && (
        <Text style={styles.mockBanner}>השרת אינו זמין - מוצגים נתוני דמו מקומיים</Text>
      )}

      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={<Text style={styles.empty}>לא נמצאו סרטים</Text>}
        renderItem={({ item }) => (
          <MovieCard
            item={item}
            userScore={myScores[item.id]}
            onRate={handleRate}
            onDeleteRating={handleDeleteRating}
          />
        )}
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
      />

      {popup && (
        <Popup message={popup.message} type={popup.type} onDismiss={() => setPopup(null)} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  header: {
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingHorizontal: 16,
    paddingBottom: 14,
    gap: 10,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: colors.white,
    textAlign: 'right',
  },
  search: {
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    color: colors.text,
    textAlign: 'right',
  },
  suggestionsBox: {
    marginHorizontal: 16,
    marginTop: 8,
    backgroundColor: colors.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    // מרחף מעל התוכן כמו דרופדאון
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  suggestionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  suggestionDivider: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  suggestionPoster: {
    width: 34,
    height: 48,
    borderRadius: 6,
    backgroundColor: colors.primarySoft,
  },
  suggestionPosterFallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  suggestionPosterLetter: {
    fontWeight: '800',
    color: colors.primary,
  },
  suggestionDetails: {
    flex: 1,
    alignItems: 'flex-end',
  },
  suggestionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
  },
  suggestionSub: {
    fontSize: 12,
    color: colors.textMuted,
  },
  suggestionRating: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.star,
  },
  chipsScroll: {
    flexGrow: 0,
  },
  chipsRow: {
    flexDirection: 'row-reverse',
    flexGrow: 1,
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  chipsLabel: {
    fontSize: 13,
    color: colors.textMuted,
  },
  chipsDivider: {
    width: 1,
    height: 18,
    backgroundColor: colors.border,
    marginHorizontal: 4,
  },
  mockBanner: {
    marginHorizontal: 16,
    marginBottom: 6,
    backgroundColor: colors.accentSoft,
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    fontSize: 13,
    color: colors.accent,
    textAlign: 'right',
  },
  list: {
    padding: 16,
    paddingTop: 4,
  },
  empty: {
    textAlign: 'center',
    color: colors.textMuted,
    paddingVertical: 40,
  },
});
