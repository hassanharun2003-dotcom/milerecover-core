import React, { useState } from 'react';
import { Text, View } from 'react-native';
import Constants from 'expo-constants';
import { spacing } from '@milerecover/config';
import {
  EvidenceRow,
  ListSection,
  PrimaryButton,
  ScrollScreen,
  SectionHeader,
  StatusCard,
  text,
} from '../../design-system';
import { APP_BUILD_LABEL, PREVIEW_CHANNEL_MARKER } from '../../constants/buildInfo';
import { readUpdateMetadata } from '../../updates/appUpdates';
import { useAppUpdates } from '../../updates/UpdateProvider';

export function AboutScreen() {
  const { updatesActive, checkForUpdates, applyUpdate, updateReady } = useAppUpdates();
  const [checking, setChecking] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const meta = readUpdateMetadata();
  const variant = Constants.expoConfig?.extra?.appVariant ?? 'development';

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
        title="Mileage protection"
        body="Protect every work mile. Track what matters. Find what others miss."
      />
      <ListSection title="Build information">
        <EvidenceRow label="App version" value={Constants.expoConfig?.version ?? '—'} />
        <EvidenceRow label="Build label" value={APP_BUILD_LABEL} />
        <EvidenceRow label="Preview marker" value={PREVIEW_CHANNEL_MARKER} />
        <EvidenceRow label="Build type" value={String(variant)} />
        {updatesActive ? (
          <>
            <EvidenceRow label="Runtime version" value={meta.runtimeVersion ?? '—'} />
            <EvidenceRow label="Update channel" value={meta.channel ?? '—'} />
            <EvidenceRow label="Update id" value={meta.updateId ? meta.updateId.slice(0, 8) + '…' : 'Embedded'} />
          </>
        ) : null}
      </ListSection>
      {updatesActive ? (
        <View style={{ gap: spacing.sm }}>
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
        <Text style={text.caption}>Updates are managed through your development tools in this build.</Text>
      )}
    </ScrollScreen>
  );
}
