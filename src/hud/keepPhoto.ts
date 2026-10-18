/** What a phone offers for sharing: `navigator`'s, or a test's. */
export interface Sharer {
  canShare?(data: ShareData): boolean;
  share?(data: ShareData): Promise<void>;
}

/** How keeping it went: the share sheet took it, it was downloaded, or she changed her mind. */
export type Kept = 'shared' | 'downloaded' | 'cancelled';

/**
 * Hands a picture to the phone to keep (V1's S3): the share sheet where it takes files (an
 * iPhone's has Save Image), else a download. Never throws.
 */
export async function keepPhoto(
  blob: Blob,
  name: string,
  nav: Sharer = navigator,
  doc: Document = document,
  urls: Pick<typeof URL, 'createObjectURL' | 'revokeObjectURL'> = URL,
): Promise<Kept> {
  const file = new File([blob], name, { type: blob.type || 'image/png' });
  try {
    if (nav.share && nav.canShare?.({ files: [file] })) {
      await nav.share({ files: [file], title: 'McFrancisVille' });
      return 'shared';
    }
  } catch (error) {
    // Closing the share sheet is her choice, not a failure; anything else falls back below.
    if ((error as { name?: unknown } | null)?.name === 'AbortError') return 'cancelled';
  }
  try {
    const url = urls.createObjectURL(blob);
    const link = doc.createElement('a');
    link.href = url;
    link.download = name;
    doc.body.append(link);
    link.click();
    link.remove();
    setTimeout(() => urls.revokeObjectURL(url), 10_000);
    return 'downloaded';
  } catch {
    return 'cancelled';
  }
}

/** What the photo's file is called: the day it was taken. */
export function photoName(at: number): string {
  const d = new Date(at);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `mcfrancisville-${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}.png`;
}
