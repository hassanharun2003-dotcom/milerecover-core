import type { NavigatorScreenParams } from '@react-navigation/native';

export const SUPPORTING_STACK_ROUTES = [
  'TripDetails',
  'MissingTripRecovery',
  'MissingDrivesIntro',
  'ProtectionAlert',
  'TrackingActive',
  'BringExistingMileage',
  'ImportPreview',
  'ImportExceptionReview',
  'VehicleSetup',
  'WorkLocationSetup',
  'ComingLater',
  'ExportReport',
  'ReportPreview',
  'PlanSelection',
  'EditSetup',
  'Privacy',
  'Terms',
  'HelpSupport',
  'About',
  'Diagnostics',
  'RescueProducts',
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
  ManualTrip: { tripId?: string; preferWork?: boolean } | undefined;
  TripDetails: { tripId: string };
  MissingTripRecovery: { reviewId: string };
  MissingDrivesIntro: undefined;
  ProtectionAlert: undefined;
  TrackingActive: undefined;
  BringExistingMileage: undefined;
  ImportPreview: undefined;
  ImportExceptionReview: undefined;
  VehicleSetup: undefined;
  WorkLocationSetup: undefined;
  ComingLater: { title: string; detail: string };
  ExportReport: undefined;
  ReportPreview: { format: 'csv' | 'pdf' | 'reimbursement' | 'log' };
  PlanSelection: { source?: 'profile' | 'upgrade' };
  EditSetup: undefined;
  Privacy: undefined;
  Terms: undefined;
  HelpSupport: undefined;
  About: undefined;
  Diagnostics: undefined;
  RescueProducts: undefined;
};
