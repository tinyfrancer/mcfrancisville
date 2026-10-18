import { THEME as T } from '../ui/theme';

/** The calendar's "up now" lines and the date chip's dot (V1's R2), read into the HUD's styles. */
export const TODAY_CSS = `
.hud-cal-upnow { list-style: none; margin: 6px 0 12px; padding: 0; display: grid; gap: 6px; }
.hud-cal-line .hud-cal-event { margin: 0; padding: 8px 10px; border-radius: 12px; background: ${T.field}; }
.hud-cal-go {
  width: 100%;
  min-height: ${T.touchMin}px;
  border: none;
  font: inherit;
  color: inherit;
  text-align: left;
  cursor: pointer;
  align-items: center !important;
  box-shadow: 0 2px 0 ${T.shadow};
}
.hud-cal-go:active { transform: translateY(1px); box-shadow: none; }
.hud .hud-cal-go { font-weight: 400; }
.hud-cal-go > span:nth-child(2) { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 2px; }
.hud-cal-go-mark { margin-left: auto; opacity: 0.7; }
.hud-today { position: relative; }
.hud-today[data-new]::after {
  content: '';
  position: absolute;
  top: 3px;
  right: 3px;
  width: 9px;
  height: 9px;
  border-radius: 50%;
  background: ${T.accent};
  border: 2px solid ${T.panel};
  animation: hud-dot-settle 420ms cubic-bezier(0.34, 1.56, 0.64, 1) both;
}
@media (prefers-reduced-motion: reduce) {
  .hud-today[data-new]::after { animation: none; }
}
`;
