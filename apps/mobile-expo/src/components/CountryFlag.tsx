import React from 'react';
import { StyleSheet, Text, View, type ViewStyle } from 'react-native';

/**
 * ISO-driven flag badges for US/CA/GB/AU.
 * Avoids Android emoji-flag gaps on Samsung (regional-indicator glyphs often blank).
 */
export function CountryFlag({
  code,
  size = 22,
  style,
}: {
  code: string;
  size?: number;
  style?: ViewStyle;
}) {
  const height = size;
  const width = Math.round(size * 1.45);
  const borderRadius = Math.max(2, Math.round(size * 0.12));

  if (code === 'US') {
    return (
      <View
        style={[styles.base, { width, height, borderRadius }, style]}
        accessibilityLabel="United States flag"
        accessibilityRole="image"
      >
        <View style={[StyleSheet.absoluteFill, { backgroundColor: '#B22234' }]} />
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <View
            key={i}
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              top: (height / 13) * (i * 2 + 1),
              height: height / 13,
              backgroundColor: '#FFFFFF',
            }}
          />
        ))}
        <View
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            width: width * 0.42,
            height: height * 0.54,
            backgroundColor: '#3C3B6E',
          }}
        />
      </View>
    );
  }

  if (code === 'CA') {
    return (
      <View
        style={[styles.base, { width, height, borderRadius, flexDirection: 'row' }, style]}
        accessibilityLabel="Canada flag"
        accessibilityRole="image"
      >
        <View style={{ flex: 1, backgroundColor: '#FF0000' }} />
        <View style={{ flex: 2, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ color: '#FF0000', fontSize: size * 0.55, fontWeight: '800', lineHeight: size * 0.6 }}>
            ❖
          </Text>
        </View>
        <View style={{ flex: 1, backgroundColor: '#FF0000' }} />
      </View>
    );
  }

  if (code === 'GB') {
    return (
      <View
        style={[styles.base, { width, height, borderRadius, backgroundColor: '#012169' }, style]}
        accessibilityLabel="United Kingdom flag"
        accessibilityRole="image"
      >
        <View
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: height * 0.38,
            height: height * 0.24,
            backgroundColor: '#FFFFFF',
          }}
        />
        <View
          style={{
            position: 'absolute',
            top: 0,
            bottom: 0,
            left: width * 0.38,
            width: width * 0.24,
            backgroundColor: '#FFFFFF',
          }}
        />
        <View
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: height * 0.42,
            height: height * 0.16,
            backgroundColor: '#C8102E',
          }}
        />
        <View
          style={{
            position: 'absolute',
            top: 0,
            bottom: 0,
            left: width * 0.42,
            width: width * 0.16,
            backgroundColor: '#C8102E',
          }}
        />
      </View>
    );
  }

  if (code === 'AU') {
    return (
      <View
        style={[styles.base, { width, height, borderRadius, backgroundColor: '#00008B' }, style]}
        accessibilityLabel="Australia flag"
        accessibilityRole="image"
      >
        <View
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            width: width * 0.45,
            height: height * 0.5,
            backgroundColor: '#012169',
          }}
        />
        <Text
          style={{
            position: 'absolute',
            right: width * 0.18,
            top: height * 0.22,
            color: '#FFFFFF',
            fontSize: size * 0.42,
          }}
        >
          ★
        </Text>
        <Text
          style={{
            position: 'absolute',
            right: width * 0.12,
            bottom: height * 0.12,
            color: '#FFFFFF',
            fontSize: size * 0.28,
          }}
        >
          ★
        </Text>
      </View>
    );
  }

  return (
    <View
      style={[
        styles.base,
        {
          width,
          height,
          borderRadius,
          backgroundColor: '#E8F0EC',
          alignItems: 'center',
          justifyContent: 'center',
        },
        style,
      ]}
      accessibilityLabel="Other country"
      accessibilityRole="image"
    >
      <Text style={{ fontSize: size * 0.55, color: '#1F6B4A' }}>◎</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(0,0,0,0.12)',
  },
});
