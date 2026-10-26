import { PALETTE as C } from '../sprites/palette';
import { THEME as T } from '../ui/theme';

/**
 * The photo mode (1.5's G5): with the camera up the bars go but for one strip along the bottom
 * (sideways too, the whole width), the town held in the room above it under the viewfinder, the
 * stickers and caption laid on its polaroid, and a drawer over the strip for the filters, the
 * stickers or the caption.
 */
export const CAMERA_CSS = `
.hud[data-camera] .hud-top { display: none; }
.hud[data-camera] .hud-bottom > :not(.hud-camera-strip):not(.hud-camera-drawer) { display: none; }
.hud[data-camera] {
  grid-template-rows: minmax(0, 1fr) auto;
  grid-template-columns: minmax(0, 1fr);
}
.hud[data-camera] .hud-view { grid-row: 1; grid-column: 1; }
.hud[data-camera] .hud-bottom { grid-row: 2; grid-column: 1; }
.hud[data-camera] .hud-toast, .hud[data-camera] .hud-bed { display: none; }
.hud-camera-strip {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 8px;
}
.hud .hud-camera-done { padding: 0 12px; }
.hud .hud-camera-button[aria-pressed="true"] { border-color: ${T.accent}; }
.hud .hud-camera-button[data-full] { opacity: 0.7; }
.hud .hud-camera-shutter {
  width: 60px;
  height: 60px;
  margin: -8px 4px;
  padding: 0;
  border-radius: 50%;
  border: 4px solid ${T.polaroid};
  background: ${T.accentButton};
  box-shadow: 0 2px 0 ${T.shadow}, 0 0 0 2px ${T.panelEdge};
}
.hud-camera-drawer {
  position: absolute;
  left: calc(env(safe-area-inset-left) + 8px);
  right: calc(env(safe-area-inset-right) + 8px);
  bottom: calc(100% + 8px);
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 8px;
  padding: 8px;
  background: ${T.panel};
  border: 2px solid ${T.panelEdge};
  border-radius: ${T.radius * 1.5}px;
  pointer-events: auto;
}
.hud-camera-drawer[hidden] { display: none; }
.hud .hud-camera-filter { display: inline-flex; align-items: center; gap: 6px; padding: 0 10px; font-size: 15px; }
.hud .hud-camera-filter[aria-pressed="true"] { border-color: ${T.accent}; }
.hud-camera-swatch { width: 14px; height: 14px; border-radius: 3px; border: 1px solid ${T.panelEdge}; }
.hud-filter-plain .hud-camera-swatch { background: linear-gradient(135deg, ${C.rose}, ${C.leafLight}, ${C.sky}); }
.hud-filter-sepia .hud-camera-swatch { background: linear-gradient(135deg, ${C.cream}, ${C.wood}); }
.hud-filter-spooky .hud-camera-swatch { background: radial-gradient(${C.mint}, ${C.mossDark}); }
.hud-filter-moonlit .hud-camera-swatch { background: radial-gradient(${C.sky}, ${C.navyShade}); }
.hud-camera-shelf {
  display: flex;
  gap: 6px;
  max-width: 100%;
  overflow-x: auto;
  overscroll-behavior: contain;
}
.hud-camera-shelf p { margin: 6px; font-size: 14px; }
.hud .hud-camera-sticker-pick { flex: none; padding: 0; width: 48px; }
.hud .hud-camera-input {
  flex: 1;
  min-width: 0;
  min-height: ${T.touchMin}px;
  padding: 0 10px;
  border: 2px solid ${T.panelEdge};
  border-radius: ${T.radius}px;
  background: ${T.polaroid};
  color: ${T.polaroidInk};
  font: 16px ${T.font};
  pointer-events: auto;
  user-select: text;
  -webkit-user-select: text;
}
.hud-camera-layer {
  position: absolute;
  inset: 0;
  pointer-events: auto;
  touch-action: none;
}
.hud-camera-stickers { position: absolute; inset: 0; }
.hud .hud-camera-sticker {
  position: fixed;
  image-rendering: pixelated;
  pointer-events: auto;
  touch-action: none;
}
.hud-camera-held { filter: drop-shadow(0 3px 0 ${T.shadow}); }
.hud-camera-off { opacity: 0.4; }
.hud-camera-caption {
  position: fixed;
  margin: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  white-space: nowrap;
  color: ${T.polaroidInk};
  font-family: ui-rounded, 'SF Pro Rounded', system-ui, sans-serif;
  pointer-events: none;
}
.hud-camera-say {
  position: absolute;
  top: calc(env(safe-area-inset-top) + 6px);
  left: 50%;
  transform: translateX(-50%);
  max-width: calc(100% - 24px);
  width: max-content;
  margin: 0;
  padding: 3px 10px;
  border-radius: ${T.radius}px;
  background: ${T.shadow};
  text-align: center;
  font-size: 14px;
  pointer-events: none;
}
.hud .hud-camera-strip .hud-glyph { pointer-events: none; }
`;
