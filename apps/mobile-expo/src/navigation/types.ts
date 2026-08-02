import type { NavigatorScreenParams } from '@react-navigation/native';

export const SUPPORTING_STACK_ROUTES = [
  'TripDetails',
  'MissingTripRecovery',
  'ProtectionAlert',
  'BringExistingMileage',
  'ImportPreview',
  'ImportExceptionReview',
  'VehicleSetup',
  'WorkLocationSetup',
  'ExportReport',
  'ReportPreview',
  'PlanSelection',
  'HelpSupport',
] as const;

export type SupportingStackRoute = (typeof SUPPORTING_STACK_ROUTES)[number];

export const ROOT_TAB_ROUTE_NAMES = ['Home', 'Review', 'Proof', 'Profile'] as const;

export const ROOT_STACK_ROUTE_NAMES = [
  'MainTabs',
  'ManualTrip',
  ...SUPPORTING_STACK_ROUTES,
] as const;

export type RootTabRouteName = (typeof ROOT_TAB_ROUTE_NAMES)[number];
export type RootStackRouteName = (typeof ROOT_STACK_ROUTE_NAMES)[number];

export type RootTabParamList = {
  Home: undefined;
  Review: undefined;
  Proof: undefined;
  Profile: undefined;
};

export type RootStackParamList = {
  MainTabs: NavigatorScreenParams<RootTabParamList> | undefined;
  ManualTrip: undefined;
  TripDetails: { tripId: string };
  MissingTripRecovery: { reviewId: string };
  ProtectionAlert: undefined;
  BringExistingMileage: undefined;
  ImportPreview: undefined;
  ImportExceptionReview: undefined;
  VehicleSetup: undefined;
  WorkLocationSetup: undefined;
  ExportReport: undefined;
  ReportPreview: { format: 'csv' | 'pdf' | 'reimbursement' | 'log' };
  PlanSelection: { source?: 'profile' | 'upgrade' };
  HelpSupport: undefined;
};
