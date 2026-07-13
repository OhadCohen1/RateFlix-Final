import { View, Text, Image, Pressable, StyleSheet } from 'react-native';
import type { Item } from '../types';
import { colors, MAX_STARS } from '../constants/theme';
import StarRating from './StarRating';

interface MovieCardProps {
  item: Item;
  /** הציון שהמשתמש נתן (אם קיים) */
  userScore?: number;
  /** אם נשלח handler, דירוג הכוכבים לחיץ */
  onRate?: (itemId: string, score: number) => void;
  onDeleteRating?: (itemId: string) => void;
  /** מצב המלצות: תג מיקום + פס התאמה */
  rank?: number;
}

const MovieCard = ({ item, userScore, onRate, onDeleteRating, rank }: MovieCardProps) => {
  const subtitle = [item.year, item.categoryName].filter(Boolean).join(' • ');
  const matchPercent = Math.round(((item.predictedScore ?? item.avgRating) / MAX_STARS) * 100);

  return (
    <View style={styles.card}>
      {/* פוסטר */}
      <View style={styles.posterWrap}>
        {item.imageUrl ? (
          <Image source={{ uri: item.imageUrl }} style={styles.poster} resizeMode="cover" />
        ) : (
          <View style={[styles.poster, styles.posterFallback]}>
            <Text style={styles.posterLetter}>{item.name.charAt(0)}</Text>
          </View>
        )}
        {rank !== undefined && (
          <View style={styles.rankBadge}>
            <Text style={styles.rankText}>#{rank}</Text>
          </View>
        )}
      </View>

      {/* פרטים */}
      <View style={styles.details}>
        <Text style={styles.title} numberOfLines={1}>
          {item.name}
        </Text>
        {!!subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
        {!!item.description && (
          <Text style={styles.description} numberOfLines={2}>
            {item.description}
          </Text>
        )}

        {item.ratingCount > 0 && (
          <View style={styles.avgRow}>
            <StarRating value={Math.round(item.avgRating)} size={15} />
            <Text style={styles.avgText}>
              {item.avgRating.toFixed(1)} ({item.ratingCount})
            </Text>
          </View>
        )}

        {rank !== undefined ? (
          /* פס התאמה במצב המלצות */
          <View style={styles.matchWrap}>
            <Text style={styles.matchText}>{matchPercent}% התאמה</Text>
            <View style={styles.matchTrack}>
              <View style={[styles.matchFill, { width: `${matchPercent}%` }]} />
            </View>
          </View>
        ) : (
          onRate && (
            <View style={styles.myRatingRow}>
              <Text style={styles.myRatingLabel}>הדירוג שלי:</Text>
              <StarRating value={userScore ?? 0} onChange={(s) => onRate(item.id, s)} size={19} />
              {!!userScore && onDeleteRating && (
                <Pressable onPress={() => onDeleteRating(item.id)} hitSlop={8}>
                  <Text style={styles.deleteRating}>✕</Text>
                </Pressable>
              )}
            </View>
          )
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 10,
    gap: 12,
  },
  posterWrap: {
    position: 'relative',
  },
  poster: {
    width: 92,
    height: 132,
    borderRadius: 10,
    backgroundColor: colors.primarySoft,
  },
  posterFallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  posterLetter: {
    fontSize: 36,
    fontWeight: '900',
    color: colors.primary,
  },
  rankBadge: {
    position: 'absolute',
    top: 6,
    left: 6,
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  rankText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: '700',
  },
  details: {
    flex: 1,
    alignItems: 'flex-end',
    gap: 4,
  },
  title: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.text,
    textAlign: 'right',
  },
  subtitle: {
    fontSize: 13,
    color: colors.textMuted,
    textAlign: 'right',
  },
  description: {
    fontSize: 13,
    lineHeight: 19,
    color: colors.textMuted,
    textAlign: 'right',
  },
  avgRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  avgText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
  },
  myRatingRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  myRatingLabel: {
    fontSize: 13,
    color: colors.textMuted,
  },
  deleteRating: {
    fontSize: 14,
    color: colors.textFaint,
    paddingHorizontal: 4,
  },
  matchWrap: {
    width: '100%',
    marginTop: 6,
    gap: 4,
  },
  matchText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.success,
    textAlign: 'right',
  },
  matchTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.border,
    overflow: 'hidden',
  },
  matchFill: {
    height: '100%',
    borderRadius: 3,
    backgroundColor: colors.success,
    alignSelf: 'flex-end',
  },
});

export default MovieCard;
