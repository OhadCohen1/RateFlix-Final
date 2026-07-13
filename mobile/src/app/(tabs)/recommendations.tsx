import { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  FlatList,
  RefreshControl,
  StyleSheet,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MovieCard from '@/components/MovieCard';
import { fetchRecommendations, fetchUsersSummary } from '@/services/rateflixApi';
import { getApiErrorMessage } from '@/services/api';
import { colors } from '@/constants/theme';
import type { Item, UserSummary } from '@/types';

type RecsTab = 'forMe' | 'users';

export default function RecommendationsScreen() {
  const insets = useSafeAreaInsets();

  const [tab, setTab] = useState<RecsTab>('forMe');
  const [items, setItems] = useState<Item[]>([]);
  const [source, setSource] = useState<'knn' | 'popular' | null>(null);
  const [users, setUsers] = useState<UserSummary[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setError('');
    try {
      const [recs, summary] = await Promise.all([
        fetchRecommendations(),
        fetchUsersSummary().catch(() => [] as UserSummary[]),
      ]);
      setItems(recs.items);
      setSource(recs.source);
      setUsers(summary);
    } catch (err) {
      setError(getApiErrorMessage(err));
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const initialsOf = (user: UserSummary): string => {
    if (user.name) {
      const parts = user.name.split(' ');
      return `${parts[0]?.charAt(0) ?? ''}${parts[1]?.charAt(0) ?? ''}`;
    }
    return user.email.charAt(0).toUpperCase();
  };

  return (
    <View style={styles.flex}>
      {/* Dark header matching the web app */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <Text style={styles.headerTitle}>⭐ המלצות חכמות</Text>
        <Text style={styles.headerSub}>מבוסס אלגוריתם KNN</Text>
      </View>

      {/* Tabs: for-me / users */}
      <View style={styles.tabsRow}>
        <Pressable
          onPress={() => setTab('users')}
          style={[styles.tabButton, tab === 'users' && styles.tabButtonActive]}
        >
          <Text style={[styles.tabText, tab === 'users' && styles.tabTextActive]}>
            משתמשים ({users.length})
          </Text>
        </Pressable>
        <Pressable
          onPress={() => setTab('forMe')}
          style={[styles.tabButton, tab === 'forMe' && styles.tabButtonActive]}
        >
          <Text style={[styles.tabText, tab === 'forMe' && styles.tabTextActive]}>
            המלצות עבורי
          </Text>
        </Pressable>
      </View>

      {!!error && <Text style={styles.error}>{error}</Text>}

      {tab === 'forMe' ? (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ListHeaderComponent={
            <View style={styles.listHeader}>
              <View style={styles.explainer}>
                <Text style={styles.explainerTitle}>🧠 איך עובד ה-KNN?</Text>
                <Text style={styles.explainerText}>
                  האלגוריתם מוצא משתמשים עם דפוסי דירוג דומים לך (שכנים קרובים), ומציע
                  סרטים שהם אהבו ואתה טרם ראית. הדמיון מחושב ע"י Cosine Similarity.
                </Text>
              </View>
              {source === 'popular' && (
                <Text style={styles.coldStart}>
                  עדיין אין מספיק דירוגים - מציגים את הסרטים הפופולריים. דרגו סרטים בקטלוג
                  כדי לקבל המלצות אישיות!
                </Text>
              )}
            </View>
          }
          ListEmptyComponent={
            <Text style={styles.empty}>אין עדיין המלצות - דרגו כמה סרטים בקטלוג</Text>
          }
          renderItem={({ item, index }) => <MovieCard item={item} rank={index + 1} />}
          ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        />
      ) : (
        <FlatList
          data={users}
          keyExtractor={(user) => user.id}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ListHeaderComponent={
            <Text style={styles.usersCount}>{users.length} משתמשים רשומים במערכת</Text>
          }
          renderItem={({ item: user, index }) => (
            <View style={styles.userCard}>
              <View style={styles.ratingsBadge}>
                <Text style={styles.ratingsCount}>{user.ratingsCount}</Text>
                <Text style={styles.ratingsLabel}>דירוגים</Text>
              </View>
              <View style={styles.userDetails}>
                <View style={styles.userNameRow}>
                  {user.role === 'admin' && (
                    <View style={styles.adminBadge}>
                      <Text style={styles.adminBadgeText}>מנהל</Text>
                    </View>
                  )}
                  <Text style={styles.userName}>
                    {user.name ?? user.email} #{index + 1}
                  </Text>
                </View>
                <Text style={styles.userEmail}>{user.email}</Text>
                {user.topCategories.length > 0 && (
                  <Text style={styles.userCategories}>{user.topCategories.join(', ')}</Text>
                )}
              </View>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{initialsOf(user)}</Text>
              </View>
            </View>
          )}
          ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        />
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
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: colors.white,
    textAlign: 'right',
  },
  headerSub: {
    fontSize: 13,
    color: colors.white,
    opacity: 0.85,
    textAlign: 'right',
  },
  tabsRow: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabButtonActive: {
    borderBottomColor: colors.accent,
  },
  tabText: {
    fontSize: 14,
    color: colors.textMuted,
  },
  tabTextActive: {
    color: colors.text,
    fontWeight: '700',
  },
  error: {
    color: colors.danger,
    fontSize: 13,
    textAlign: 'center',
    padding: 8,
  },
  list: {
    padding: 16,
  },
  listHeader: {
    gap: 10,
    marginBottom: 12,
  },
  explainer: {
    backgroundColor: colors.accentSoft,
    borderRightWidth: 4,
    borderRightColor: colors.accent,
    borderRadius: 12,
    padding: 14,
    gap: 4,
  },
  explainerTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.text,
    textAlign: 'right',
  },
  explainerText: {
    fontSize: 13,
    lineHeight: 20,
    color: colors.textMuted,
    textAlign: 'right',
  },
  coldStart: {
    backgroundColor: colors.primarySoft,
    borderRadius: 12,
    padding: 12,
    fontSize: 13,
    color: colors.primaryDark,
    textAlign: 'right',
  },
  empty: {
    textAlign: 'center',
    color: colors.textMuted,
    paddingVertical: 40,
  },
  usersCount: {
    textAlign: 'center',
    color: colors.textMuted,
    fontSize: 13,
    marginBottom: 12,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
    gap: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '800',
  },
  userDetails: {
    flex: 1,
    alignItems: 'flex-end',
    gap: 2,
  },
  userNameRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 6,
  },
  userName: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.text,
  },
  adminBadge: {
    backgroundColor: colors.badge,
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  adminBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textDark,
  },
  userEmail: {
    fontSize: 12,
    color: colors.textMuted,
  },
  userCategories: {
    fontSize: 12,
    color: colors.primary,
  },
  ratingsBadge: {
    alignItems: 'center',
  },
  ratingsCount: {
    fontSize: 18,
    fontWeight: '900',
    color: colors.primary,
  },
  ratingsLabel: {
    fontSize: 11,
    color: colors.textMuted,
  },
});
