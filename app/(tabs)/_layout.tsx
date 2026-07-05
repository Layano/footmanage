import { Tabs } from 'expo-router';
import { Users, Globe, Wallet, Mail, Trophy } from 'lucide-react-native';

import { TutorialOverlay } from '@/components/TutorialOverlay';
import { theme } from '@/constants/theme';
import { isTabLockedDuringTutorial, useGameStore } from '@/store/useGameStore';

export default function TabLayout() {
  const isTutorialActive = useGameStore((s) => s.isTutorialActive);
  const tutorialStep = useGameStore((s) => s.tutorialStep);

  const tabHref = (name: 'index' | 'players' | 'scouting' | 'finance' | 'competitions') => {
    if (isTabLockedDuringTutorial(name, isTutorialActive, tutorialStep)) {
      return null;
    }
    return undefined;
  };

  return (
    <>
      <Tabs
        screenOptions={{
          headerShown: true,
          headerStyle: { backgroundColor: theme.colors.surface },
          headerTintColor: theme.colors.text,
          headerTitleStyle: { fontWeight: '600' },
          tabBarStyle: {
            backgroundColor: theme.colors.surface,
            borderTopColor: theme.colors.border,
          },
          tabBarActiveTintColor: theme.colors.primary,
          tabBarInactiveTintColor: theme.colors.textMuted,
        }}>
        <Tabs.Screen
          name="index"
          options={{
            title: 'Boîte mail',
            href: tabHref('index'),
            tabBarIcon: ({ color, size }) => <Mail color={color} size={size} />,
          }}
        />
        <Tabs.Screen
          name="players"
          options={{
            title: 'Mes Joueurs',
            href: tabHref('players'),
            tabBarIcon: ({ color, size }) => <Users color={color} size={size} />,
          }}
        />
        <Tabs.Screen
          name="scouting"
          options={{
            title: 'Scouting',
            href: tabHref('scouting'),
            tabBarIcon: ({ color, size }) => <Globe color={color} size={size} />,
          }}
        />
        <Tabs.Screen
          name="competitions"
          options={{
            title: 'Compétitions',
            href: tabHref('competitions'),
            tabBarIcon: ({ color, size }) => <Trophy color={color} size={size} />,
          }}
        />
        <Tabs.Screen
          name="finance"
          options={{
            title: 'Finances',
            href: tabHref('finance'),
            tabBarIcon: ({ color, size }) => <Wallet color={color} size={size} />,
          }}
        />
      </Tabs>
      <TutorialOverlay />
    </>
  );
}
