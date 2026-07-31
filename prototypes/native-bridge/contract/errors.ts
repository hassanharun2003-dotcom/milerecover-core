import { BRIDGE_API_VERSION, CONTRACT_MAJOR_VERSION } from './constants';
import type { BridgeErrorCode, BridgeErrorEnvelope } from './types';

export function createBridgeError(
  code: BridgeErrorCode,
  message: string,
  options: {
    retryable?: boolean;
    affectedEventIds?: string[];
    nativeComponent?: string;
  } = {},
): BridgeErrorEnvelope {
  return {
    code,
    message,
    retryable: options.retryable ?? defaultRetryable(code),
    affectedEventIds: options.affectedEventIds ?? [],
    nativeComponent: options.nativeComponent ?? 'prototype-bridge',
    contractVersion: String(CONTRACT_MAJOR_VERSION),
  };
}

function defaultRetryable(code: BridgeErrorCode): boolean {
  switch (code) {
    case 'buffer_unavailable':
    case 'persistence_failure':
    case 'fetch_failure':
    case 'acknowledgment_failure':
    case 'serialization_failure':
    case 'bridge_unavailable':
      return true;
    default:
      return false;
  }
}

export function bridgeErrorToDisplay(error: BridgeErrorEnvelope): string {
  return `[${error.code}] ${error.message} (bridge ${BRIDGE_API_VERSION})`;
}
