import { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  RefreshControl,
  Image,
  StyleSheet,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import InputField from '@/components/InputField';
import StarRating from '@/components/StarRating';
import Popup from '@/components/Popup';
import { fetchMyProfile, updateMyProfile, deleteRating } from '@/services/rateflixApi';
import type { MyProfile } from '@/services/rateflixApi';
import { useAuth } from '@/context/AuthContext';
import { getApiErrorMessage } from '@/services/api';
import { colors } from '@/constants/theme';

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { logout } = useAuth();
  const router = useRouter();

  const [data, setData] = useState<MyProfile | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [saving, setSaving] = useState(false);
  const [popup, setPopup] = useState<{ message: string; type: 'error' | 'success' } | null>(null);

  const load = useCallback(async () => {
    setError('');
    try {
      const profile = await fetchMyProfile();
      setData(profile);
      setFirstName(profile.profile?.firstName ?? '');
      setLastName(profile.profile?.lastName ?? '');
      setPhoneNumber(profile.profile?.phoneNumber ?? '');
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

  const handleSave = async () => {
    if (!firstName.trim() || !lastName.trim()) {
      setPopup({ message: 'נא למלא שם פרטי ושם משפחה', type: 'error' });
      return;
    }
    setSaving(true);
    try {
      await updateMyProfile({ firstName: firstName.trim(), lastName: lastName.trim(), phoneNumber });
      setPopup({ message: 'הפרטים נשמרו בהצלחה', type: 'success' });
      await load();
    } catch (err) {
      setPopup({ message: getApiErrorMessage(err), type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteRating = async (movieId: string) => {
    try {
      await deleteRating(movieId);
      await load();
    } catch (err) {
      setPopup({ message: getApiErrorMessage(err), type: 'error' });
    }
  };

  const handleLogout = async () => {
    await logout();
    router.replace('/login');
  };

  const initials = data?.profile
    ? `${data.profile.firstName.charAt(0)}${data.profile.lastName.charAt(0)}`
    : (data?.user.email.charAt(0).toUpperCase() ?? '');

  return (
    <View style={styles.flex}>
    <ScrollView
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {/* Blue profile header like the mockup */}
      <View style={[styles.header, { paddingTop: insets.top + 20 }]}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>
        <Text style={styles.headerName}>
          {data?.profile ? `${data.profile.firstName} ${data.profile.lastName}` : data?.user.email}
        </Text>
        <Text style={styles.headerEmail}>{data?.user.email}</Text>
        {data?.user.role === 'admin' && (
          <View style={styles.adminBadge}>
            <Text style={styles.adminBadgeText}>מנהל מערכת</Text>
          </View>
        )}
      </View>

      {/* Stats row */}
      {data && (
        <View style={styles.statsRow}>
          {[
            { value: data.stats.categoriesCount, label: 'קטגוריות' },
            { value: data.stats.avgScore, label: 'ממוצע שלי' },
            { value: data.stats.ratingsCount, label: 'דירוגים' },
          ].map((stat) => (
            <View key={stat.label} style={styles.statTile}>
              <Text style={styles.statValue}>{stat.value}</Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </View>
          ))}
        </View>
      )}

      {!!error && <Text style={styles.error}>{error}</Text>}

      {/* Personal details */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>פרטים אישיים</Text>
        <InputField label="שם פרטי" value={firstName} onChangeText={setFirstName} />
        <InputField label="שם משפחה" value={lastName} onChangeText={setLastName} />
        <InputField
          label="טלפון (אופציונלי)"
          value={phoneNumber}
          onChangeText={setPhoneNumber}
          keyboardType="phone-pad"
        />
        <Pressable onPress={handleSave} disabled={saving} style={styles.saveButton}>
          <Text style={styles.saveButtonText}>{saving ? 'שומר...' : 'שמירת פרטים'}</Text>
        </Pressable>
      </View>

      {/* My ratings */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>הדירוגים שלי ({data?.ratings.length ?? 0})</Text>
        {data?.ratings.length === 0 && (
          <Text style={styles.emptyRatings}>עדיין לא דירגת סרטים - עברו לקטלוג</Text>
        )}
        {data?.ratings.map((rating) => (
          <View key={rating.id} style={styles.ratingRow}>
            <Pressable onPress={() => handleDeleteRating(rating.movie.id)} hitSlop={8}>
              <Text style={styles.deleteRating}>✕</Text>
            </Pressable>
            <StarRating value={rating.score} size={15} />
            <View style={styles.ratingDetails}>
              <Text style={styles.ratingTitle} numberOfLines={1}>
                {rating.movie.title}
              </Text>
              <Text style={styles.ratingDate}>
                {new Date(rating.updatedAt).toLocaleDateString('he-IL')}
              </Text>
            </View>
            {rating.movie.imageUrl ? (
              <Image source={{ uri: rating.movie.imageUrl }} style={styles.ratingPoster} />
            ) : (
              <View style={[styles.ratingPoster, styles.ratingPosterFallback]}>
                <Text style={styles.ratingPosterLetter}>{rating.movie.title.charAt(0)}</Text>
              </View>
            )}
          </View>
        ))}
      </View>

      {/* Logout */}
      <Pressable onPress={handleLogout} style={styles.logoutButton}>
        <Text style={styles.logoutText}>התנתקות</Text>
      </Pressable>

      <View style={{ height: 32 }} />
    </ScrollView>

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
    alignItems: 'center',
    paddingBottom: 24,
    gap: 4,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  avatarText: {
    color: colors.white,
    fontSize: 26,
    fontWeight: '900',
  },
  headerName: {
    color: colors.white,
    fontSize: 20,
    fontWeight: '900',
  },
  headerEmail: {
    color: colors.white,
    opacity: 0.85,
    fontSize: 13,
  },
  adminBadge: {
    backgroundColor: colors.badge,
    borderRadius: 11,
    paddingHorizontal: 10,
    paddingVertical: 3,
    marginTop: 6,
  },
  adminBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textDark,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 16,
    marginTop: -16,
  },
  statTile: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    paddingVertical: 12,
  },
  statValue: {
    fontSize: 22,
    fontWeight: '900',
    color: colors.primary,
  },
  statLabel: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  error: {
    color: colors.danger,
    fontSize: 13,
    textAlign: 'center',
    padding: 8,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    margin: 16,
    marginBottom: 0,
    padding: 16,
    gap: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.text,
    textAlign: 'right',
  },
  saveMessage: {
    fontSize: 13,
    textAlign: 'right',
  },
  saveButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  saveButtonText: {
    color: colors.white,
    fontSize: 15,
    fontWeight: '700',
  },
  emptyRatings: {
    fontSize: 13,
    color: colors.textMuted,
    textAlign: 'right',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  ratingPoster: {
    width: 38,
    height: 54,
    borderRadius: 6,
    backgroundColor: colors.primarySoft,
  },
  ratingPosterFallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  ratingPosterLetter: {
    fontWeight: '800',
    color: colors.primary,
  },
  ratingDetails: {
    flex: 1,
    alignItems: 'flex-end',
  },
  ratingTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
  },
  ratingDate: {
    fontSize: 12,
    color: colors.textFaint,
  },
  deleteRating: {
    fontSize: 14,
    color: colors.textFaint,
    paddingHorizontal: 2,
  },
  logoutButton: {
    margin: 16,
    marginBottom: 0,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.danger,
    paddingVertical: 12,
    alignItems: 'center',
  },
  logoutText: {
    color: colors.danger,
    fontSize: 15,
    fontWeight: '700',
  },
});
