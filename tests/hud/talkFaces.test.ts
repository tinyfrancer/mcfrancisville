import { beforeEach, describe, expect, it } from 'vitest';
import { openTalk, type TalkApi } from '../../src/hud/TalkSheet';
import type { VillagerId } from '../../src/types/ids';
import type { Feeling } from '../../src/types/mood';
import type { Chat } from '../../src/world/events';

let hud: HTMLElement;
beforeEach(() => {
  document.body.replaceChildren();
  hud = document.createElement('div');
  document.body.append(hud);
});

/** A talk sheet's game, keeping every face the bust was drawn with and told to the world. */
function fakeApi(chats: Chat[]) {
  const drawn: (Feeling | null | undefined)[] = [];
  const told: (Feeling | null)[] = [];
  let k = 0;
  const api: TalkApi = {
    hearts: () => 4,
    talk: () => chats[Math.min(k++, chats.length - 1)]!,
    reply: () => ({ line: 'Ha! Yes.', bonus: false, puff: false, feels: 'laugh' }),
    bag: () => [{ id: 'loveBracelet', count: 1 }],
    give: () => ({ declined: false, reaction: 'loved', line: 'Oh, I love it!', feels: 'laugh' }),
    favour: () => null,
    doFavour: () => null,
    endTalk: () => {},
    icon: () => {},
    portrait: (_canvas: HTMLCanvasElement, _id: VillagerId, feel?: Feeling | null) => {
      drawn.push(feel);
    },
    feel: (_id, feel) => told.push(feel),
    redOne: () => {},
    actions: () => [],
  };
  return { api, drawn, told };
}

const tap = (text: string) =>
  [...hud.querySelectorAll('button')].find((b) => b.textContent?.includes(text))!.click();

describe("the talk sheet's faces (V1's L7)", () => {
  it('draws their bust with the feeling of each line, and tells the world the same face', () => {
    const { api, drawn, told } = fakeApi([
      {
        line: 'I have something for you!',
        bonus: true,
        puff: false,
        more: ['It was hard to wrap.'],
        feels: 'happy',
        moreFeels: ['shy'],
      },
    ]);
    openTalk(hud, api, 'rufus');
    expect(drawn.at(-1)).toBe('happy');
    expect(told).toEqual(['happy']);
    tap('Go on');
    expect(drawn.at(-1)).toBe('shy');
    expect(told).toEqual(['happy', 'shy']);
    expect(hud.querySelector<HTMLElement>('.hud-portrait')?.dataset['feel']).toBe('shy');
  });

  it('changes the face when a gift is loved', () => {
    const { api, drawn } = fakeApi([
      { line: 'Hello there.', bonus: true, puff: false, feels: null },
    ]);
    openTalk(hud, api, 'maude');
    const before = drawn.length;
    tap('Give a gift');
    hud.querySelector<HTMLButtonElement>('.hud-slot')!.click();
    expect(drawn.length).toBe(before + 1);
    expect(drawn.at(-1)).toBe('laugh');
    expect(hud.querySelector<HTMLElement>('.hud-portrait')?.dataset['feel']).toBe('laugh');
  });
});
