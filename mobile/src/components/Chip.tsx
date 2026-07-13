import { Pressable, Text, StyleSheet } from 'react-native';
import { colors } from '../constants/theme';

interface ChipProps {
  label: string;
  active: boolean;
  onPress: () => void;
}

const CHIP_HEIGHT = 34;

const Chip = ({ label, active, onPress }: ChipProps) => (
  <Pressable
    onPress={onPress}
    style={[styles.chip, active && styles.chipActive]}
    accessibilityRole="button"
    accessibilityState={{ selected: active }}
  >
    <Text style={[styles.label, active && styles.labelActive]} numberOfLines={1}>
      {label}
    </Text>
  </Pressable>
);

const styles = StyleSheet.create({
  chip: {
    height: CHIP_HEIGHT,
    // iOS clips inner content when borderRadius exceeds half the height -
    // keep it exactly height/2 so the label stays visible
    borderRadius: CHIP_HEIGHT / 2,
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  label: {
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '600',
    color: colors.text,
    textAlign: 'center',
  },
  labelActive: {
    color: colors.white,
  },
});

export default Chip;
