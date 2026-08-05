import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import type { DemoScenario } from '../fixtures/scenarios';
import { createInitialProductUiState, type ProductUiState } from '../product/types';
import { createPreviewPersistenceRepository } from '../persistence/AsyncStoragePersistenceRepository';
import { AppProvider } from '../store/AppContext';
import { ProductProvider } from '../product/ProductContext';
import { UpdateProvider } from '../updates/UpdateProvider';
import { ThemeProvider } from '../design-system/ThemeProvider';
import { HomeScreen } from '../screens/home/HomeScreen';
import { ReviewScreen } from '../screens/review/ReviewScreen';
import { ProofScreen } from '../screens/proof/ProofScreen';
import { ProfileScreen } from '../screens/profile/ProfileScreen';
import { OnboardingFlow } from '../screens/onboarding/OnboardingFlow';
import { BringExistingMileageScreen } from '../screens/import/BringExistingMileageScreen';
import { ImportPreviewScreen } from '../screens/import/ImportPreviewScreen';
import {
  ComingLaterScreen,
  ExportReportScreen,
  HelpSupportScreen,
  ManualTripScreen,
  MissingTripRecoveryScreen,
  PlanSelectionScreen,
  ProtectionAlertScreen,
  PrivacyScreen,
  ReportPreviewScreen,
  TermsScreen,
  TrackingActiveScreen,
  TripDetailsScreen,
  VehicleSetupScreen,
  WorkLocationSetupScreen,
} from '../screens/flows/SupportingScreens';
import { AboutScreen } from '../screens/about/AboutScreen';
import { EditSetupScreen } from '../screens/profile/EditSetupScreen';
import type { RootStackParamList, RootTabParamList } from '../navigation/types';
import { extractVisibleCopy } from './extractText';

const SAFE_AREA_METRICS = {
  insets: { top: 0, right: 0, bottom: 0, left: 0 },
  frame: { x: 0, y: 0, width: 390, height: 844 },
};

