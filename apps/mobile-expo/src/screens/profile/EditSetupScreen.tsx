import React, { useState } from 'react';
import { Text, View } from 'react-native';
import { spacing } from '@milerecover/config';
import {
  localeProfileFromCountry,
  rateForTimestamp,
  type CountryCode,
  type CurrencyCode,
  type DistanceUnit,
} from '@milerecover/domain';
import {
  FormField,
  PrimaryButton,
  SelectionCard,
  SoftPanel,
  StackScrollScreen,
  StatusCard,
  text,
} from '../../design-system';
import { useProduct } from '../../product/ProductContext';
import {
  COUNTRY_OPTIONS,
  DRIVING_PATTERN_OPTIONS,
  PAIN_POINT_OPTIONS,
  PRIMARY_GOAL_OPTIONS,
  type PainPoint,
} from '../../product/types';

export function EditSetupScreen() {
  const {
    product,
    setPreferredName,
    setPrimaryGoal,
    setSelectedPainPoints,
    setDrivingType,
    setLocaleProfile,
  } = useProduct();
  const [name, setName] = useState(product.preferredName ?? '');
  const [savedName, setSavedName] = useState(false);
  const [country, setCountry] = useState<CountryCode>(product.localeProfile.countryCode);
  const [unit, setUnit] = useState<DistanceUnit>(product.localeProfile.distanceUnit);
  const [currency, setCurrency] = useState<CurrencyCode>(product.localeProfile.currencyCode);
  const currentRate = rateForTimestamp(product.localeProfile.rates, Date.now());
  const [rateDraft, setRateDraft] = useState(
    currentRate?.centsPerMile != null ? String(currentRate.centsPerMile) : '',
  );
  const [savedLocale, setSavedLocale] = useState(false);

  const togglePain = (pain: PainPoint) => {
    const next = product.selectedPainPoints.includes(pain)
      ? product.selectedPainPoints.filter((item) => item !== pain)
      : [...product.selectedPainPoints, pain];
    setSelectedPainPoints(next);
  };

  const saveLocale = () => {
    const cents = Number.parseFloat(rateDraft);
    const now = Date.now();
    const base = localeProfileFromCountry(country, {
      distanceUnit: country === 'OTHER' ? unit : undefined,
      currencyCode: country === 'OTHER' ? currency : undefined,
      centsPerMile: Number.isFinite(cents) && cents > 0 ? cents : undefined,
      now,
    });
    // Close previous open-ended rates so historical estimates stay stable.
    const priorRates = product.localeProfile.rates.map((rate) =>
      rate.effectiveTo == null && rate.effectiveFrom < now
        ? { ...rate, effectiveTo: now }
        : rate,
    );
    const nextRates =
      Number.isFinite(cents) && cents > 0
        ? [
            ...priorRates.filter((rate) => rate.id !== base.rates[0]?.id),
            ...(base.rates[0]
              ? [
                  {
                    ...base.rates[0],
                    source: 'user_custom' as const,
                    centsPerMile: cents,
                    currencyCode: country === 'OTHER' ? currency : base.currencyCode,
                  },
                ]
              : []),
          ]
        : priorRates.length
          ? priorRates
          : base.rates;
    setLocaleProfile({
      ...base,
      distanceUnit: country === 'OTHER' ? unit : base.distanceUnit,
      currencyCode: country === 'OTHER' ? currency : base.currencyCode,
      rates: nextRates,
    });
    setSavedLocale(true);
  };

  return (
    <StackScrollScreen>
      <StatusCard
        variant="info"
        title="Update your answers"
        body="This only changes how MileRecover talks to you — your drives stay. Changing today’s rate does not rewrite older accepted values."
        emphasis="subtle"
      />

      <Text style={[text.subtitle, { marginBottom: spacing.sm }]}>Preferred name</Text>
      <FormField label="Preferred name" value={name} onChangeText={setName} placeholder="First name" />
      <PrimaryButton
        label={savedName ? 'Name saved' : 'Save name'}
        onPress={() => {
          setPreferredName(name.trim() || null);
          setSavedName(true);
        }}
      />

      <Text style={[text.subtitle, { marginTop: spacing.lg, marginBottom: spacing.sm }]}>
        Country and units
      </Text>
      <Text style={[text.body, { marginBottom: spacing.sm }]}>
        Launch markets only. Other country uses your custom units and rate — no country-specific compliance claims.
      </Text>
      {COUNTRY_OPTIONS.map((option) => (
        <SelectionCard
          key={option.id}
          title={option.label}
          selected={country === option.id}
          onPress={() => {
            setCountry(option.id);
            setSavedLocale(false);
            if (option.id !== 'OTHER') {
              const preset = localeProfileFromCountry(option.id);
              setUnit(preset.distanceUnit);
              setCurrency(preset.currencyCode);
            }
          }}
        />
      ))}
      {country === 'OTHER' ? (
        <SoftPanel>
          <SelectionCard title="Miles" selected={unit === 'mi'} onPress={() => setUnit('mi')} />
          <SelectionCard title="Kilometers" selected={unit === 'km'} onPress={() => setUnit('km')} />
          <FormField
            label="Currency code"
            value={currency === 'OTHER' ? '' : currency}
            onChangeText={(value) => {
              const next = value.trim().toUpperCase();
              if (!next) setCurrency('OTHER');
              else if (['USD', 'CAD', 'GBP', 'AUD', 'EUR'].includes(next)) {
                setCurrency(next as CurrencyCode);
              }
            }}
            placeholder="e.g. EUR"
            autoCapitalize="characters"
          />
        </SoftPanel>
      ) : null}
      <FormField
        label="Reimbursement rate (cents per mile)"
        value={rateDraft}
        onChangeText={(value) => {
          setRateDraft(value);
          setSavedLocale(false);
        }}
        placeholder="e.g. 70"
        keyboardType="decimal-pad"
      />
      <PrimaryButton
        label={savedLocale ? 'Country settings saved' : 'Save country settings'}
        onPress={saveLocale}
      />

      <Text style={[text.subtitle, { marginTop: spacing.lg, marginBottom: spacing.sm }]}>Primary goal</Text>
      {PRIMARY_GOAL_OPTIONS.map((option) => (
        <SelectionCard
          key={option.id}
          title={option.label}
          body={option.body}
          selected={product.primaryGoal === option.id}
          onPress={() => setPrimaryGoal(option.id)}
        />
      ))}

      <Text style={[text.subtitle, { marginTop: spacing.lg, marginBottom: spacing.sm }]}>What gets in the way</Text>
      <Text style={[text.body, { marginBottom: spacing.sm }]}>Change these anytime.</Text>
      {PAIN_POINT_OPTIONS.map((option) => (
        <SelectionCard
          key={option.id}
          title={option.label}
          selected={product.selectedPainPoints.includes(option.id)}
          onPress={() => togglePain(option.id)}
        />
      ))}

      <Text style={[text.subtitle, { marginTop: spacing.lg, marginBottom: spacing.sm }]}>Driving pattern</Text>
      <View style={{ marginBottom: spacing.lg }}>
        {DRIVING_PATTERN_OPTIONS.map((option) => (
          <SelectionCard
            key={option.id}
            title={option.label}
            selected={product.drivingType === option.id}
            onPress={() => setDrivingType(option.id)}
          />
        ))}
      </View>
    </StackScrollScreen>
  );
}
