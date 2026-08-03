import React from 'react';
import { Text } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { colors, spacing, touchTarget } from '@milerecover/config';
import { HomeScreen } from '../screens/home/HomeScreen';
import { ReviewScreen } from '../screens/review/ReviewScreen';
import { ProofScreen } from '../screens/proof/ProofScreen';
import { ProfileScreen } from '../screens/profile/ProfileScreen';
import { selectProductExperience } from '../product/selectors';
import { useApp } from '../store/AppContext';
import { useProduct } from '../product/ProductContext';
import { ROOT_TAB_ROUTE_NAMES, type RootTabParamList } from './types';

const Tab = createBottomTabNavigator<RootTabParamList>();

type IconName = React.ComponentProps<typeof Ionicons>['name'];

function tabIcon(name: 'Home' | 'Review' | 'Proof' | 'Profile', focused: boolean): IconName {
  switch (name) {
    case 'Home':
      return focused ? 'home' : 'home-outline';
    case 'Review':
      return focused ? 'checkmark-circle' : 'checkmark-circle-outline';
    case 'Proof':
      return focused ? 'document-text' : 'document-text-outline';
    case 'Profile':
      return focused ? 'person' : 'person-outline';
  }
}

function TabLabel({ label, focused }: { label: string; focused: boolean }) {
  return (
    <Text
      style={{
        fontSize: 11,
        color: focused ? colors.forest[700] : colors.neutral[500],
        fontWeight: focused ? '700' : '500',
      }}
      numberOfLines={1}
      allowFontScaling
      accessibilityRole="text"
    >
      {label}
    </Text>
  );
}

export function RootTabs() {
  const insets = useSafeAreaInsets();
  const { state, permissions, automaticCaptureAvailable } = useApp();
  const { product } = useProduct();
  const pendingCount = selectProductExperience(
    state,
    product,
    permissions,
    automaticCaptureAvailable,
  ).activeReviewItems.length;
  const bottomPad = Math.max(insets.bottom, spacing.sm);
  const tabBarHeight = 56 + bottomPad;

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.forest[700],
        tabBarInactiveTintColor: colors.neutral[500],
        tabBarHideOnKeyboard: true,
        tabBarStyle: {
          borderTopColor: colors.border.default,
          backgroundColor: colors.background.card,
          height: tabBarHeight,
          paddingTop: spacing.xs,
          paddingBottom: bottomPad,
        },
        tabBarItemStyle: { minHeight: touchTarget.minHeight },
        tabBarIcon: ({ focused, color, size }) => (
          <Ionicons
            name={tabIcon(route.name as 'Home' | 'Review' | 'Proof' | 'Profile', focused)}
            size={size ?? 22}
            color={color}
          />
        ),
      })}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarAccessibilityLabel: 'Home tab',
          tabBarLabel: ({ focused }) => <TabLabel label="Home" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Review"
        component={ReviewScreen}
        options={{
          tabBarAccessibilityLabel: 'Review tab',
          tabBarBadge: pendingCount > 0 ? pendingCount : undefined,
          tabBarBadgeStyle: { backgroundColor: colors.review[600] },
          tabBarLabel: ({ focused }) => <TabLabel label="Review" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Proof"
        component={ProofScreen}
        options={{
          tabBarAccessibilityLabel: 'Proof tab',
          tabBarLabel: ({ focused }) => <TabLabel label="Proof" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarAccessibilityLabel: 'Profile tab',
          tabBarLabel: ({ focused }) => <TabLabel label="Profile" focused={focused} />,
        }}
      />
    </Tab.Navigator>
  );
}

/** Exported for tests — locked four-tab IA. */
export { ROOT_TAB_ROUTE_NAMES };
