import { THEME as T } from '../ui/theme';

const CSS = `
.hud {
  position: absolute;
  inset: 0;
  pointer-events: none;
  font-family: ${T.font};
  color: ${T.text};
  touch-action: manipulation;
  -webkit-tap-highlight-color: transparent;
  -webkit-user-select: none;
  user-select: none;
}
.hud button, .hud textarea, .hud input, .hud canvas, .hud .hud-sheet, .hud .hud-backdrop, .hud .hud-card {
  pointer-events: auto;
}
.hud button {
  min-width: ${T.touchMin}px;
  min-height: ${T.touchMin}px;
  padding: 0 16px;
  border: 2px solid ${T.panelEdge};
  border-radius: ${T.radius}px;
  background: ${T.button};
  color: ${T.buttonText};
  font: 600 16px ${T.font};
}
.hud button:active { transform: translateY(1px); }
.hud button:disabled { opacity: 0.45; }
.hud-corner {
  position: absolute;
  top: calc(env(safe-area-inset-top) + 10px);
  right: calc(env(safe-area-inset-right) + 10px);
  display: flex;
  gap: 10px;
}
.hud-round {
  width: ${T.touchMin}px;
  height: ${T.touchMin}px;
  padding: 0 !important;
  border-radius: 50% !important;
  font-size: 22px !important;
  box-shadow: 0 2px 0 ${T.shadow};
}
.hud-backdrop {
  position: absolute;
  inset: 0;
  background: ${T.shadow};
}
.hud-sheet {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  max-height: 85%;
  overflow-y: auto;
  box-sizing: border-box;
  padding: 20px calc(env(safe-area-inset-right) + 18px)
    calc(env(safe-area-inset-bottom) + 18px) calc(env(safe-area-inset-left) + 18px);
  background: ${T.panel};
  border-top: 2px solid ${T.panelEdge};
  border-radius: ${T.radius * 1.5}px ${T.radius * 1.5}px 0 0;
  -webkit-user-select: text;
  user-select: text;
}
.hud-sheet h2 { margin: 0 0 12px; font-size: 22px; }
.hud-sheet h3 { margin: 18px 0 6px; font-size: 17px; color: ${T.accent}; }
.hud-sheet p { margin: 0 0 10px; font-size: 15px; line-height: 1.4; color: ${T.muted}; }
.hud-sheet textarea {
  width: 100%;
  box-sizing: border-box;
  min-height: 72px;
  padding: 10px;
  border: 2px solid ${T.panelEdge};
  border-radius: ${T.radius}px;
  background: ${T.field};
  color: ${T.text};
  font: 13px ${T.mono};
  word-break: break-all;
  resize: none;
}
.hud-row { display: flex; gap: 10px; margin-top: 10px; flex-wrap: wrap; }
.hud-message { min-height: 1.4em; margin-top: 8px !important; color: ${T.accent} !important; }
.hud-card {
  position: absolute;
  left: calc(env(safe-area-inset-left) + 12px);
  right: calc(env(safe-area-inset-right) + 12px);
  bottom: calc(env(safe-area-inset-bottom) + 12px);
  padding: 14px 16px;
  background: ${T.panel};
  border: 2px solid ${T.panelEdge};
  border-radius: ${T.radius}px;
  box-shadow: 0 3px 0 ${T.shadow};
  font-size: 15px;
  line-height: 1.4;
}
.hud-card p { margin: 0 0 10px; }
.hud-sheet h2 + p { margin-top: -4px; }
.hud-sheet section h3 { margin-top: 14px; }
.hud-stage {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  margin: 4px 0 6px;
}
/* 16×24 drawn at 1× and scaled by a whole number here, so each of her pixels is a whole block of
   device pixels at a devicePixelRatio of 1, 2 or 3. */
.hud-doll {
  width: ${16 * T.dollScale}px;
  height: ${24 * T.dollScale}px;
  image-rendering: pixelated;
  /* Not ink: her outline is ink, and she'd lose her edges against it. */
  background: ${T.stage};
  border: 2px solid ${T.panelEdge};
  border-radius: ${T.radius}px;
  padding: 8px ${T.dollScale * 4}px;
}
.hud-turn { font-size: 14px !important; min-height: 36px !important; }
.hud-choices { display: flex; flex-wrap: wrap; gap: 8px; margin: 8px 0; }
.hud-chip[aria-pressed='true'] {
  background: ${T.accent};
  color: ${T.field};
  border-color: ${T.accent};
}
.hud-swatch {
  width: ${T.touchMin}px;
  padding: 0 !important;
  border-radius: 50% !important;
  border-width: 3px !important;
}
.hud-swatch[aria-pressed='true'] {
  border-color: ${T.accent} !important;
  box-shadow: 0 0 0 3px ${T.panel}, 0 0 0 5px ${T.accent};
}
.hud-tabs { flex-wrap: nowrap; overflow-x: auto; margin: 4px -4px 4px; padding: 0 4px 4px; }
.hud-tabs .hud-chip { flex: none; }
.hud-tab-body { min-height: 120px; }
.hud-name {
  width: 100%;
  box-sizing: border-box;
  min-height: ${T.touchMin}px;
  padding: 8px 12px;
  border: 2px solid ${T.panelEdge};
  border-radius: ${T.radius}px;
  background: ${T.field};
  color: ${T.text};
  /* 16px or larger, or iOS zooms the page in when the field is focused. */
  font: 600 18px ${T.font};
}
.hud-primary { background: ${T.accentButton} !important; color: ${T.field} !important; }
`;

let injected = false;

export function injectHudStyles(): void {
  if (injected) return;
  const style = document.createElement('style');
  style.textContent = CSS;
  document.head.append(style);
  injected = true;
}
