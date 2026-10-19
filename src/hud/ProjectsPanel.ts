import { ITEMS } from '../data/items';
import { CANDY_LOT, PROJECTS, type ProjectStage } from '../data/projects';
import type { ItemId, ProjectId } from '../types/ids';
import type { Gift, ProjectView } from '../world/services/Projects';
import { fitIcon } from './collection';
import { button, el } from './dom';
import { glyph, price } from './glyph';
import { howMany } from './itemCard';

/** What the Projects tab may ask of the game, through the noticeboard's Api. */
export interface ProjectsPanelApi {
  projects(): readonly ProjectView[];
  startProject(id: ProjectId): readonly string[] | null;
  inTheWay(id: ProjectId): readonly string[];
  giveProject(gift: Gift): boolean;
  projectPicture(canvas: HTMLCanvasElement, id: ProjectId): void;
  icon(canvas: HTMLCanvasElement, id: ItemId): void;
}

/** How wide a project's picture may be drawn, in CSS pixels. */
const PICTURE_BOX = 192;

/** How a project stands, in her words. */
const STAGE_WORDS: Record<ProjectStage | 'none', string> = {
  none: 'Nothing up yet: the first thing you give puts the posts in.',
  posts: 'The posts are in. At halfway, the frame goes up.',
  frames: 'The frame is up! Not long now.',
  done: 'Built!',
};

/** What she's told before a project goes up where things of hers stand (1.0.1). */
export function askFirstLine(name: string, moving: readonly string[]): string {
  const things = moving.join(' and ').toLowerCase();
  const them = moving.length > 1 ? 'They' : 'It';
  return (
    `${name} goes up right where your ${things} ${moving.length > 1 ? 'stand' : 'stands'}. ` +
    `${them}'ll tuck into your storage chest for now, safe and sound, ` +
    `to come out again wherever you like.`
  );
}

/** A little card in place of Start: what would move, then Go ahead or Not yet. */
function askFirst(
  name: string,
  moving: readonly string[],
  go: () => void,
  notYet: () => void,
): HTMLElement {
  const card = el(
    'div',
    { className: 'hud-project-ask' },
    el('p', {}, askFirstLine(name, moving)),
    el('div', { className: 'hud-actions' }, button('Not yet', notYet), button('Go ahead', go, true)),
  );
  card.setAttribute('role', 'group');
  card.setAttribute('aria-label', `Before ${name} starts`);
  return card;
}

/** Not yet: the card goes, and Start is back as it was. */
function askFirstAgain(section: HTMLElement, start: HTMLElement): void {
  section.querySelector('.hud-project-ask')?.replaceWith(start);
}

/**
 * The noticeboard's Projects tab (V1's R4): the town's projects, one funded at a time. With none
 * under way, each not yet built with a Start button; with one, its picture, how far along it is,
 * and a row for each thing it asks for, a − n + and a Give. Those built are listed below.
 */
