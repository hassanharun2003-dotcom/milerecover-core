import React from 'react';
import { Text } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { layout, spacing, touchTarget } from '@milerecover/config';
import { HomeScreen } from '../screens/home/HomeScreen';
import { ReviewScreen } from '../screens/review/ReviewScreen';
import { ProofScreen } from '../screens/proof/ProofScreen';
import { ProfileScreen } from '../screens/profile/ProfileScreen';
import { useAppTheme } from '../design-system/ThemeProvider';
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

function TabLabel({
  label,
  focused,
  activeColor,
  inactiveColor,
}: {
  label: string;
  focused: boolean;
  activeColor: string;
  inactiveColor: string;
}) {
  return (
    <Text
      style={{
        fontSize: 11,
        color: focused ? activeColor : inactiveColor,
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
  const { palette } = useAppTheme();
  const { state, permissions, automaticCaptureAvailable } = useApp();
  const { product } = useProduct();
  const pendingCount = selectProductExperience(
    state,
    product,
    permissions,
    automaticCaptureAvailable,
  ).activeReviewItems.length;
  const bottomPad = Math.max(insets.bottom, spacing.sm);
  // Figma BottomNav frame is 72pt; add remaining home-indicator inset beyond the design pad.
  const tabBarHeight = layout.tabBarH + Math.max(0, bottomPad - spacing.sm);

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: palette.tab.active,
        tabBarInactiveTintColor: palette.tab.inactive,
        tabBarHideOnKeyboard: true,
        tabBarStyle: {
          borderTopColor: palette.border.default,
          backgroundColor: palette.tab.bar,
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
          tabBarLabel: ({ focused }) => (
            <TabLabel
              label="Home"
              focused={focused}
              activeColor={palette.tab.active}
              inactiveColor={palette.tab.inactive}
            />
          ),
        }}
      />
      <Tab.Screen
        name="Review"
        component={ReviewScreen}
        options={{
          tabBarAccessibilityLabel: 'Review tab',
          tabBarBadge: pendingCount > 0 ? pendingCount : undefined,
          tabBarBadgeStyle: {
            backgroundColor: palette.action.primary,
            color: palette.action.primaryText,
          },
          tabBarLabel: ({ focused }) => (
            <TabLabel
              label="Review"
              focused={focused}
              activeColor={palette.tab.active}
              inactiveColor={palette.tab.inactive}
            />
          ),
        }}
      />
      <Tab.Screen
        name="Proof"
        component={ProofScreen}
        options={{
          tabBarAccessibilityLabel: 'Proof tab',
          tabBarLabel: ({ focused }) => (
            <TabLabel
              label="Proof"
              focused={focused}
              activeColor={palette.tab.active}
              inactiveColor={palette.tab.inactive}
            />
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarAccessibilityLabel: 'Profile tab',
          tabBarLabel: ({ focused }) => (
            <TabLabel
              label="Profile"
              focused={focused}
              activeColor={palette.tab.active}
              inactiveColor={palette.tab.inactive}
            />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

/** Exported for tests — locked four-tab IA. */
export { ROOT_TAB_ROUTE_NAMES };
