import { Tabs, Redirect } from 'expo-router';
import { Text, ActivityIndicator, View } from 'react-native';
import { useAuth } from '@/context/AuthContext';
import { colors } from '@/constants/theme';

const tabIcon = (emoji: string) =>
  function TabIcon({ focused }: { focused: boolean }) {
    return <Text style={{ fontSize: 20, opacity: focused ? 1 : 0.45 }}>{emoji}</Text>;
  };

export default function TabsLayout() {
  const { user, initializing } = useAuth();

  // Wait for the persisted session to restore before deciding where to go
  if (initializing) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!user) {
    return <Redirect href="/login" />;
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: { backgroundColor: colors.card, borderTopColor: colors.border },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{ title: 'קטלוג', tabBarIcon: tabIcon('🎬') }}
      />
      <Tabs.Screen
        name="recommendations"
        options={{ title: 'המלצות', tabBarIcon: tabIcon('⭐') }}
      />
      <Tabs.Screen
        name="profile"
        options={{ title: 'פרופיל', tabBarIcon: tabIcon('👤') }}
      />
    </Tabs>
  );
}
