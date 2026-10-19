import { THEME as T } from '../ui/theme';

/** The noticeboard's Projects tab (V1's R4), read into the HUD's styles. */
export const PROJECT_CSS = `
.hud-project {
  margin: 0 0 12px;
  padding: 10px;
  background: ${T.field};
  border: 2px solid ${T.panelEdge};
  border-radius: ${T.radius}px;
}
.hud-project h3 { margin: 0 0 4px; font-size: 17px; }
.hud-project p { margin: 0 0 6px; font-size: 14px; }
.hud-project small { color: ${T.muted}; }
.hud-project-picture {
  display: flex;
  justify-content: center;
  align-items: flex-end;
  min-height: 72px;
  margin: 0 0 8px;
  padding: 8px;
  border-radius: 10px;
  background: ${T.stage};
}
.hud-project-picture canvas { image-rendering: pixelated; }
.hud-project-built .hud-project-picture { outline: 2px solid ${T.accent}; }
.hud-project-bar {
  height: 10px;
  margin: 6px 0 8px;
  border-radius: 5px;
  background: ${T.panel};
  overflow: hidden;
}
.hud-project-bar span { display: block; height: 100%; background: ${T.accent}; }
.hud-project-need {
  display: grid;
  grid-template-columns: 32px minmax(0, 1fr) auto;
  align-items: center;
  gap: 8px;
  margin-top: 8px;
}
.hud-project-need .hud-icon-box { width: 32px; height: 32px; }
.hud-project-need small { display: block; }
.hud-project-need[data-done] { opacity: 0.6; }
.hud-project-stage { color: ${T.accent}; font-weight: 600; }
.hud-project-need .hud-primary { grid-column: 2 / span 2; }
.hud-project-ask {
  margin-top: 8px;
  padding: 10px;
  background: ${T.panel};
  border: 2px solid ${T.accent};
  border-radius: ${T.radius}px;
}
.hud-project-ask .hud-actions { display: flex; flex-wrap: wrap; justify-content: flex-end; gap: 8px; }
`;
