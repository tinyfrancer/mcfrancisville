import { THEME as T } from '../ui/theme';
import { CARD_ICON } from './itemCard';

const CSS = `
.hud {
  position: absolute;
  inset: 0;
  display: grid;
  grid-template-rows: auto minmax(0, 1fr) auto;
  grid-template-columns: minmax(0, 1fr);
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
.hud-bar {
  position: relative;
  display: flex;
  align-items: center;
  gap: 8px;
  padding-left: calc(env(safe-area-inset-left) + 10px);
  padding-right: calc(env(safe-area-inset-right) + 10px);
  background: ${T.panel};
  pointer-events: auto;
}
.hud-top {
  padding-top: calc(env(safe-area-inset-top) + 6px);
  padding-bottom: 6px;
  border-bottom: 2px solid ${T.panelEdge};
}
.hud-bottom {
  padding-top: 6px;
  padding-bottom: calc(env(safe-area-inset-bottom) + 6px);
  border-top: 2px solid ${T.panelEdge};
}
.hud-view { position: relative; min-height: 0; overflow: hidden; }
.hud-trim { flex: 1; text-align: right; font-size: 18px; line-height: 1; opacity: 0.9; }
.hud .hud-settings { flex: none; }
.hud-menu { flex: 1 1 auto; display: flex; justify-content: center; align-items: center; gap: 10px; }
.hud-menu-more { display: contents; }
.hud .hud-more { display: none; }
/* Outdoors, upright: the quick bar takes the row, the bag and "more" sit at its end. */
.hud-bottom[data-compact] .hud-menu { flex: none; gap: 8px; }
.hud-bottom[data-compact] .hud-more { display: inline-block; }
.hud-bottom[data-compact] .hud-menu-more { display: none; }
.hud-bottom[data-compact][data-open] .hud-menu-more {
  display: flex;
  flex-direction: column;
  gap: 10px;
  position: absolute;
  right: calc(env(safe-area-inset-right) + 6px);
  bottom: calc(100% + 8px);
  padding: 8px;
  background: ${T.panel};
  border: 2px solid ${T.panelEdge};
  border-radius: ${T.radius * 1.5}px;
}
.hud-bottom[data-open] .hud-more { border-color: ${T.accent}; }
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
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
  background: ${T.panel};
  border-top: 2px solid ${T.panelEdge};
  border-radius: ${T.radius * 1.5}px ${T.radius * 1.5}px 0 0;
  -webkit-user-select: text;
  user-select: text;
}
.hud-sheet-head, .hud-sheet-body, .hud-sheet-foot {
  padding-left: calc(env(safe-area-inset-left) + 18px);
  padding-right: calc(env(safe-area-inset-right) + 18px);
}
.hud-sheet-head { flex: none; padding-top: 18px; padding-bottom: 4px; }
.hud-sheet-body {
  flex: 1 1 auto;
  min-height: 0;
  overflow-y: auto;
  overscroll-behavior: contain;
  -webkit-overflow-scrolling: touch;
  padding-bottom: 4px;
}
.hud-sheet-foot {
  flex: none;
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  align-items: center;
  gap: 10px;
  padding-top: 10px;
  padding-bottom: calc(env(safe-area-inset-bottom) + 14px);
  border-top: 2px solid ${T.field};
}
.hud-sheet-actions { display: flex; flex-wrap: wrap; gap: 10px; flex: 1; }
.hud-sheet-actions:empty { display: none; }
.hud-sheet-head .hud-sheet-line { margin: -4px 0 8px; }
.hud-sheet-line[hidden] { display: none; }
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
.hud-sheet section h3 { margin-top: 14px; }
.hud-stage {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  margin: 4px 0 6px;
}
/* 32×48 drawn at 1× and scaled by a whole number here, so each of her pixels is a whole block of
   device pixels at a devicePixelRatio of 1, 2 or 3. */
.hud-doll {
  width: ${32 * T.dollScale}px;
  /* Her height follows her picture's, which a tall hat makes taller. */
  height: auto;
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
.hud-round[data-new]::after {
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
/* A squishy or doll she hasn't had yet: its shadow (0.2's F2). */
.hud-unhad .hud-icon { filter: brightness(0); opacity: 0.35; }
.hud-slot[aria-pressed='true'] { border-color: ${T.accent} !important; }
/* Drawn at 1× and sized by \`fitIcon\` to a whole scale, so each pixel is a whole block. */
.hud-icon {
  flex: none;
  image-rendering: pixelated;
  pointer-events: none;
}
.hud-icon-box {
  flex: none;
  width: 64px;
  height: 64px;
  display: flex;
  align-items: flex-end;
  justify-content: center;
}
.hud-new {
  display: inline-block;
  padding: 0 5px;
  border-radius: 8px;
  background: ${T.accent};
  color: ${T.field};
  font: 700 11px ${T.font};
  line-height: 16px;
  vertical-align: middle;
}
.hud-slot .hud-new { position: absolute; top: -6px; left: -4px; }
.hud-tag { background: ${T.text}; }
.hud-collection-tools { margin: 0 0 4px; }
.hud-find { display: flex; gap: 8px; align-items: center; margin: 4px 0; }
.hud-find[hidden], .hud-filters[hidden], .hud-sort[hidden] { display: none; }
.hud-search {
  flex: 1;
  min-width: 0;
  min-height: ${T.touchMin}px;
  box-sizing: border-box;
  padding: 6px 12px;
  border: 2px solid ${T.panelEdge};
  border-radius: ${T.touchMin / 2}px;
  background: ${T.field};
  color: ${T.text};
  /* 16px or larger, or iOS zooms the page in when the field is focused. */
  font: 16px ${T.font};
  -webkit-appearance: none;
  appearance: none;
}
.hud .hud-sort { flex: none; font-size: 14px; padding: 0 12px; }
.hud-filters { margin: 4px -4px 2px; }
.hud-filters .hud-chip { font-size: 14px; }
.hud-filters .hud-chip[hidden] { display: none; }
.hud-collection > .hud-empty { grid-column: 1 / -1; margin: 12px 0; text-align: center; }
.hud-detail { flex: 1; min-width: 0; }
.hud-detail h3 { margin: 0 0 4px !important; }
.hud-detail p { margin: 0 0 4px !important; font-size: 14px !important; }
.hud-detail .hud-eat { margin-top: 4px; }
.hud-item-name { display: flex; align-items: center; gap: 8px; margin-bottom: 4px; }
.hud-item-name h3 { margin: 0 !important; }
.hud-item-card .hud-icon-box { width: ${CARD_ICON}px; height: ${CARD_ICON}px; align-items: center; }
.hud-item-card .hud-icon-box[hidden] { display: none; }
.hud-item-card .hud-row { margin-top: 6px; gap: 8px; }
.hud-item-card .hud-row[hidden] { display: none; }
.hud-how-many { display: flex; align-items: center; gap: 4px; }
.hud-how-many .hud-chip { width: ${T.touchMin}px; padding: 0; font-size: 20px; }
.hud-how-many-n { min-width: 2ch; text-align: center; font: 700 17px ${T.font}; color: ${T.text}; }
.hud-colours { display: flex; flex-direction: column; flex: 1; min-width: 0; }
.hud-colours small { color: ${T.muted}; font-size: 13px; }
.hud-colours p { margin: 2px 0 0 !important; font-size: 14px !important; }
.hud-colours .hud-choices { margin: 4px 0 0; }
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
.hud-today {
  flex: none;
  padding: 0 12px !important;
  border-radius: ${T.touchMin / 2}px !important;
  font-size: 14px !important;
  box-shadow: 0 2px 0 ${T.shadow};
}
.hud-today-on { font-size: 16px; }
.hud-today-left { font-size: 13px; font-weight: 600; color: ${T.accent}; }
.hud-notice,
.hud-notice-wanted {
  margin: 0 0 12px;
  padding: 10px;
  background: ${T.field};
  border: 2px solid ${T.panelEdge};
  border-radius: ${T.radius}px;
}
.hud-notice-done { opacity: 0.6; }
.hud-notice-top { display: flex; gap: 10px; align-items: flex-start; }
.hud-notice-top p { margin: 0; display: flex; flex-direction: column; gap: 4px; }
.hud-notice-top small { color: ${T.muted}; }
.hud-notice-top .hud-notice-for { color: ${T.accent}; font-weight: 600; }
.hud-notice-face { width: 48px; height: 48px; }
.hud-notice-wanted p { margin: 0; display: flex; flex-direction: column; gap: 4px; }
.hud-notice-wanted .hud-notice-for { color: ${T.accent}; font-weight: 600; }
.hud-notice-foot { display: flex; align-items: center; gap: 8px; margin-top: 8px; }
.hud-notice-foot small { flex: 1; color: ${T.muted}; }
.hud-notice-icon { width: 32px; height: 32px; }
.hud-cal-today p, .hud-cal-soon p { margin: 6px 0; }
.hud-cal-quiet { color: ${T.muted}; }
.hud-cal-event { display: flex; gap: 10px; align-items: flex-start; margin: 8px 0; }
.hud-cal-event > span:last-child { display: flex; flex-direction: column; gap: 2px; }
.hud-cal-event small { color: ${T.muted}; font-size: 13px; }
.hud-cal-icon { font-size: 24px; line-height: 1; }
.hud-cal-head { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
.hud-cal-title { margin: 0; }
.hud-cal-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 4px;
  margin: 8px 0;
}
.hud-cal-weekday { text-align: center; font-size: 12px; color: ${T.muted}; }
.hud .hud-cal-day {
  min-width: 0;
  min-height: ${T.touchMin}px;
  padding: 2px !important;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1px;
  font-size: 14px;
  font-weight: 400;
  border-radius: 8px;
  background: ${T.field};
}
.hud .hud-cal-day.hud-cal-now { border-color: ${T.accent}; color: ${T.accent}; font-weight: 700; }
.hud .hud-cal-day.hud-cal-picked { background: ${T.button}; }
.hud .hud-cal-day.hud-cal-span { box-shadow: inset 0 -4px 0 ${T.festival}; }
.hud-cal-mark { display: block; margin: 1px auto 0; image-rendering: pixelated; }
.hud-cal-countdown { color: ${T.accent}; font-weight: 600; }
.hud-cal-detail h4 { margin: 8px 0 4px; }
.hud-candy {
  flex: none;
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
.hud-shop-head { padding: 2px 0; }
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
.hud-ware-text { display: flex; flex-direction: column; gap: 2px; flex: 1; min-width: 0; }
.hud-ware small { font-size: 13px; line-height: 1.3; color: ${T.muted}; }
.hud-price { flex: none; white-space: nowrap; padding: 0 12px !important; }
.hud-was { opacity: 0.6; font-size: 0.8em; }
/* At the top of the world, under the bar. */
.hud-toast {
  position: absolute;
  top: 10px;
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
.hud-surface { width: 60px; height: 60px; }
.hud-needs { display: flex; flex-wrap: wrap; gap: 2px 8px; margin-top: 2px; }
.hud-need { display: inline-flex; align-items: center; gap: 2px; font-size: 13px; color: ${T.text}; }
.hud-need[data-short] { color: ${T.muted}; }
.hud-need-icon { width: 32px; height: 32px; image-rendering: pixelated; }
.hud-decor-bar { position: relative; flex: 1 1 auto; min-width: 0; pointer-events: auto; }
.hud-menu[hidden] { display: none; }
.hud-decor-bar[hidden] { display: none; }
.hud-quick {
  position: relative;
  flex: 1 1 auto;
  min-width: 0;
  display: flex;
  pointer-events: none;
}
.hud-quick[hidden] { display: none; }
.hud-quick-slots {
  display: flex;
  gap: 6px;
  max-width: 100%;
  box-sizing: border-box;
  overflow-x: auto;
  scrollbar-width: none;
  pointer-events: auto;
}
.hud-quick-slots::-webkit-scrollbar { display: none; }
.hud .hud-quick-slot {
  position: relative;
  flex: none;
  width: ${T.touchMin + 4}px;
  height: ${T.touchMin + 4}px;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${T.field};
}
.hud-quick-slot[aria-pressed='true'] {
  border-color: ${T.accent};
  box-shadow: 0 0 0 2px ${T.accent};
}
.hud-quick-say {
  /* Over the world just above the bar, so saying it never moves the bar. */
  position: absolute;
  bottom: calc(100% + 12px);
  left: 50%;
  transform: translateX(-50%);
  width: max-content;
  margin: 0;
  padding: 6px 12px;
  max-width: 300px;
  background: ${T.panel};
  border: 2px solid ${T.panelEdge};
  border-radius: ${T.radius}px;
  font-size: 14px;
  line-height: 1.3;
  text-align: center;
  opacity: 0;
  transition: opacity 0.25s;
}
.hud-quick-said { opacity: 1; }

.hud-bed {
  left: 0;
  top: 0;
  right: auto;
  bottom: auto;
  width: min(280px, calc(100% - 16px));
  box-sizing: border-box;
  padding: 8px 10px 10px 12px;
  font-size: 14px;
  line-height: 1.35;
}
.hud-bed[hidden] { display: none; }
.hud-bed-head { display: flex; align-items: center; gap: 8px; }
.hud-bed-head strong { flex: 1; font-size: 16px; }
.hud-bed-head .hud-icon { width: 32px; height: 32px; }
.hud-bed-head .hud-bed-picture { align-self: flex-end; }
.hud .hud-bed-close {
  min-width: ${T.touchMin}px;
  min-height: ${T.touchMin}px;
  padding: 0;
  margin: -8px -8px -6px 0;
  border: none;
  background: transparent;
}
.hud-bed p { margin: 4px 0 0; }
.hud-bed .hud-row { margin-top: 8px; gap: 8px; }
.hud-bed .hud-row button { flex: 1 1 auto; padding: 0 12px; font-size: 15px; }

/* What a tap will do, over the world just above the bar, like the quick bar's line. */
.hud-decor-bar p {
  position: absolute;
  bottom: calc(100% + 12px);
  left: 50%;
  transform: translateX(-50%);
  width: max-content;
  max-width: 300px;
  margin: 0;
  padding: 6px 12px;
  background: ${T.panel};
  border: 2px solid ${T.panelEdge};
  border-radius: ${T.radius}px;
  font-size: 14px;
  line-height: 1.3;
  text-align: center;
}
.hud-decor-bar .hud-row { justify-content: center; flex-wrap: nowrap; gap: 8px; margin-top: 0; }
.hud-decor-bar .hud-row button { padding: 0 12px; font-size: 15px; white-space: nowrap; }
.hud-round[hidden] { display: none; }
/* Shown, it takes a tap (to send it off) rather than letting it through to the world. */
.hud-toast-shown { opacity: 1; transform: translate(-50%, 0); pointer-events: auto; cursor: pointer; }
/* Clear of the line the quick bar says over itself. */
.hud-toast-low { top: auto; bottom: 64px; }
.hud-view .hud-install { bottom: 12px; }
.hud-toast-special { border-color: ${T.accent}; color: ${T.accent}; }
.hud-talk-head { display: flex; align-items: center; gap: 12px; margin-bottom: 4px; }
.hud-talk-head h2 { margin: 0 !important; }
.hud-talk-head small { font-size: 13px; color: ${T.muted}; }
/* A 32-pixel square of them, scaled by a whole number. */
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
.hud-sheet .hud-gift { margin: 8px 2px 0; font-size: 15px; color: ${T.accent}; }
/* The red Tesla's road: it drives across once, left to right, and parks just out of view. */
.hud-road { container-type: inline-size; position: relative; height: 40px; overflow: hidden; margin-bottom: 6px; }
.hud-red-one {
  position: absolute;
  bottom: 2px;
  left: 0;
  width: 96px;
  height: 36px;
  image-rendering: pixelated;
  animation: hud-drive 2.6s linear 0.3s both;
}
@keyframes hud-drive { from { transform: translateX(-110px); } to { transform: translateX(calc(100cqw + 10px)); } }
.hud-sheet .hud-speech {
  padding: 10px 12px;
  background: ${T.field};
  border: 2px solid ${T.panelEdge};
  border-radius: ${T.radius}px;
  font-size: 16px;
  color: ${T.text};
}
.hud-bag[hidden] { display: none; }
.hud-clue {
  box-sizing: border-box;
  background: ${T.field};
  border: 2px solid ${T.panelEdge};
  border-radius: ${T.radius}px;
  color: ${T.text};
}
.hud-clue small { line-height: 1.35; }
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
.hud-notes {
  font-family: 'American Typewriter', 'Courier New', ui-monospace, monospace;
  font-size: 14px;
  line-height: 1.35;
}
.hud-notes p { margin: 0 0 10px; }
.hud-notes-lines { margin: 0 0 12px; padding-left: 18px; }
.hud-notes-lines li {
  margin-bottom: 8px;
  animation: hud-typed 360ms ease-out both;
  animation-delay: calc(var(--i) * 260ms + 120ms);
}
@keyframes hud-typed { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: none; } }
@media (prefers-reduced-motion: reduce) {
  .hud-notes-lines li { animation: none; }
}
.hud-notes-signed { color: ${T.accent}; }
.hud-notes-ps { font-size: 13px; color: ${T.muted}; }
.hud-map {
  position: relative;
  width: 100%;
  aspect-ratio: 4 / 3;
  max-height: 52vh;
  margin: 0 auto 12px;
  background: ${T.stage};
  border: 2px solid ${T.panelEdge};
  border-radius: ${T.radius}px;
  overflow: hidden;
}
.hud-map-paths {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}
.hud-map-paths line {
  stroke: ${T.accent};
  stroke-width: 3px;
  stroke-dasharray: 6 5;
  vector-effect: non-scaling-stroke;
  stroke-linecap: round;
}
.hud-map-paths line.hud-map-unknown { stroke: ${T.muted}; opacity: 0.5; }
.hud-map-paths line.hud-map-out { stroke-width: 5px; }
.hud-map-ways-title { margin: 12px 0 4px; font-size: 15px; }
.hud-map-ways { margin: 0; padding: 0; list-style: none; display: grid; gap: 4px; }
.hud-map-ways li {
  padding: 6px 10px;
  border: 1px solid ${T.panelEdge};
  border-radius: 8px;
  background: ${T.stage};
}
.hud .hud-map-place {
  position: absolute;
  /* Not transform, which a button's :active nudge replaces, jumping it from under her finger. */
  translate: -50% -50%;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  min-width: 64px;
  padding: 4px 8px;
  border: none;
  background: none;
  font-size: 13px;
}
.hud-map-mark { font-size: 28px; line-height: 1; }
.hud-map-name {
  padding: 1px 6px;
  border-radius: 8px;
  background: ${T.panel};
  white-space: nowrap;
}
.hud-map-here .hud-map-name { color: ${T.accent}; }
.hud-map-unfound { opacity: 0.75; }
.hud-map-pin { font-size: 11px; color: ${T.accent}; }
.hud-fade {
  position: absolute;
  inset: 0;
  background: ${T.field};
  opacity: 0;
  pointer-events: none;
}
.hud-fade.fading { animation: hud-fade-in 320ms ease-out forwards; }
.hud-flash {
  position: absolute;
  inset: 0;
  background: ${T.flash};
  opacity: 0;
  pointer-events: none;
  animation: hud-fade-in 420ms ease-out;
}
.hud-polaroid {
  margin: 8px auto 4px;
  width: fit-content;
  padding: 10px 10px 6px;
  background: ${T.polaroid};
  border-radius: 4px;
  box-shadow: 0 4px 12px ${T.shadow};
  transform: rotate(-2deg);
}
.hud-photo-picture { display: block; image-rendering: pixelated; }
.hud-polaroid figcaption {
  margin-top: 8px;
  text-align: center;
  font-size: 15px;
  color: ${T.polaroidInk};
}
@keyframes hud-fade-in { from { opacity: 1; } to { opacity: 0; } }
@media (prefers-reduced-motion: reduce) {
  .hud-fade.fading, .hud-flash { animation-duration: 1ms; }
}
.hud-title, .hud-dedication {
  position: absolute;
  inset: 0;
  pointer-events: auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 14px;
  padding: calc(env(safe-area-inset-top) + 24px) 20px calc(env(safe-area-inset-bottom) + 24px);
  box-sizing: border-box;
  text-align: center;
  background: radial-gradient(circle at 50% 38%, ${T.button} 0%, ${T.panel} 55%, ${T.field} 100%);
}
.hud-title h1 {
  margin: 0;
  font-size: 40px;
  letter-spacing: 1px;
  color: ${T.accent};
  text-shadow: 0 3px 0 ${T.field};
}
.hud-title-line { margin: -8px 0 0; color: ${T.muted}; font-size: 16px; }
.hud-title-art {
  image-rendering: pixelated;
  border: 2px solid ${T.panelEdge};
  border-radius: ${T.radius}px;
  max-width: 100%;
}
.hud-title-dedication {
  margin: 0;
  max-width: 30ch;
  font-size: 16px;
  font-style: italic;
  color: ${T.text};
}
.hud-title-festival { margin: 0; font-size: 17px; font-weight: 600; color: ${T.accent}; }
.hud-title-festival small { display: block; font-size: 15px; font-weight: 400; color: ${T.text}; }
.hud-title-begin { min-width: 200px; font-size: 18px; }
.hud-dedication { gap: 20px; }
.hud-dedication-line {
  margin: 0;
  max-width: 18ch;
  font-size: 28px;
  line-height: 1.35;
  color: ${T.text};
  text-wrap: balance;
}
.hud-dedication-signed { margin: 0; font-size: 20px; color: ${T.accent}; }
.hud-dedication-reply { min-width: 96px; font-size: 26px; }

/*
 * A phone turned on its side (0.2.2): one thin strip along the bottom, what was along the top
 * (her Candy, the day, Settings) at its left and the quick bar, bag and ☰ at its right, so the
 * world keeps the whole width and nearly all the height. The bars down either side of 0.2.1 hid
 * too much of it.
 */
@media (orientation: landscape) and (max-height: 560px) {
  .hud {
    grid-template-rows: minmax(0, 1fr) auto;
    grid-template-columns: auto minmax(0, 1fr);
  }
  .hud-view { grid-row: 1; grid-column: 1 / -1; }
  .hud-top {
    grid-row: 2;
    grid-column: 1;
    padding-top: 6px;
    padding-bottom: calc(env(safe-area-inset-bottom) + 6px);
    padding-right: 4px;
    border-bottom: none;
    border-top: 2px solid ${T.panelEdge};
  }
  .hud-top .hud-trim { display: none; }
  .hud-bottom { grid-row: 2; grid-column: 2; padding-left: 4px; }
  /*
   * A sheet on its side is two columns, the whole height: its head and foot (the title, the search
   * and filters, a thing's card, Done) down the left, the head scrolling if they're crowded, and
   * its body on the right. Stacked, the head and a card left the body no room at all.
   */
  .hud-sheet {
    max-width: 860px;
    height: calc(100% - 8px);
    max-height: none;
    margin: 0 auto;
    display: grid;
    grid-template-columns: minmax(0, 5fr) minmax(0, 6fr);
    grid-template-rows: minmax(0, 1fr) auto;
  }
  .hud-sheet-head { grid-column: 1; grid-row: 1; min-height: 0; overflow-y: auto; }
  .hud-sheet-body {
    grid-column: 2;
    grid-row: 1 / span 2;
    padding-top: 18px;
    padding-left: 10px;
    padding-bottom: calc(env(safe-area-inset-bottom) + 10px);
    border-left: 2px solid ${T.field};
  }
  .hud-sheet-foot { grid-column: 1; grid-row: 2; border-top: 2px solid ${T.field}; }
  .hud-sheet h2 { margin-bottom: 8px; }
  .hud-title {
    display: grid;
    grid-template-columns: auto minmax(0, 360px);
    justify-content: center;
    align-content: center;
    justify-items: center;
    column-gap: 36px;
    row-gap: 10px;
    padding-top: calc(env(safe-area-inset-top) + 12px);
    padding-bottom: calc(env(safe-area-inset-bottom) + 12px);
  }
  .hud-title > * { grid-column: 2; }
  .hud-title > .hud-title-art { grid-column: 1; grid-row: 1 / span 6; align-self: center; }
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
