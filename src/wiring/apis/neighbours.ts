import { drawRedOne } from '../../render/greetings';
import type { NoticeApi } from '../../hud/NoticeSheet';
import type { MailApi } from '../../hud/MailSheet';
import type { TalkApi } from '../../hud/TalkSheet';
import { talkActions } from '../talkActions';
import type { NeighboursApi } from '../../hud/NeighboursSheet';
import { CUES, voiceOf } from '../../audio/cues';
import { OUTFITS } from '../../data/outfits';
import { drawProjectPicture } from '../../render/projects';
import { FURNITURE } from '../../data/furniture';
import { drawWornDetail } from '../../render/doll';
import { drawFurnitureIcon, drawSurfaceIcon } from '../../render/furniture';
import { drawItemIcon } from '../../render/items';
import { drawAccessoryIcon } from '../../render/pets';
import { drawRecipeIcon } from '../../render/recipes';
import { drawBust, drawPortrait } from '../../render/villagers';
import { VILLAGER_IDS } from '../../data/villagers';
import { dayKey } from '../../systems/clock';
import { closenessFeeling } from '../../systems/moods';
import { bandOf } from '../../systems/remembering';
import { inTown } from '../../systems/mayor';
import { PALETTE } from '../../sprites/palette';
import { wear } from '../../systems/wardrobe';
import type { ApiWiring, SheetApis } from './shared';

/** Her neighbours: talking, the neighbours sheet, her mail, and the noticeboard. */
export function neighboursApis({
  world,
  sound,
  changed,
  play,
}: ApiWiring): Pick<SheetApis, 'talk' | 'neighbours' | 'mail' | 'notices'> {
  const talk: TalkApi = {
    hearts: (id) => world.friends.hearts(id),
    talk(id) {
      changed();
      const chat = world.talk.talk(id);
      sound.cue(voiceOf(id, chat.line));
      return chat;
    },
    reply(id, k) {
      changed();
      const chat = world.talk.reply(id, k);
      if (chat) sound.cue(voiceOf(id, chat.line));
      return chat;
    },
    bag: () => world.bag.spares,
    give(id, item) {
      changed();
      const given = world.talk.give(id, item);
      if (given && !given.declined && given.reaction === 'loved') sound.cue(CUES.heart);
      else if (given) sound.cue(voiceOf(id, given.line));
      return given;
    },
    favour: (id) => world.talk.favour(id),
    doFavour(id) {
      changed();
      return world.talk.doFavour(id);
    },
    endTalk: () => world.talk.endTalk(),
    icon: drawItemIcon,
    // One face for the line (V1's L7): on their bust here, and in the world through `feel`.
    portrait: (canvas, id, feel) =>
      drawBust(canvas, id, world.finale.costumeOf(id), feel ?? 'neutral'),
    feel: (id, feel) => world.talk.feel(id, feel),
    redOne: drawRedOne,
    actions: (id) => talkActions(world, id, changed),
  };
  const neighbours: NeighboursApi = {
    neighbours: () =>
      VILLAGER_IDS.map((id) => ({
        id,
        hearts: world.friends.hearts(id),
        // The mayor is only a shape until she has met him (V1's P3b), and nowhere to be found.
        met: inTown(id),
        where: inTown(id) ? world.neighbourhood.whereIs(id) : null,
      })),
    today: () => dayKey(world.clock.now()),
    found: (zone) => world.atlas.hasFound(zone),
    seek: (id) => world.seek(id),
    // Warmer the closer they are (1.0.1).
    portrait: (canvas, id) =>
      drawBust(
        canvas,
        id,
        world.finale.costumeOf(id),
        closenessFeeling(bandOf(world.friends.hearts(id), id)) ?? 'neutral',
      ),
    shadow: (canvas, id) => drawBust(canvas, id, null, 'neutral', PALETTE.stoneDark),
    icon: drawItemIcon,
    gift(canvas, ware) {
      if ('item' in ware) drawItemIcon(canvas, ware.item);
      else if ('furniture' in ware) drawFurnitureIcon(canvas, ware.furniture);
      else if ('recipe' in ware) drawRecipeIcon(canvas, ware.recipe);
      else if ('accessory' in ware) drawAccessoryIcon(canvas, ware.accessory);
      else if ('outfit' in ware) {
        const owned = [...world.wardrobe.owned, ware.outfit];
        const look = wear(world.wardrobe.look, ware.outfit, owned);
        drawWornDetail(canvas, look, OUTFITS[ware.outfit].slot);
      } else drawSurfaceIcon(canvas, ware);
    },
  };
  const mail: MailApi = {
    mail: () => world.mailbox.view(),
    open(id) {
      changed();
      return world.mailbox.open(id);
    },
  };
  const notices: NoticeApi = {
    notices: () => world.noticeboard.notices(),
    wanted: () => world.shops.wanted(),
    posters: () => world.noticeboard.posters(),
    bag: () => world.bag.spares,
    answer(slot) {
      const answered = world.noticeboard.answer(slot);
      if (answered) play([answered]);
      return answered !== null;
    },
    icon: drawItemIcon,
    portrait: (canvas, id, feel) => drawPortrait(canvas, id, null, feel ?? 'neutral'),
    // The town's projects (V1's R4).
    projects: () => world.projects.view(),
    startProject: (id) => world.projects.start(id)?.map((piece) => FURNITURE[piece].name) ?? null,
    inTheWay: (id) => world.projects.inTheWay(id).map((piece) => FURNITURE[piece].name),
    giveProject(gift) {
      const given = world.projects.give(gift);
      if (given) play([given]);
      return given !== null;
    },
    projectPicture: drawProjectPicture,
  };
  return {
    talk,
    neighbours,
    mail,
    notices,
  };
}
