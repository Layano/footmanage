import { DarkTheme, Stack, ThemeProvider } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { GameInitializer } from '@/components/GameInitializer';
import { theme } from '@/constants/theme';

const navigationTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: theme.colors.background,
    card: theme.colors.surface,
    text: theme.colors.text,
    border: theme.colors.border,
    primary: theme.colors.primary,
  },
};

export default function RootLayout() {
  return (
    <ThemeProvider value={navigationTheme}>
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
        <Stack.Screen name="offer/[id]" options={{ title: 'Offre' }} />
        <Stack.Screen name="match/[id]" options={{ title: 'Match' }} />
        <Stack.Screen name="match/scout/[id]" options={{ title: 'Joueurs repérés' }} />
        <Stack.Screen name="club/[id]" options={{ title: 'Club' }} />
      </Stack>
    </ThemeProvider>
  );
}
