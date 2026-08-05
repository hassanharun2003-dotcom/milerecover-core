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
  APP_PACKAGE_ID,
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
  const shortCommit = gitCommit.length > 12 ? gitCommit.slice(0, 12) : gitCommit;
  const runtimeVersion = meta.runtimeVersion ?? Constants.expoConfig?.version ?? '—';
  const channel = meta.channel ?? (variant === 'preview' || variant === 'production' ? variant : '—');

  return (
    <ScrollScreen>
      <SectionHeader title="Diagnostics" />
      <Text style={[text.body, { marginBottom: spacing.md }]}>
        Internal build details for support and preview verification.
      </Text>
      <ListSection title="Build information">
        <EvidenceRow label="App version" value={Constants.expoConfig?.version ?? '—'} />
        <EvidenceRow label="Build label" value={APP_BUILD_LABEL} />
        <EvidenceRow label="Package" value={APP_PACKAGE_ID} />
        <EvidenceRow label="Build type" value={String(variant)} />
        <EvidenceRow label="Runtime" value={String(runtimeVersion)} />
        <EvidenceRow label="Update channel" value={String(channel)} />
        <EvidenceRow label="Embedded commit" value={shortCommit} />
        {PREVIEW_CHANNEL_MARKER ? (
          <EvidenceRow label="Preview marker" value={PREVIEW_CHANNEL_MARKER} />
        ) : null}
        {updatesActive ? (
          <EvidenceRow
            label="Latest update"
            value={meta.updateId ? `${meta.updateId.slice(0, 8)}…` : 'Built-in'}
          />
        ) : null}
      </ListSection>
    </ScrollScreen>
  );
}
