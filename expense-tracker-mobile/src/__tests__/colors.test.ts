import { lightTheme, darkTheme, chartColors } from '../theme/colors';

describe('Theme colors', () => {
  it('light theme has all required color keys', () => {
    const requiredKeys = [
      'primary', 'primaryLight', 'primaryDark',
      'accentGreen', 'accentGreenLight',
      'accentRed', 'accentRedLight',
      'bgMain', 'bgCard',
      'textPrimary', 'textSecondary', 'textMuted',
      'border',
    ];
    for (const key of requiredKeys) {
      expect(lightTheme).toHaveProperty(key);
      expect((lightTheme as any)[key]).toMatch(/^#[0-9A-Fa-f]{6}$/);
    }
  });

  it('dark theme has all the same keys as light theme', () => {
    const lightKeys = Object.keys(lightTheme);
    const darkKeys = Object.keys(darkTheme);
    expect(darkKeys).toEqual(lightKeys);
  });

  it('light and dark themes have different background colors', () => {
    expect(lightTheme.bgMain).not.toEqual(darkTheme.bgMain);
    expect(lightTheme.bgCard).not.toEqual(darkTheme.bgCard);
  });

  it('chartColors has at least 8 colors', () => {
    expect(chartColors.length).toBeGreaterThanOrEqual(8);
  });

  it('all chart colors are valid hex', () => {
    for (const color of chartColors) {
      expect(color).toMatch(/^#[0-9A-Fa-f]{6}$/);
    }
  });
});
