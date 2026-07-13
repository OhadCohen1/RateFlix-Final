import { View, Text, Pressable, StyleSheet } from 'react-native';
import { colors, MAX_STARS } from '../constants/theme';

interface StarRatingProps {
  value: number;
  /** אם נשלח handler, הכוכבים לחיצים */
  onChange?: (score: number) => void;
  size?: number;
}

const StarRating = ({ value, onChange, size = 20 }: StarRatingProps) => {
  return (
    <View style={styles.row}>
      {Array.from({ length: MAX_STARS }, (_, i) => {
        const score = i + 1;
        const filled = score <= value;
        const star = (
          <Text style={{ fontSize: size, color: filled ? colors.star : colors.starEmpty }}>
            ★
          </Text>
        );
        if (!onChange) {
          return <View key={score}>{star}</View>;
        }
        return (
          <Pressable
            key={score}
            onPress={() => onChange(score)}
            hitSlop={6}
            accessibilityRole="radio"
            accessibilityLabel={`${score} כוכבים`}
            accessibilityState={{ checked: score === value }}
          >
            {star}
          </Pressable>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 2,
  },
});

export default StarRating;
