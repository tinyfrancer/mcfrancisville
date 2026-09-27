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
/* 16×32 drawn at 1× and scaled by a whole number here, so each of her pixels is a whole block of
   device pixels at a devicePixelRatio of 1, 2 or 3. */
.hud-doll {
  width: ${16 * T.dollScale}px;
  height: ${32 * T.dollScale}px;
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
.hud-bag-button[data-new]::after {
  content: '';
  position: absolute;
  top: 2px;
  right: 2px;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: ${T.accent};
  border: 2px solid ${T.panel};
}
.hud-round { position: relative; }
.hud-bag {
  display: grid;
  /* Never narrower than a touch target, and never wider than the sheet, even on an SE. */
  grid-template-columns: repeat(5, minmax(${T.touchMin}px, ${T.touchMin + 12}px));
  gap: 8px;
  justify-content: center;
  margin: 8px 0 4px;
}
.hud-slot {
  position: relative;
  width: 100%;
  min-width: 0 !important;
  aspect-ratio: 1;
  padding: 0 !important;
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${T.field} !important;
  border: 2px solid ${T.panelEdge};
  border-radius: ${T.radius}px;
  box-sizing: border-box;
}
.hud-slot-empty { opacity: 0.45; }
.hud-slot[aria-pressed='true'] { border-color: ${T.accent} !important; }
/* 16×16 drawn at 1× and scaled by a whole number, like her preview. */
.hud-item {
  width: ${16 * T.itemScale}px;
  height: ${16 * T.itemScale}px;
  image-rendering: pixelated;
  pointer-events: none;
}
.hud-count {
  position: absolute;
  right: 3px;
  bottom: 1px;
  font: 700 13px ${T.font};
  color: ${T.text};
  text-shadow: 0 1px 0 ${T.field}, 0 0 3px ${T.field};
}
.hud-seeds { display: flex; flex-direction: column; gap: 8px; margin: 8px 0 4px; }
.hud-seed {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  padding: 6px 12px !important;
  text-align: left;
}
.hud-seed-text { display: flex; flex-direction: column; gap: 2px; }
.hud-seed small { font-weight: 400; font-size: 13px; color: ${T.muted}; }
.hud-seed-count { font-weight: 400; color: ${T.muted}; }
.hud-candy {
  position: absolute;
  top: calc(env(safe-area-inset-top) + 10px);
  left: calc(env(safe-area-inset-left) + 10px);
  min-height: ${T.touchMin}px;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  padding: 0 14px;
  background: ${T.panel};
  border: 2px solid ${T.panelEdge};
  border-radius: ${T.touchMin / 2}px;
  box-shadow: 0 2px 0 ${T.shadow};
  font: 700 17px ${T.font};
  color: ${T.accent};
}
.hud-shop-head {
  position: sticky;
  top: -20px;
  z-index: 1;
  margin: 0 -4px;
  padding: 6px 4px 2px;
  background: ${T.panel};
}
.hud-shop-head[hidden] { display: none; }
.hud-sheet .hud-purse { margin: 0; font: 700 18px ${T.font}; color: ${T.accent}; }
.hud-shop-head .hud-message { margin-top: 2px !important; }
.hud-wares { display: flex; flex-direction: column; gap: 8px; margin: 6px 0 4px; }
.hud-ware {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 6px 8px 6px 10px;
  background: ${T.field};
  border: 2px solid ${T.panelEdge};
  border-radius: ${T.radius}px;
}
.hud-ware .hud-item { flex: none; }
.hud-ware-text { display: flex; flex-direction: column; gap: 2px; flex: 1; min-width: 0; }
.hud-ware small { font-size: 13px; line-height: 1.3; color: ${T.muted}; }
.hud-price { flex: none; white-space: nowrap; padding: 0 12px !important; }
.hud-toast {
  position: absolute;
  top: calc(env(safe-area-inset-top) + 66px);
  left: 50%;
  max-width: min(340px, calc(100% - 32px));
  box-sizing: border-box;
  padding: 10px 16px;
  background: ${T.panel};
  border: 2px solid ${T.panelEdge};
  border-radius: ${T.radius}px;
  box-shadow: 0 3px 0 ${T.shadow};
  font-size: 15px;
  line-height: 1.35;
  text-align: center;
  opacity: 0;
  transform: translate(-50%, -6px);
  transition: opacity 0.25s, transform 0.25s;
}
.hud-piece {
  flex: none;
  width: 64px;
  height: 64px;
  image-rendering: pixelated;
  pointer-events: none;
}
.hud-surface { width: 60px; height: 60px; }
.hud-needs { display: flex; flex-wrap: wrap; gap: 2px 8px; margin-top: 2px; }
.hud-need { display: inline-flex; align-items: center; gap: 2px; font-size: 13px; color: ${T.text}; }
.hud-need[data-short] { color: ${T.muted}; }
.hud-need-icon { width: 32px; height: 32px; image-rendering: pixelated; }
.hud-decor-bar {
  position: absolute;
  left: calc(env(safe-area-inset-left) + 10px);
  right: calc(env(safe-area-inset-right) + 10px);
  bottom: calc(env(safe-area-inset-bottom) + 10px);
  box-sizing: border-box;
  padding: 10px 12px;
  background: ${T.panel};
  border: 2px solid ${T.panelEdge};
  border-radius: ${T.radius}px;
  box-shadow: 0 3px 0 ${T.shadow};
  pointer-events: auto;
  text-align: center;
}
.hud-decor-bar[hidden] { display: none; }
.hud-decor-bar p { margin: 0 0 8px; font-size: 15px; }
.hud-decor-bar .hud-row { justify-content: center; margin-top: 0; }
.hud-round[hidden] { display: none; }
.hud-toast-shown { opacity: 1; transform: translate(-50%, 0); }
.hud-toast-special { border-color: ${T.accent}; color: ${T.accent}; }
.hud-talk-head { display: flex; align-items: center; gap: 12px; margin-bottom: 4px; }
.hud-talk-head h2 { margin: 0 !important; }
.hud-talk-head small { font-size: 13px; color: ${T.muted}; }
/* A 16-pixel square of them, scaled by a whole number. */
.hud-portrait {
  flex: none;
  width: 64px;
  height: 64px;
  image-rendering: pixelated;
  background: ${T.field};
  border: 2px solid ${T.panelEdge};
  border-radius: ${T.radius}px;
}
.hud-sheet .hud-hearts { margin: 4px 0 8px; font-size: 18px; letter-spacing: 2px; color: ${T.accent}; }
.hud-sheet .hud-speech {
  padding: 10px 12px;
  background: ${T.field};
  border: 2px solid ${T.panelEdge};
  border-radius: ${T.radius}px;
  font-size: 16px;
  color: ${T.text};
}
.hud-bag[hidden] { display: none; }
.hud-letter {
  padding: 14px 16px;
  margin-bottom: 8px;
  background: ${T.field};
  border: 2px solid ${T.panelEdge};
  border-radius: ${T.radius}px;
  white-space: pre-line;
  font-size: 16px;
  line-height: 1.45;
  color: ${T.text};
}
`;

let injected = false;

export function injectHudStyles(): void {
  if (injected) return;
  const style = document.createElement('style');
  style.textContent = CSS;
  document.head.append(style);
  injected = true;
}
