import { prioritizeReviewItems } from '@milerecover/domain';
import type { PermissionSnapshot } from '@milerecover/domain';
import { DEMO_SCENARIOS, type DemoScenario, type ScenarioPresentation } from '../fixtures/scenarios';
import type { PlanTier } from '../fixtures/subscription';
import { scenarioForPlan } from '../fixtures/scenarios';
import type { MileRecoverAppState } from '../store/types';
import type { ProductUiState, ReviewDecision } from './types';

export interface ProductExperience {
  scenario: ScenarioPresentation;
  activeReviewItems: ReturnType<typeof prioritizeReviewItems>;
  pendingReviewCount: number;
  reviewedCount: number;
}

export function resolveScenario(
  product: ProductUiState,
  appState: MileRecoverAppState
): DemoScenario {
  if (!appState.onboardingComplete && product.demoScenario !== 'new_user') {
    return product.demoScenario;
  }
  if (appState.trips.length === 0 && appState.reviewItems.length === 0 && product.demoScenario === 'new_user') {
    return 'new_user';
  }
  return product.demoScenario;
}

export function selectProductExperience(
  appState: MileRecoverAppState,
  product: ProductUiState,
  _permissions: PermissionSnapshot
): ProductExperience {
  const scenarioKey = resolveScenario(product, appState);
  const scenario = DEMO_SCENARIOS[scenarioKey] ?? DEMO_SCENARIOS.fully_protected;

  const baseItems =
    appState.reviewItems.length > 0 ? appState.reviewItems : scenario.reviewItems;

  const activeReviewItems = prioritizeReviewItems(
    baseItems.filter((item) => !product.reviewDecisions[item.id])
  );

  const reviewedCount = product.reviewedHistory.length;

  return {
    scenario,
    activeReviewItems,
    pendingReviewCount: activeReviewItems.length,
    reviewedCount,
  };
}

export function applyPlanScenario(product: ProductUiState, plan: PlanTier): DemoScenario {
  return scenarioForPlan(plan);
}

export function reviewDecisionLabel(decision: ReviewDecision): string {
  switch (decision) {
    case 'work':
      return 'Work';
    case 'personal':
      return 'Personal';
    case 'not_drive':
      return 'Not a drive';
    default:
      return 'Pending';
  }
}
