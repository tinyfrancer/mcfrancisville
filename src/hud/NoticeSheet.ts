import { CALENDAR } from '../data/calendar';
import type { ProjectId } from '../types/ids';
import type { Gift, ProjectView } from '../world/services/Projects';
import { projectsPanel } from './ProjectsPanel';
import { VILLAGERS } from '../data/villagers';
import type { ItemId, VillagerId } from '../types/ids';
import type { Stack } from '../world/Bag';
import type { Poster } from '../systems/notices';
import { noteFeeling } from '../systems/moods';
import type { Feeling } from '../types/mood';
import { glyph, glyphed, price } from './glyph';
import type { Notice } from '../world/services/Noticeboard';
import { fitIcon, ROW_ICON } from './collection';
import { el, openSheet } from './dom';
import { asked, wantedLine } from './messages';

/** What the noticeboard may ask of the game. Like the other sheets, it never reaches the world. */
export interface NoticeApi {
  notices(): Notice[];
  bag(): readonly Stack[];
  /** Cobweb Corner's wanted list this week, pinned up with the notes (0.2's E1). */
  wanted(): readonly ItemId[];
  /** The day's events, each with when and where to go (0.2's M3). */
  posters(): readonly Poster[];
  /** Hands over what a note asks for; false if she can't. */
  answer(slot: number): boolean;
  icon(canvas: HTMLCanvasElement, id: ItemId): void;
  /** Draws a neighbour's head and shoulders at 1×, with `feel` their face (1.0.1). */
  portrait(canvas: HTMLCanvasElement, id: VillagerId, feel?: Feeling | null): void;
  /** The town's projects, as the Projects tab shows them (V1's R4). */
  projects(): readonly ProjectView[];
  /**
   * Starts funding a project: null if one is under way, or the names of what of hers went in the
   * storage chest to make room for it.
   */
  startProject(id: ProjectId): readonly string[] | null;
  /** The names of what of hers would go in the chest were it started now, to ask first (1.0.1). */
  inTheWay(id: ProjectId): readonly string[];
  /** Gives the project under way lots of Candy or so many of a thing; false if nothing went. */
  giveProject(gift: Gift): boolean;
  /** Draws a project as it'll look built, at 1×. */
  projectPicture(canvas: HTMLCanvasElement, id: ProjectId): void;
}

/**
 * The noticeboard by the square (phase N): three notes from her neighbours, new each window, each
 * saying what they'd like, what it brings, and how many she has; a tap hands it over. And on its
 * second tab, the town's projects (V1's R4).
 */
export function openNotices(hud: HTMLElement, api: NoticeApi, tab = 'notes'): () => void {
  const sheet = openSheet(hud, {
    title: 'Noticeboard',
    line: 'New notes every morning, afternoon and evening.',
    className: 'hud-notice-sheet',
    tabs: [
      { id: 'notes', label: 'Notes' },
      { id: 'projects', label: 'Projects' },
    ],
    tab,
  });
  const projects = projectsPanel(sheet.panel('projects'), api);
  const message = el('p', { className: 'hud-message' });

  const render = () => {
    const bag = api.bag();
    const wanted = el(
      'section',
      { className: 'hud-notice-wanted' },
      el(
        'p',
        {},
        el('small', { className: 'hud-notice-for' }, glyphed('pin', 'Pinned up by Cobweb Corner')),
        wantedLine(api.wanted()),
      ),
    );
    const posters = api.posters();
    const today = posters.length
      ? [
          el(
            'section',
            { className: 'hud-notice-wanted' },
            el('small', { className: 'hud-notice-for' }, glyphed('pin', 'Today')),
            ...posters.map((p) =>
              el(
                'p',
                {},
                glyph(p.icon),
                ' ',
                el('strong', {}, p.name),
                el('small', {}, ` ${p.line}.`),
              ),
            ),
          ),
        ]
      : [];
    sheet
      .panel('notes')
      .replaceChildren(
        ...today,
        ...api.notices().map((notice) => card(notice, bag)),
        wanted,
        message,
      );
    projects.render();
  };

  function card(notice: Notice, bag: readonly Stack[]): HTMLElement {
    const face = el('canvas', { className: 'hud-portrait hud-notice-face' });
    api.portrait(face, notice.from, noteFeeling(notice.note, notice.done));
    const icon = el('canvas', { className: 'hud-icon' });
    api.icon(icon, notice.item);
    fitIcon(icon, ROW_ICON / 2);
    const have = bag.find((s) => s.id === notice.item)?.count ?? 0;
    const what = asked(notice.item, notice.count);
    const note = notice.note.replace('{what}', what);
    const give = el('button', { type: 'button', className: 'hud-primary' });
    if (notice.done) {
      give.textContent = 'Done ✓';
      give.disabled = true;
    } else {
      give.replaceChildren('Hand over ', price(notice.candy));
      give.disabled = have < notice.count;
      give.addEventListener('click', () => {
        if (!api.answer(notice.slot)) return;
        message.textContent = `${VILLAGERS[notice.from].name} will be so pleased!`;
        render();
      });
    }
    return el(
      'section',
      { className: `hud-notice${notice.done ? ' hud-notice-done' : ''}` },
      el(
        'div',
        { className: 'hud-notice-top' },
        face,
        el(
          'p',
          {},
          ...(notice.during
            ? [
                el(
                  'small',
                  { className: 'hud-notice-for' },
                  glyphed({ mark: notice.during }, CALENDAR[notice.during].name),
                ),
              ]
            : []),
          note,
          el('small', {}, `— ${VILLAGERS[notice.from].name}`),
        ),
      ),
      el(
        'div',
        { className: 'hud-notice-foot' },
        el('span', { className: 'hud-icon-box hud-notice-icon' }, icon),
        el('small', {}, notice.done ? 'Answered.' : `You have ${have} of ${notice.count}.`),
        give,
      ),
    );
  }

  render();
  return sheet.close;
}
