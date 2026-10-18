import { THEME as T } from '../ui/theme';

/** The Backup tab's cloud section and the offer of a newer town (V1's S2), read into the styles. */
export const CLOUD_CSS = `
.hud-sheet .hud-cloud-line { font-size: 14px; color: ${T.muted}; }
.hud-sheet .hud-cloud-code {
  margin: 8px 0;
  padding: 10px;
  border-radius: ${T.radius}px;
  background: ${T.field};
  color: ${T.text};
  font: 600 15px ${T.mono};
  letter-spacing: 0;
  white-space: nowrap;
  overflow-x: auto;
  text-align: center;
  word-break: break-word;
  user-select: all;
  -webkit-user-select: all;
}
.hud-cloud-qr { display: flex; justify-content: center; margin: 6px 0; }
.hud-cloud-qr .hud-qr { display: block; border-radius: 6px; image-rendering: pixelated; }
.hud-sheet .hud-cloud-field {
  width: 100%;
  box-sizing: border-box;
  min-height: ${T.touchMin}px;
  padding: 10px;
  border: 2px solid ${T.panelEdge};
  border-radius: ${T.radius}px;
  background: ${T.field};
  color: ${T.text};
  font: 16px ${T.mono};
  text-transform: uppercase;
}
.hud-sheet .hud-cloud-field::placeholder { text-transform: none; }
`;
