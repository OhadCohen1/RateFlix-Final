import { useEffect, useRef } from 'react';
import { Animated, Text, StyleSheet } from 'react-native';
import { colors } from '../constants/theme';

interface PopupProps {
  message: string;
  type?: 'error' | 'success';
  /** נקרא אחרי שהפופאפ נסגר אוטומטית */
  onDismiss: () => void;
  autoHideMs?: number;
}

// פופאפ קצר לפידבק מהיר למשתמש.
const Popup = ({ message, type = 'error', onDismiss, autoHideMs = 3000 }: PopupProps) => {
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(opacity, { toValue: 1, duration: 180, useNativeDriver: true }).start();

    const timer = setTimeout(() => {
      Animated.timing(opacity, { toValue: 0, duration: 180, useNativeDriver: true }).start(() =>
        onDismiss()
      );
    }, autoHideMs);

    return () => clearTimeout(timer);
  }, [opacity, autoHideMs, onDismiss]);

  return (
    <Animated.View
      style={[
        styles.popup,
        { opacity, backgroundColor: type === 'success' ? colors.success : colors.danger },
      ]}
      accessibilityLiveRegion="polite"
    >
      <Text style={styles.text}>{message}</Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  popup: {
    position: 'absolute',
    bottom: 24,
    left: 20,
    right: 20,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
    zIndex: 100,
  },
  text: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
});

export default Popup;
