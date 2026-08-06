import React, { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { spacing } from '@milerecover/config';
import {
  ListRow,
  ListSection,
  PrimaryButton,
  ScrollScreen,
  SectionHeader,
  StatusCard,
  text,
} from '../../design-system';
import { APP_BUILD_LABEL, APP_VERSION } from '../../constants/buildInfo';
import type { RootStackParamList } from '../../navigation/types';
import { useAppUpdates } from '../../updates/UpdateProvider';

type AboutNav = NativeStackNavigationProp<RootStackParamList, 'About'>;

const RELEASE_NOTES =
  '0.2.7 startup.2: Updates NEVER on load; serialized onboarding persistence so Home survives force-stop; ErrorBoundary + deferred tracking.';

export function AboutScreen() {
  const navigation = useNavigation<AboutNav>();
  const { updatesActive, checkForUpdates, applyUpdate, updateReady } = useAppUpdates();
  const [checking, setChecking] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [versionTaps, setVersionTaps] = useState(0);

  const onCheck = async () => {
    setChecking(true);
    setStatusMessage(null);
    const downloaded = await checkForUpdates();
    if (downloaded) setStatusMessage('An update was downloaded. Restart MileRecover to apply it.');
    else setStatusMessage('You are on the latest compatible version.');
    setChecking(false);
  };

  const onVersionPress = () => {
    const next = versionTaps + 1;
    setVersionTaps(next);
    if (next >= 7) {
      setVersionTaps(0);
      navigation.navigate('Diagnostics');
    }
  };

  return (
    <ScrollScreen>
      <SectionHeader title="About MileRecover" />
      <StatusCard
        variant="info"
        title="Quietly protecting your work miles"
        body="We help you keep every legitimate work mile—and show it clearly when you need to."
        emphasis="subtle"
      />

      <ListSection title="App">
        <Pressable
          onPress={onVersionPress}
          accessibilityRole="button"
          accessibilityLabel={`App version ${APP_VERSION}`}
        >
          <ListRow label="Version" value={APP_VERSION} showChevron={false} />
        </Pressable>
        <ListRow label="Build" value={APP_BUILD_LABEL} showChevron={false} />
        <ListRow label="Release notes" value={RELEASE_NOTES} showChevron={false} />
      </ListSection>

      {updatesActive ? (
        <View style={{ gap: spacing.sm, marginBottom: spacing.md }}>
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
        <Text style={[text.caption, { marginBottom: spacing.md }]}>
          Updates are managed through your development tools in this build.
        </Text>
      )}

      <ListSection title="Support and legal">
        <ListRow label="Support" onPress={() => navigation.navigate('HelpSupport')} />
        <ListRow label="Privacy" onPress={() => navigation.navigate('Privacy')} />
        <ListRow label="Terms" onPress={() => navigation.navigate('Terms')} />
      </ListSection>
    </ScrollScreen>
  );
}
