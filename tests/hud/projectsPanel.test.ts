import { describe, expect, it } from 'vitest';
import { PROJECT_IDS } from '../../src/data/projects';
import { askFirstLine, projectsPanel, type ProjectsPanelApi } from '../../src/hud/ProjectsPanel';
import type { ProjectId } from '../../src/types/ids';
import type { ProjectView } from '../../src/world/services/Projects';

/** The four projects, none begun, and what of hers stands on each one's site. */
function stub(inTheWay: Partial<Record<ProjectId, string[]>>) {
  const started: ProjectId[] = [];
  const view = (id: ProjectId): ProjectView => ({
    id,
    stage: null,
    built: false,
    current: started.includes(id),
    progress: 0,
    candy: { wanted: 100, has: 0 },
    items: [],
  });
  const api: ProjectsPanelApi = {
    projects: () => PROJECT_IDS.map(view),
    startProject: (id) => {
      started.push(id);
      return inTheWay[id] ?? [];
    },
    inTheWay: (id) => (started.length > 0 ? [] : (inTheWay[id] ?? [])),
    giveProject: () => false,
    projectPicture: () => {},
    icon: () => {},
  };
  return { api, started };
}

const startOf = (panel: HTMLElement, i: number) =>
  panel.querySelectorAll<HTMLButtonElement>('.hud-project .hud-primary')[i]!;
const buttonCalled = (panel: HTMLElement, text: string) =>
  [...panel.querySelectorAll<HTMLButtonElement>('button')].find((b) => b.textContent === text);

describe('a card before a project moves her things (1.0.1)', () => {
  const greenhouse = PROJECT_IDS.indexOf('greenhouse');

  it('starts at once when nothing of hers stands in the way', () => {
    const { api, started } = stub({});
    const panel = document.createElement('div');
    projectsPanel(panel, api);
    startOf(panel, 0).click();
    expect(started).toEqual([PROJECT_IDS[0]]);
    expect(panel.querySelector('.hud-project-ask')).toBeNull();
  });

  it('asks first, naming what goes in the chest, and Not yet leaves everything be', () => {
    const { api, started } = stub({ greenhouse: ['Garden bench'] });
    const panel = document.createElement('div');
    projectsPanel(panel, api);
    startOf(panel, greenhouse).click();
    expect(started).toEqual([]);
    const card = panel.querySelector('.hud-project-ask');
    expect(card?.textContent).toContain('your garden bench stands');
    expect(card?.textContent).toContain('storage chest');
    buttonCalled(panel, 'Not yet')!.click();
    expect(panel.querySelector('.hud-project-ask')).toBeNull();
    expect(started).toEqual([]);
    expect(startOf(panel, greenhouse).textContent).toBe('Start this one');
  });

  it('starts it on Go ahead, and says where her things went', () => {
    const { api, started } = stub({ greenhouse: ['Garden bench', 'Yard lantern'] });
    const panel = document.createElement('div');
    projectsPanel(panel, api);
    startOf(panel, greenhouse).click();
    buttonCalled(panel, 'Go ahead')!.click();
    expect(started).toEqual(['greenhouse']);
    expect(panel.querySelector('.hud-message')?.textContent).toContain(
      'Your garden bench and yard lantern are snug in your storage chest.',
    );
  });

  it('says one thing or several warmly', () => {
    expect(askFirstLine('Your greenhouse', ['Garden bench'])).toBe(
      "Your greenhouse goes up right where your garden bench stands. It'll tuck into your " +
        'storage chest for now, safe and sound, to come out again wherever you like.',
    );
    expect(askFirstLine('Your greenhouse', ['Bench', 'Lantern'])).toContain(
      "your bench and lantern stand. They'll tuck",
    );
  });
});
