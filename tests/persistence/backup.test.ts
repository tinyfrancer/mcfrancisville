import { afterEach, describe, expect, it, vi } from 'vitest';
import { decodeBackup, encodeBackup } from '../../src/persistence/backup';
import { newSave, SAVE_VERSION } from '../../src/persistence/SaveState';

const SAVE = newSave(1_700_000_000_000, { tx: 12, ty: 30, facing: 'up', zone: 'town' });

describe('backup codes', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('round-trips a save through a compressed code', async () => {
    const code = await encodeBackup(SAVE);
    expect(code).toMatch(/^MFV1-[A-Za-z0-9_-]+$/);
    expect(await decodeBackup(code)).toEqual({ ok: true, save: SAVE });
  });

  it('falls back to a plain code where compression is missing, and still reads it', async () => {
    vi.stubGlobal('CompressionStream', undefined);
    const code = await encodeBackup(SAVE);
    expect(code).toMatch(/^MFV0-/);
    expect(await decodeBackup(code)).toEqual({ ok: true, save: SAVE });
  });

  it('tolerates the spaces and line breaks a paste picks up', async () => {
    const code = await encodeBackup(SAVE);
    const mangled = `  ${code.slice(0, 10)}\n${code.slice(10, 20)} ${code.slice(20)}\n`;
    expect(await decodeBackup(mangled)).toEqual({ ok: true, save: SAVE });
  });

  it('says kindly when a code is not one, is cut short, or is from the future', async () => {
    const notOurs = await decodeBackup('hello there');
    expect(notOurs).toMatchObject({ ok: false, reason: expect.stringMatching(/MFV/) });

    const code = await encodeBackup(SAVE);
    expect(await decodeBackup(code.slice(0, code.length - 8))).toMatchObject({ ok: false });

    vi.stubGlobal('CompressionStream', undefined);
    const future = await encodeBackup({ ...SAVE, version: SAVE_VERSION + 1 });
    expect(await decodeBackup(future)).toMatchObject({ ok: false });
  });

  it("says a version 0 code can't be opened any more (decisions.md 80)", async () => {
    const old = await encodeBackup({ ...SAVE, version: 11 });
    expect(await decodeBackup(old)).toMatchObject({
      ok: false,
      reason: expect.stringMatching(/before the town grew/),
    });
  });
});
