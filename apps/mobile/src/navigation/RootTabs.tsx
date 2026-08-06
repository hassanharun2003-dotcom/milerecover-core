import React from 'react';
import { Text } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { colors } from '@milerecover/config';
import { HomeScreen } from '../screens/home/HomeScreen';
import { ReviewScreen } from '../screens/review/ReviewScreen';
import { ManualTripScreen } from '../screens/manual/ManualTripScreen';
import { ProofScreen } from '../screens/proof/ProofScreen';
import { ProfileScreen } from '../screens/profile/ProfileScreen';

export type RootTabParamList = {
  Home: undefined;
  Review: undefined;
  Add: undefined;
  Proof: undefined;
  Profile: undefined;
};

const Tab = createBottomTabNavigator<RootTabParamList>();

function TabLabel({ label, focused }: { label: string; focused: boolean }) {
  return (
    <Text
      style={{
        fontSize: 11,
        color: focused ? colors.forest[700] : colors.neutral[500],
        fontWeight: focused ? '600' : '400',
      }}
      accessibilityRole="text"
    >
      {label}
    </Text>
  );
}

export function RootTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.forest[700],
        tabBarInactiveTintColor: colors.neutral[500],
        tabBarStyle: { borderTopColor: colors.border.default },
      }}
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
          tabBarLabel: ({ focused }) => <TabLabel label="Review" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Add"
        component={ManualTripScreen}
        options={{
          tabBarAccessibilityLabel: 'Add manual trip',
          tabBarLabel: ({ focused }) => <TabLabel label="Add" focused={focused} />,
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
