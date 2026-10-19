import { TOGETHER, TOGETHER_IDS } from '../data/cody';
import { TUNES } from '../data/instruments';
import { isHusband } from '../systems/cody';
import { VILLAGERS } from '../data/villagers';
import { candy, KEEPSAKE_POSTED, quantity } from '../hud/messages';
import type { TalkAction } from '../hud/TalkSheet';
import type { VillagerId } from '../types/ids';
import type { World } from '../world/World';

/**
 * What she can do with a neighbour as they talk, beside Chat and Give (V1's P4, "where it hurts"
 * 11): one row each, asked afresh as the buttons are drawn, so a new one is a line here and a
 * service's `canX`/`X`, never another pair on `TalkApi`. `changed` marks the save.
 */
export function talkActions(world: World, id: VillagerId, changed: () => void): TalkAction[] {
  const actions: TalkAction[] = [];
  const name = VILLAGERS[id].name;
  // A happening's verb (V1's P4): straight away, or her pick of what's on offer.
  const verb = world.joining.verbFor(id);
  if (verb) {
    const join = (choice?: string) => {
      changed();
      const joined = world.joining.join(id, choice);
      return joined
        ? { lines: joined.lines, ...(joined.aside ? { aside: joined.aside } : {}) }
        : null;
    };
    actions.push({
      label: verb.label,
      glyph: verb.glyph,
      run() {
        if (verb.choices.length === 0) return join();
        const choices = verb.choices.map((c) => ({ label: c.say, run: () => join(c.id) }));
        return { lines: verb.ask ? [verb.ask] : [], choices };
      },
    });
  }
  if (world.baking.canBake(id)) {
    actions.push({
      label: 'Bake together',
      glyph: { item: 'batWingCookie' },
      run() {
        const lines = world.baking.scene(id);
        if (!lines) return null;
        const last = lines.length - 1;
        return {
          lines,
          // A beat at the bowl or the oven a line, and the bake done and paid on the last.
          beat(k) {
            if (k < last) return world.baking.step(k);
            changed();
            const baked = world.baking.bake(id);
            if (!baked) return;
            const home = quantity(baked.item, baked.count);
            return `${name} paid you ${candy(baked.candy)}, and sent you home with ${home}.`;
          },
        };
      },
    });
  }
  if (world.instruments.canLearn(id)) {
    actions.push({
      label: 'A lesson',
      glyph: 'piano',
      run() {
        changed();
        const learnt = world.instruments.learn(id);
        if (!learnt) return null;
        const tune = TUNES[learnt.tune].name;
        return {
          lines: [learnt.line],
          aside: `You learnt "${tune}". Every piano you play knows it now.`,
        };
      },
    });
  }
  // At hers of an evening, what she and Cody do together, each once a night (V1's P5).
  if (isHusband(id)) {
    for (const what of TOGETHER_IDS) {
      if (!world.marriage.canDo(what)) continue;
      actions.push({
        label: TOGETHER[what].label,
        glyph: TOGETHER[what].glyph,
        run() {
          changed();
          return world.marriage.together(what);
        },
      });
    }
  }
  // Their critter gone astray, carried home (V1's R3).
  const stray = world.rareEvents.canHandBack(id) ? world.rareEvents.carrying() : null;
  if (stray) {
    actions.push({
      label: `Give back ${stray.name}`,
      glyph: { item: stray.critter },
      run() {
        changed();
        const back = world.rareEvents.handBack(id);
        if (!back) return null;
        const given = `${name} gave you ${candy(back.candy)}.`;
        return { lines: [back.line], aside: back.posted ? `${given} ${KEEPSAKE_POSTED}` : given };
      },
    });
  }
  if (world.finale.canCrown(id)) {
    actions.push({
      label: 'Best costume!',
      glyph: 'crown',
      run() {
        changed();
        const crowned = world.finale.crown(id);
        return crowned ? { lines: [crowned.line], aside: crowned.aside } : null;
      },
    });
  }
  if (world.finale.canPhoto(id)) {
    actions.push({
      label: 'Our photo',
      glyph: 'camera',
      run() {
        world.finale.photo();
        return { lines: [], close: true };
      },
    });
  }
  return actions;
}
