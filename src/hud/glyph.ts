import type { Glyph } from '../data/glyphs';
import { glyphUrl } from '../sprites/ui';

/**
 * One of the game's own 16-pixel pictures, for the chrome (V1's L5, decision 295): at 16 CSS
 * pixels beside a line of text, or 32 on a button, so each of its pixels is a whole block on any
 * phone. Only to look at: whatever it sits in says what it means.
 */
export function glyph(of: Glyph, size: 16 | 32 = 16, className = ''): HTMLImageElement {
  const img = document.createElement('img');
  img.className = `hud-glyph${className ? ` ${className}` : ''}`;
  img.src = glyphUrl(of);
  img.width = size;
  img.height = size;
  img.alt = '';
  img.draggable = false;
  img.setAttribute('aria-hidden', 'true');
  return img;
}

/** A glyph and the words after it, as one line: "[pin] Pinned up by Cobweb Corner". */
export function glyphed(of: Glyph, ...text: (Node | string)[]): DocumentFragment {
  const line = document.createDocumentFragment();
  line.append(glyph(of), ' ', ...text);
  return line;
}

/** A price on a button: the drawn sweet and how many (V1's L5). In a sentence, `candy()`. */
export function price(amount: number): HTMLElement {
  const tag = document.createElement('span');
  tag.className = 'hud-price-tag';
  tag.append(glyph('candy'), String(amount));
  return tag;
}
