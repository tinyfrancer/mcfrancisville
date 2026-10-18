import { THEME as T } from '../ui/theme';

/** The fairground games' stage and what's under it (V1's R6b), read into the HUD's styles. */
export const FAIR_CSS = `
.hud-fair-stage {
  display: block;
  margin: 6px auto 4px;
  image-rendering: pixelated;
  border-radius: ${T.radius}px;
  touch-action: none;
  -webkit-user-select: none;
  user-select: none;
  cursor: pointer;
}
.hud-fair-below { display: flex; flex-direction: column; align-items: center; }
.hud-fair-below .hud-message, .hud-fair-below .hud-fact { text-align: center; }
.hud-fair-throw {
  display: block;
  margin: 6px auto 4px;
  min-width: 160px;
  min-height: ${T.touchMin}px;
  touch-action: none;
  -webkit-user-select: none;
  user-select: none;
}
.hud-fair-prize { width: 100%; }
`;
