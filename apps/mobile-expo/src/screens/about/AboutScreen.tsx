import React, { useState } from 'react';
import { Text, View } from 'react-native';
import Constants from 'expo-constants';
import { spacing } from '@milerecover/config';
import {
  EvidenceRow,
  ListSection,
  PrimaryButton,
  ScrollScreen,
  SecondaryButton,
  SectionHeader,
  StatusCard,
  text,
} from '../../design-system';
import {
  APP_BUILD_LABEL,
  APP_PACKAGE_ID,
  PREVIEW_CHANNEL_MARKER,
} from '../../constants/buildInfo';
import { readUpdateMetadata } from '../../updates/appUpdates';
import { useAppUpdates } from '../../updates/UpdateProvider';
import { useApp } from '../../store/AppContext';
import { useProduct } from '../../product/ProductContext';

export function AboutScreen() {
  const { updatesActive, checkForUpdates, applyUpdate, updateReady } = useAppUpdates();
  const { restartOnboarding } = useApp();
  const { resetOnboarding } = useProduct();
  const [checking, setChecking] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const meta = readUpdateMetadata();
  const variant = Constants.expoConfig?.extra?.appVariant ?? 'development';
  const gitCommit =
    (Constants.expoConfig?.extra?.gitCommitHash as string | undefined) ?? 'unknown';
  const shortCommit = gitCommit.length > 12 ? gitCommit.slice(0, 12) : gitCommit;
  const runtimeVersion =
    meta.runtimeVersion ?? Constants.expoConfig?.version ?? '—';
  const channel = meta.channel ?? (variant === 'preview' || variant === 'production' ? variant : '—');

  const onCheck = async () => {
    setChecking(true);
    setStatusMessage(null);
    const downloaded = await checkForUpdates();
    if (downloaded) setStatusMessage('An update was downloaded. Restart MileRecover to apply it.');
    else setStatusMessage('You are on the latest compatible version.');
    setChecking(false);
  };

  return (
    <ScrollScreen>
      <SectionHeader title="About MileRecover" />
      <StatusCard
        variant="info"
        title="Quietly protecting your work miles"
        body="We help you keep every legitimate work mile—and show it clearly when you need to. Never invent miles."
        emphasis="subtle"
      />
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
            value={meta.updateId ? meta.updateId.slice(0, 8) + '…' : 'Built-in'}
          />
        ) : null}
      </ListSection>
      <SecondaryButton
        label="Restart onboarding"
        onPress={() => {
          // Full onboarding reset (vehicles/places/setup). Trips stay on device.
          resetOnboarding({ keepVehicles: false });
          restartOnboarding();
        }}
        accessibilityLabel="Restart onboarding from the beginning"
      />
      {updatesActive ? (
        <View style={{ gap: spacing.sm, marginTop: spacing.md }}>
          <PrimaryButton
            label={checking ? 'Checking…' : 'Check for updates'}
            onPress={() => void onCheck()}
            loading={checking}
            disabled={checking}
          />
          {updateReady ? (
            <PrimaryButton label="Restart to apply update" onPress={() => void applyUpdate()} />
          ) : null}
          {statusMessage ? <Text style={text.body}>{statusMessage}</Text> : null}
        </View>
      ) : (
        <Text style={[text.caption, { marginTop: spacing.md }]}>
          Updates are managed through your development tools in this build.
        </Text>
      )}
    </ScrollScreen>
  );
}
