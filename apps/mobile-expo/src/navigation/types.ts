export const ROOT_TAB_ROUTE_NAMES = ['Home', 'Review', 'Proof', 'Profile'] as const;

export const ROOT_STACK_ROUTE_NAMES = ['MainTabs', 'ManualTrip'] as const;

export type RootTabRouteName = (typeof ROOT_TAB_ROUTE_NAMES)[number];

export type RootTabParamList = {
  Home: undefined;
  Review: undefined;
  Proof: undefined;
  Profile: undefined;
};

export type RootStackParamList = {
  MainTabs: undefined;
  ManualTrip: undefined;
};
