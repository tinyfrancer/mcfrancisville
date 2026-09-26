import { describe, expect, it } from 'vitest';
import { INSTALL_HINT_SNOOZE_MS, shouldShowInstallHint } from '../../src/hud/installHint';

const IPHONE =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1';
const IPAD_AS_MAC =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Safari/605.1.15';
const ANDROID =
  'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0 Mobile Safari/537.36';

const base = { userAgent: IPHONE, maxTouchPoints: 5, standalone: false, dismissedAt: null, now: 0 };

describe('shouldShowInstallHint', () => {
  it('shows on an iPhone in the browser', () => {
    expect(shouldShowInstallHint(base)).toBe(true);
  });

  it('never shows once installed', () => {
    expect(shouldShowInstallHint({ ...base, standalone: true })).toBe(false);
  });

  it('shows on an iPad even though it calls itself a Mac, but not on a real Mac', () => {
    expect(shouldShowInstallHint({ ...base, userAgent: IPAD_AS_MAC })).toBe(true);
    expect(shouldShowInstallHint({ ...base, userAgent: IPAD_AS_MAC, maxTouchPoints: 0 })).toBe(
      false,
    );
  });

  it('does not show off iOS, where the storage wipe does not apply', () => {
    expect(shouldShowInstallHint({ ...base, userAgent: ANDROID })).toBe(false);
  });

  it('stays away for a day after "got it"', () => {
    const dismissedAt = 1_000_000;
    const at = (now: number) => shouldShowInstallHint({ ...base, dismissedAt, now });
    expect(at(dismissedAt + INSTALL_HINT_SNOOZE_MS - 1)).toBe(false);
    expect(at(dismissedAt + INSTALL_HINT_SNOOZE_MS)).toBe(true);
  });
});