function TestProviders({ children, product }: { children: React.ReactNode; product: ProductUiState }) {
  return (
    <SafeAreaProvider initialMetrics={SAFE_AREA_METRICS}>
      <ThemeProvider>
        <AppProvider repository={createPreviewPersistenceRepository()}>
          <ProductProvider initialState={product} skipHydration>
            <UpdateProvider>{children}</UpdateProvider>
          </ProductProvider>
        </AppProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<RootTabParamList>();

async function flushUpdates() {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
}

function MainTabs() {
  return (
    <Tab.Navigator screenOptions={{ headerShown: false }}>
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Review" component={ReviewScreen} />
      <Tab.Screen name="Proof" component={ProofScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

export function productStateForScenario(scenario: DemoScenario, extra?: Partial<ProductUiState>): ProductUiState {
  return {
    ...createInitialProductUiState(),
    demoModeEnabled: true,
    demoScenario: scenario,
    ...extra,
  };
}

export async function renderMainTabs(scenario: DemoScenario, extra?: Partial<ProductUiState>) {
  let tree!: TestRenderer.ReactTestRenderer;
  const initial = {
    ...createInitialProductUiState(),
    demoModeEnabled: true,
    demoScenario: scenario,
    ...extra,
  };
  await act(async () => {
    tree = TestRenderer.create(
      <TestProviders product={initial}>
        <NavigationContainer>
          <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="MainTabs" component={MainTabs} />
            <Stack.Screen name="ManualTrip" component={ManualTripScreen} />
            <Stack.Screen name="ProtectionAlert" component={ProtectionAlertScreen} />
            <Stack.Screen name="BringExistingMileage" component={BringExistingMileageScreen} />
            <Stack.Screen name="ImportPreview" component={ImportPreviewScreen} />
            <Stack.Screen name="TripDetails" component={TripDetailsScreen} />
            <Stack.Screen name="MissingTripRecovery" component={MissingTripRecoveryScreen} />
            <Stack.Screen name="ExportReport" component={ExportReportScreen} />
            <Stack.Screen name="ReportPreview" component={ReportPreviewScreen} />
            <Stack.Screen name="PlanSelection" component={PlanSelectionScreen} />
            <Stack.Screen name="EditSetup" component={EditSetupScreen} />
            <Stack.Screen name="Privacy" component={PrivacyScreen} />
            <Stack.Screen name="HelpSupport" component={HelpSupportScreen} />
          </Stack.Navigator>
        </NavigationContainer>
      </TestProviders>,
    );
  });
  await flushUpdates();
  return { copy: extractVisibleCopy(tree.toJSON()), tree };
}

export async function renderStackScreen(
  name: keyof RootStackParamList,
  params?: RootStackParamList[keyof RootStackParamList],
  product?: Partial<ProductUiState>,
) {
  let tree!: TestRenderer.ReactTestRenderer;
  const initial = { ...createInitialProductUiState(), ...product };
  const screens: Record<string, React.ComponentType<any>> = {
    ManualTrip: ManualTripScreen,
    TripDetails: TripDetailsScreen,
    MissingTripRecovery: MissingTripRecoveryScreen,
    ProtectionAlert: ProtectionAlertScreen,
    TrackingActive: TrackingActiveScreen,
    BringExistingMileage: BringExistingMileageScreen,
    ImportPreview: ImportPreviewScreen,
    ExportReport: ExportReportScreen,
    ReportPreview: ReportPreviewScreen,
    PlanSelection: PlanSelectionScreen,
    EditSetup: EditSetupScreen,
    Privacy: PrivacyScreen,
    Terms: TermsScreen,
    HelpSupport: HelpSupportScreen,
    VehicleSetup: VehicleSetupScreen,
    WorkLocationSetup: WorkLocationSetupScreen,
    ComingLater: ComingLaterScreen,
    About: AboutScreen,
  };
  const Component = screens[name as string];
  await act(async () => {
    tree = TestRenderer.create(
      <TestProviders product={initial}>
        <NavigationContainer>
          <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name={name} component={Component} initialParams={params as never} />
          </Stack.Navigator>
        </NavigationContainer>
      </TestProviders>,
    );
  });
  await flushUpdates();
  return { copy: extractVisibleCopy(tree.toJSON()), tree };
}

export async function renderTab(scenario: DemoScenario, tab: keyof RootTabParamList, extra?: Partial<ProductUiState>) {
  let tree!: TestRenderer.ReactTestRenderer;
  const initial = {
    ...createInitialProductUiState(),
    demoModeEnabled: true,
    demoScenario: scenario,
    ...extra,
  };
  await act(async () => {
    tree = TestRenderer.create(
      <TestProviders product={initial}>
        <NavigationContainer>
          <Tab.Navigator screenOptions={{ headerShown: false }} initialRouteName={tab}>
            <Tab.Screen name="Home" component={HomeScreen} />
            <Tab.Screen name="Review" component={ReviewScreen} />
            <Tab.Screen name="Proof" component={ProofScreen} />
            <Tab.Screen name="Profile" component={ProfileScreen} />
          </Tab.Navigator>
        </NavigationContainer>
      </TestProviders>,
    );
  });
  await flushUpdates();
  return { copy: extractVisibleCopy(tree.toJSON()), tree };
}

export async function renderOnboarding(
  step: ProductUiState['onboardingStep'],
  extra?: Partial<ProductUiState>,
) {
  let tree!: TestRenderer.ReactTestRenderer;
  const base = createInitialProductUiState();
  const initial = { ...base, onboarding: { ...base.onboarding, currentStep: step }, onboardingStep: step, ...extra };
  await act(async () => {
    tree = TestRenderer.create(
      <TestProviders product={initial}>
        <OnboardingFlow />
      </TestProviders>,
    );
  });
  await flushUpdates();
  return { copy: extractVisibleCopy(tree.toJSON()), tree };
}

/** Android-like insets for safe-area shell evidence. */
export async function renderOnboardingWithInsets(
  step: ProductUiState['onboardingStep'],
  insets: { top: number; bottom: number; left?: number; right?: number },
  extra?: Partial<ProductUiState>,
) {
  let tree!: TestRenderer.ReactTestRenderer;
  const base = createInitialProductUiState();
  const initial = { ...base, onboarding: { ...base.onboarding, currentStep: step }, onboardingStep: step, ...extra };
  await act(async () => {
    tree = TestRenderer.create(
      <SafeAreaProvider
        initialMetrics={{
          insets: {
            top: insets.top,
            bottom: insets.bottom,
            left: insets.left ?? 0,
            right: insets.right ?? 0,
          },
          frame: { x: 0, y: 0, width: 360, height: 640 },
        }}
      >
        <AppProvider repository={createPreviewPersistenceRepository()}>
          <ProductProvider initialState={initial} skipHydration>
            <UpdateProvider>
              <OnboardingFlow />
            </UpdateProvider>
          </ProductProvider>
        </AppProvider>
      </SafeAreaProvider>,
    );
  });
  await flushUpdates();
  return { copy: extractVisibleCopy(tree.toJSON()), tree };
}
