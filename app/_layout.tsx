import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { GameInitializer } from '@/components/GameInitializer';
import { theme } from '@/constants/theme';

export default function RootLayout() {
  return (
    <>
      <GameInitializer />
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: theme.colors.surface },
          headerTintColor: theme.colors.text,
          contentStyle: { backgroundColor: theme.colors.background },
        }}>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="new-game" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="player/[id]" options={{ title: 'Fiche joueur' }} />
      </Stack>
    </>
  );
}