export function projectsPanel(panel: HTMLElement, api: ProjectsPanelApi): { render(): void } {
  const message = el('p', { className: 'hud-message' });

  const picture = (id: ProjectId) => {
    const canvas = el('canvas');
    api.projectPicture(canvas, id);
    fitIcon(canvas, Math.min(PICTURE_BOX, canvas.width * 2));
    return el('div', { className: 'hud-project-picture' }, canvas);
  };

  const bar = (progress: number) => {
    const percent = Math.round(progress * 100);
    const fill = el('span');
    fill.style.width = `${percent}%`;
    const shown = el('div', { className: 'hud-project-bar' }, fill);
    shown.setAttribute('role', 'progressbar');
    shown.setAttribute('aria-valuenow', String(percent));
    return shown;
  };

  const head = (p: ProjectView) => {
    const row = PROJECTS[p.id];
    const progress = bar(p.progress);
    return [
      picture(p.id),
      el('h3', {}, row.name),
      el('small', {}, `Goes up ${row.where}.`),
      el('p', {}, row.blurb),
      progress,
      el('p', { className: 'hud-project-stage' }, STAGE_WORDS[p.stage ?? 'none']),
    ];
  };

  /** A row for something a project asks for: what, how much is in, and a − n + to give. */
  const need = (
    icon: HTMLElement,
    name: string,
    line: string,
    most: number,
    give: (n: number) => boolean,
    label: (n: number) => (Node | string)[],
    done: boolean,
  ) => {
    const button = el('button', { type: 'button', className: 'hud-primary' });
    const parts: HTMLElement[] = [];
    if (done) {
      button.textContent = 'All in';
      button.disabled = true;
    } else if (most <= 0) {
      button.textContent = 'Give';
      button.disabled = true;
    } else {
      const count = howMany(most, (n) => button.replaceChildren(...label(n)));
      button.replaceChildren(...label(1));
      button.addEventListener('click', () => {
        if (!give(count.value())) return;
        message.textContent = 'Thank you! Every bit helps.';
        render();
      });
      parts.push(count.element);
    }
    const row = el(
      'div',
      { className: 'hud-project-need' },
      el('span', { className: 'hud-icon-box' }, icon),
      el('span', {}, el('strong', {}, name), el('small', {}, line)),
      ...parts,
      button,
    );
    if (done) row.dataset.done = '';
    return row;
  };

  const underWay = (p: ProjectView) => {
    const rows: HTMLElement[] = [];
    const { wanted, has } = p.candy;
    const lots = Math.ceil(Math.min(wanted, has) / CANDY_LOT);
    const asked = PROJECTS[p.id].candy;
    rows.push(
      need(
        glyph('candy', 32),
        'Candy',
        `${asked - wanted} of ${asked} in · you have ${has}`,
        lots,
        (n) => api.giveProject({ candy: n }),
        (n) => ['Give ', price(Math.min(n * CANDY_LOT, wanted, has))],
        wanted === 0,
      ),
    );
    for (const item of p.items) {
      const icon = el('canvas', { className: 'hud-icon' });
      api.icon(icon, item.item);
      fitIcon(icon, 32);
      const left = item.of - item.given;
      rows.push(
        need(
          icon,
          ITEMS[item.item].name,
          `${item.given} of ${item.of} in · you have ${item.has}`,
          Math.min(left, item.has),
          (n) => api.giveProject({ item: item.item, count: n }),
          (n) => [`Give ${n}`],
          left === 0,
        ),
      );
    }
    return el('section', { className: 'hud-project' }, ...head(p), ...rows);
  };

  const toStart = (p: ProjectView, free: boolean) => {
    const row = PROJECTS[p.id];
    const asks = [
      `${row.candy} Candy`,
      ...row.needs.map((n) => `${n.count} ${ITEMS[n.item].name.toLowerCase()}`),
    ].join(', ');
    const go = () => {
      const moved = api.startProject(p.id);
      if (moved === null) return;
      message.textContent =
        `${row.name}: here we go! Give a little whenever you like.` +
        (moved.length > 0
          ? ` Your ${moved.join(' and ').toLowerCase()} ${moved.length > 1 ? 'are' : 'is'} snug in your storage chest.`
          : '');
      render();
    };
    const start = el('button', { type: 'button', className: 'hud-primary' }, 'Start this one');
    start.disabled = !free;
    const section = el(
      'section',
      { className: 'hud-project' },
      ...head(p),
      el('small', {}, `It asks ${asks}.`),
      start,
    );
    start.addEventListener('click', () => {
      const moving = api.inTheWay(p.id);
      if (moving.length === 0) return go();
      // Something of hers stands where it'll go up: asked first, kindly (1.0.1).
      start.replaceWith(askFirst(row.name, moving, go, () => askFirstAgain(section, start)));
    });
    return section;
  };

  const built = (p: ProjectView) =>
    el(
      'section',
      { className: 'hud-project hud-project-built' },
      picture(p.id),
      el('h3', {}, PROJECTS[p.id].name),
      el('small', {}, `Built ${PROJECTS[p.id].where}.`),
    );

  function render(): void {
    const all = api.projects();
    const current = all.find((p) => p.current);
    const waiting = all.filter((p) => !p.built && !p.current);
    const done = all.filter((p) => p.built);
    const intro = current
      ? 'The town is building, one project at a time. Give a little whenever you like.'
      : waiting.length > 0
        ? 'Pick the next thing for the town to build. You fund it a little at a time, and it goes up where it will stand.'
        : 'Every project is built. The town is very proud of you.';
    panel.replaceChildren(
      el('p', {}, intro),
      ...(current ? [underWay(current)] : waiting.map((p) => toStart(p, true))),
      message,
      ...done.map(built),
    );
  }

  render();
  return { render };
}
