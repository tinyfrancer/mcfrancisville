import { PALETTE } from './render/palette';
import { fitPixelScale, TILE_SIZE } from './render/pixelScale';
import { registerServiceWorker } from './pwa';

const root = document.getElementById('app') as HTMLElement;
const canvas = document.getElementById('game') as HTMLCanvasElement;
const ctx = canvas.getContext('2d') as CanvasRenderingContext2D;

function draw(): void {
  for (let y = 0; y < canvas.height; y += TILE_SIZE) {
    for (let x = 0; x < canvas.width; x += TILE_SIZE) {
      const even = (x / TILE_SIZE + y / TILE_SIZE) % 2 === 0;
      ctx.fillStyle = even ? PALETTE.moss : PALETTE.mossLight;
      ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
    }
  }
}

function resize(): void {
  const fit = fitPixelScale(root.clientWidth, root.clientHeight, window.devicePixelRatio);
  canvas.width = fit.width;
  canvas.height = fit.height;
  canvas.style.width = `${fit.cssWidth}px`;
  canvas.style.height = `${fit.cssHeight}px`;
  // Resizing a canvas resets its context state, smoothing included.
  ctx.imageSmoothingEnabled = false;
  draw();
}

// On the root rather than the window: iOS's toolbar showing and hiding changes the dvh box without
// a window resize.
new ResizeObserver(resize).observe(root);
resize();

if (import.meta.env.PROD) registerServiceWorker();
