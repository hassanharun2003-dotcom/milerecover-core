/**
 * Visual evidence helpers — write PNG boards and run contrast / layout checks.
 * Not a full pixel renderer of React Native; uses theme tokens + extracted copy
 * to produce inspectable PNG proof and fail on unreadable theme pairs.
 */
import fs from 'fs';
import path from 'path';
import { PNG } from 'pngjs';
import { lightSemantic, colors, type AppPalette } from '@milerecover/config';

export type Hex = string;

export type ContrastPair = {
  name: string;
  fg: Hex;
  bg: Hex;
  minRatio: number;
};

export type VisualCheckFailure = {
  kind:
    | 'contrast'
    | 'invisible_text'
    | 'disabled_ambiguity'
    | 'selected_ambiguity'
    | 'touch_target'
    | 'clipping';
  detail: string;
};

export type VisualBoardInput = {
  id: string;
  title: string;
  theme?: 'light';
  copy: string;
  width?: number;
  height?: number;
  /** Simulated regions for layout checks (y from top). */
  regions?: Array<{
    label: string;
    y: number;
    height: number;
    touch?: boolean;
    selected?: boolean;
    disabled?: boolean;
    enabledOutline?: boolean;
  }>;
  tabBarHeight?: number;
};

function parseHex(hex: string): { r: number; g: number; b: number } {
  const h = hex.replace('#', '');
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
  const n = parseInt(full.slice(0, 6), 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

function relLuminance({ r, g, b }: { r: number; g: number; b: number }): number {
  const lin = [r, g, b].map((v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * lin[0]! + 0.7152 * lin[1]! + 0.0722 * lin[2]!;
}

export function contrastRatio(fg: Hex, bg: Hex): number {
  const L1 = relLuminance(parseHex(fg));
  const L2 = relLuminance(parseHex(bg));
  const lighter = Math.max(L1, L2);
  const darker = Math.min(L1, L2);
  return (lighter + 0.05) / (darker + 0.05);
}

export function themeContrastPairs(_theme: 'light' = 'light'): ContrastPair[] {
  const s = lightSemantic;
  return [
    { name: 'textPrimary_on_canvas', fg: s.textPrimary, bg: s.canvas, minRatio: 4.5 },
    { name: 'textSecondary_on_canvas', fg: s.textSecondary, bg: s.canvas, minRatio: 3.0 },
    { name: 'textPrimary_on_surface', fg: s.textPrimary, bg: s.surface, minRatio: 4.5 },
    { name: 'textTertiary_on_surface', fg: s.textTertiary, bg: s.surface, minRatio: 3.0 },
    { name: 'onPrimary_on_primary', fg: s.onPrimary, bg: s.primary, minRatio: 4.5 },
    { name: 'primary_on_selected', fg: s.primary, bg: s.surfaceSelected, minRatio: 3.0 },
    { name: 'textPrimary_on_input', fg: s.textPrimary, bg: s.surface, minRatio: 4.5 },
    { name: 'disabled_distinct', fg: s.disabledText, bg: s.disabledSurface, minRatio: 2.0 },
    { name: 'selected_primary_on_selected', fg: s.primary, bg: s.surfaceSelected, minRatio: 2.0 },
    { name: 'success_on_surface', fg: s.success, bg: s.surface, minRatio: 3.0 },
    // Brand amber (#F59E0B) is decorative; readable warning ink is nested status.warning.
    { name: 'warning_ink_on_surface', fg: colors.status.warning, bg: s.surface, minRatio: 3.0 },
    { name: 'warning_accent_on_surface', fg: s.warning, bg: s.surface, minRatio: 2.0 },
    { name: 'danger_on_surface', fg: s.danger, bg: s.surface, minRatio: 3.0 },
  ];
}

export function checkThemeContrast(theme: 'light' = 'light'): VisualCheckFailure[] {
  const failures: VisualCheckFailure[] = [];
  for (const pair of themeContrastPairs(theme)) {
    const ratio = contrastRatio(pair.fg, pair.bg);
    if (ratio < pair.minRatio) {
      failures.push({
        kind: 'contrast',
        detail: `${theme} ${pair.name}: ${ratio.toFixed(2)} < ${pair.minRatio} (${pair.fg} on ${pair.bg})`,
      });
    }
    if (ratio < 1.2) {
      failures.push({
        kind: 'invisible_text',
        detail: `${theme} ${pair.name}: near-invisible ratio ${ratio.toFixed(2)}`,
      });
    }
  }
  const s = lightSemantic;
  // Enabled outline must be clearly stronger than disabled text on canvas
  const outline = contrastRatio(s.textTertiary, s.canvas);
  const disabled = contrastRatio(s.disabledText, s.canvas);
  if (outline < disabled + 0.4) {
    failures.push({
      kind: 'disabled_ambiguity',
      detail: `${theme}: outline button contrast (${outline.toFixed(2)}) not clearly stronger than disabled (${disabled.toFixed(2)})`,
    });
  }
  // Selected state must not rely only on faint border — border vs surface contrast
  const selectedEdge = contrastRatio(s.primary, s.surfaceSelected);
  if (selectedEdge < 1.8) {
    failures.push({
      kind: 'selected_ambiguity',
      detail: `${theme}: selected border too faint vs selected surface (${selectedEdge.toFixed(2)})`,
    });
  }
  return failures;
}

function fillRect(
  png: PNG,
  x: number,
  y: number,
  w: number,
  h: number,
  hex: Hex,
  alpha = 255,
) {
  const { r, g, b } = parseHex(hex);
  const x0 = Math.max(0, Math.floor(x));
  const y0 = Math.max(0, Math.floor(y));
  const x1 = Math.min(png.width, Math.ceil(x + w));
  const y1 = Math.min(png.height, Math.ceil(y + h));
  for (let py = y0; py < y1; py++) {
    for (let px = x0; px < x1; px++) {
      const idx = (png.width * py + px) << 2;
      png.data[idx] = r;
      png.data[idx + 1] = g;
      png.data[idx + 2] = b;
      png.data[idx + 3] = alpha;
    }
  }
}

function drawGlyphRow(
  png: PNG,
  text: string,
  x: number,
  y: number,
  color: Hex,
  scale = 1,
) {
  // Compact 3x5 bitmap for A-Z 0-9 and a few punctuation marks — enough for visual proof boards.
  const glyphs: Record<string, number[]> = {
    ' ': [0, 0, 0, 0, 0],
    '-': [0, 0, 7, 0, 0],
    '.': [0, 0, 0, 0, 2],
    ':': [0, 2, 0, 2, 0],
    ',': [0, 0, 0, 2, 4],
    "'": [2, 2, 0, 0, 0],
    '?': [7, 1, 2, 0, 2],
    '!': [2, 2, 2, 0, 2],
    '/': [1, 1, 2, 4, 4],
    '0': [7, 5, 5, 5, 7],
    '1': [2, 6, 2, 2, 7],
    '2': [7, 1, 7, 4, 7],
    '3': [7, 1, 7, 1, 7],
    '4': [5, 5, 7, 1, 1],
    '5': [7, 4, 7, 1, 7],
    '6': [7, 4, 7, 5, 7],
    '7': [7, 1, 2, 2, 2],
    '8': [7, 5, 7, 5, 7],
    '9': [7, 5, 7, 1, 7],
    A: [2, 5, 7, 5, 5],
    B: [6, 5, 6, 5, 6],
    C: [3, 4, 4, 4, 3],
    D: [6, 5, 5, 5, 6],
    E: [7, 4, 6, 4, 7],
    F: [7, 4, 6, 4, 4],
    G: [3, 4, 5, 5, 3],
    H: [5, 5, 7, 5, 5],
    I: [7, 2, 2, 2, 7],
    J: [1, 1, 1, 5, 2],
    K: [5, 5, 6, 5, 5],
    L: [4, 4, 4, 4, 7],
    M: [5, 7, 5, 5, 5],
    N: [5, 7, 7, 5, 5],
    O: [2, 5, 5, 5, 2],
    P: [6, 5, 6, 4, 4],
    Q: [2, 5, 5, 7, 3],
    R: [6, 5, 6, 5, 5],
    S: [3, 4, 2, 1, 6],
    T: [7, 2, 2, 2, 2],
    U: [5, 5, 5, 5, 7],
    V: [5, 5, 5, 5, 2],
    W: [5, 5, 5, 7, 5],
    X: [5, 5, 2, 5, 5],
    Y: [5, 5, 2, 2, 2],
    Z: [7, 1, 2, 4, 7],
  };
  let cx = x;
  for (const ch of text.toUpperCase()) {
    const rows = glyphs[ch] ?? glyphs['?']!;
    for (let row = 0; row < 5; row++) {
      for (let col = 0; col < 3; col++) {
        if (rows[row]! & (4 >> col)) {
          fillRect(png, cx + col * scale, y + row * scale, scale, scale, color);
        }
      }
    }
    cx += 4 * scale;
    if (cx > png.width - 8) break;
  }
}

export function paletteForTheme(_theme: 'light' = 'light'): AppPalette {
  return colors;
}

export function renderVisualBoard(input: VisualBoardInput, outDir: string): {
  filePath: string;
  failures: VisualCheckFailure[];
} {
  const width = input.width ?? 390;
  const height = input.height ?? 844;
  const tabBarHeight = input.tabBarHeight ?? 72;
  const theme = input.theme ?? 'light';
  const palette = paletteForTheme(theme);
  const s = lightSemantic;
  const png = new PNG({ width, height });
  fillRect(png, 0, 0, width, height, s.canvas);

  // Status bar strip
  fillRect(png, 0, 0, width, 44, s.surface);
  drawGlyphRow(png, 'LIGHT', 12, 16, s.textPrimary, 2);

  // Header / title
  fillRect(png, 0, 44, width, 64, s.surface);
  drawGlyphRow(png, input.title.slice(0, 28), 16, 66, s.textPrimary, 2);

  // Content card
  fillRect(png, 16, 124, width - 32, 280, s.surface);
  const lines = input.copy
    .split(/\n+/)
    .map((l) => l.trim())
    .filter(Boolean)
    .slice(0, 12);
  let ly = 140;
  for (const line of lines) {
    const color = ly === 140 ? s.textPrimary : s.textSecondary;
    drawGlyphRow(png, line.slice(0, 42), 28, ly, color, 2);
    ly += 18;
  }

  // Primary + outline buttons
  fillRect(png, 16, 424, width - 32, 48, s.primary);
  drawGlyphRow(png, 'PRIMARY ACTION', 28, 440, s.onPrimary, 2);
  // Outline enabled
  fillRect(png, 16, 488, width - 32, 48, s.canvas);
  // outline border
  fillRect(png, 16, 488, width - 32, 2, s.textTertiary);
  fillRect(png, 16, 534, width - 32, 2, s.textTertiary);
  fillRect(png, 16, 488, 2, 48, s.textTertiary);
  fillRect(png, width - 18, 488, 2, 48, s.textTertiary);
  drawGlyphRow(png, 'OUTLINE ENABLED', 28, 504, s.primary, 2);
  // Disabled
  fillRect(png, 16, 552, width - 32, 48, s.disabledSurface);
  drawGlyphRow(png, 'DISABLED', 28, 568, s.disabledText, 2);

  // Input card (always light surface with dark text)
  fillRect(png, 16, 616, width - 32, 56, s.surface);
  drawGlyphRow(png, 'INPUT TEXT 12.5', 28, 636, s.textPrimary, 2);

  // Tab bar
  fillRect(png, 0, height - tabBarHeight, width, tabBarHeight, palette.tab.bar);
  fillRect(png, 0, height - tabBarHeight, width, 1, s.border);
  const tabs = ['HOME', 'REVIEW', 'PROOF', 'PROFILE'];
  tabs.forEach((tab, i) => {
    const tx = 16 + i * ((width - 32) / 4);
    drawGlyphRow(png, tab, tx, height - tabBarHeight + 28, i === 0 ? palette.tab.active : palette.tab.inactive, 1);
  });

  const failures = checkThemeContrast(theme);

  const regions = input.regions ?? [
    { label: 'primary', y: 424, height: 48, touch: true },
    { label: 'outline', y: 488, height: 48, touch: true, enabledOutline: true },
    { label: 'disabled', y: 552, height: 48, touch: true, disabled: true },
  ];
  for (const region of regions) {
    if (region.touch && (region.height < 48 || width - 32 < 48)) {
      failures.push({
        kind: 'touch_target',
        detail: `${region.label}: touch target below 48x48`,
      });
    }
    const bottom = region.y + region.height;
    if (bottom > height - tabBarHeight + 4 && region.label !== 'tab') {
      failures.push({
        kind: 'clipping',
        detail: `${region.label}: content may sit under tab bar (y=${region.y})`,
      });
    }
  }

  fs.mkdirSync(outDir, { recursive: true });
  const filePath = path.join(outDir, `${input.id}-${theme}.png`);
  fs.writeFileSync(filePath, PNG.sync.write(png));
  return { filePath, failures };
}

export function defaultEvidenceDir(): string {
  return path.join(__dirname, '..', '..', '..', '..', 'docs', 'assets', 'ui-evidence', 'png');
}
