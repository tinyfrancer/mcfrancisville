import { THEME as T } from '../ui/theme';

/** The pet sheet's fondness (V1's R6c): a little bar of how far to the next level, and what's next. */
export const PET_CSS = `
.hud-pet-fond {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  align-items: center;
  gap: 4px 8px;
  margin: 0 0 8px;
  font-size: 14px;
}
.hud-pet-fond .hud-pet-hearts { display: flex; gap: 2px; }
.hud-pet-bar {
  height: 10px;
  border-radius: 5px;
  background: ${T.panel};
  border: 1px solid ${T.panelEdge};
  overflow: hidden;
}
.hud-pet-bar span { display: block; height: 100%; background: ${T.accent}; }
.hud-pet-next { grid-column: 1 / -1; margin: 0; color: ${T.muted}; }
`;
