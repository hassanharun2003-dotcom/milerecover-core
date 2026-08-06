import React from 'react';
import { Text } from 'react-native';
import Constants from 'expo-constants';
import { spacing } from '@milerecover/config';
import {
  EvidenceRow,
  ListSection,
  ScrollScreen,
  SectionHeader,
  text,
} from '../../design-system';
import {
  APP_BUILD_LABEL,
  APP_BUILD_TIMESTAMP,
  APP_PACKAGE_ID,
  APP_RUNTIME_VERSION,
  APP_UPDATE_CHANNEL,
  PREVIEW_CHANNEL_MARKER,
} from '../../constants/buildInfo';
import { readUpdateMetadata } from '../../updates/appUpdates';
import { useAppUpdates } from '../../updates/UpdateProvider';

export function DiagnosticsScreen() {
  const { updatesActive } = useAppUpdates();
  const meta = readUpdateMetadata();
  const variant = Constants.expoConfig?.extra?.appVariant ?? 'development';
  const gitCommit =
    (Constants.expoConfig?.extra?.gitCommitHash as string | undefined) ?? 'unknown';
  const buildTimestamp =
    (Constants.expoConfig?.extra?.buildTimestamp as string | undefined) ?? APP_BUILD_TIMESTAMP;
  const runtimeVersion =
    meta.runtimeVersion ??
    (Constants.expoConfig?.extra?.runtimeVersion as string | undefined) ??
    APP_RUNTIME_VERSION;
  const channel =
    meta.channel ??
    (Constants.expoConfig?.extra?.updateChannel as string | undefined) ??
    (variant === 'preview' ? APP_UPDATE_CHANNEL : variant === 'production' ? 'production' : '—');

  return (
    <ScrollScreen>
      <SectionHeader title="Diagnostics" />
      <Text style={[text.body, { marginBottom: spacing.md }]}>
        Internal build details for support and preview verification. Confirm these match the
        foundation-reset APK before reporting UI issues.
      </Text>
      <ListSection title="Build information">
        <EvidenceRow label="App version" value={Constants.expoConfig?.version ?? '—'} />
        <EvidenceRow label="Build label" value={APP_BUILD_LABEL} />
        <EvidenceRow label="Package" value={APP_PACKAGE_ID} />
        <EvidenceRow label="Build type" value={String(variant)} />
        <EvidenceRow label="Runtime" value={String(runtimeVersion)} />
        <EvidenceRow label="Update channel" value={String(channel)} />
        <EvidenceRow label="Embedded commit" value={gitCommit} />
        <EvidenceRow label="Build timestamp" value={String(buildTimestamp)} />
        <EvidenceRow
          label="Update ID"
          value={
            updatesActive && meta.updateId
              ? meta.updateId
              : meta.updateId
                ? meta.updateId
                : 'Built-in (no OTA applied)'
          }
        />
        {meta.createdAt ? <EvidenceRow label="Update created" value={String(meta.createdAt)} /> : null}
        {PREVIEW_CHANNEL_MARKER ? (
          <EvidenceRow label="Preview marker" value={PREVIEW_CHANNEL_MARKER} />
        ) : null}
      </ListSection>
    </ScrollScreen>
  );
}
