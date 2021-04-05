import { SET_ZOOM } from '@/stores/ToolbarStore';
import { RESIZE, DRAG_MOVE } from '@/components/BattleMap';

const GRID_SIZE = 40;

export default class GridLayer {
  constructor(canvas, battleMap, toolbarStore) {
    this._$el = canvas;
    this._battleMap = battleMap;
    this._toolbarStore = toolbarStore;

    this._ctx = canvas.getContext('2d');
    this._ctx.imageSmoothingEnabled = false;

    this._resolution = window.devicePixelRatio || 1;

    this._isDrawing = false;
    this._raf = null;

    this._requestDraw = this._requestDraw.bind(this);
    this._draw = this._draw.bind(this);
    this._onResize = this._onResize.bind(this);
    this._onZoom = this._onZoom.bind(this);

    this._battleMap.on(RESIZE, this._onResize);
    this._battleMap.on(DRAG_MOVE, this._requestDraw);
    this._toolbarStore.on(SET_ZOOM, this._onZoom);

    this._onResize();
  }

  _onResize() {
    const width = this._battleMap.width;
    const height = this._battleMap.height;

    this._ctx.canvas.width = width * this._resolution;
    this._ctx.canvas.height = height * this._resolution;

    this._$el.style.width = width + 'px';
    this._$el.style.height = height + 'px';

    this._requestDraw(true);
  }

  _onZoom() {
    this._requestDraw(true);
  }

  _requestDraw(force) {
    if (force) {
      cancelAnimationFrame(this._raf);
      this._isDrawing = true;
      this._draw();
      this._isDrawing = false;
    } else {
      if (!this._isDrawing) {
        this._isDrawing = true;
        this._raf = requestAnimationFrame(() => {
          this._draw();
          this._isDrawing = false;
        });
      }
    }
  }

  _draw() {
    this._ctx.canvas.width = this._ctx.canvas.width;

    const scale = this._toolbarStore.getZoom();
    const centerX = -this._battleMap.x / scale;
    const centerY = -this._battleMap.y / scale;
    const scaledWidth = this._ctx.canvas.width / scale;
    const scaledHeight = this._ctx.canvas.height / scale;

    // starting from the new offset center find the x/y coordinates of the first
    // set of grid lines that need to be drawn beyond the top/left edge of the canvas
    let START_X = -1 * (Math.ceil(centerX / GRID_SIZE) * GRID_SIZE - centerX);
    let START_Y = -1 * (Math.ceil(centerY / GRID_SIZE) * GRID_SIZE - centerY);

    this._ctx.scale(scale * this._resolution, scale * this._resolution);

    this._ctx.beginPath();
    this._ctx.lineWidth = 2;
    this._ctx.strokeStyle = '#c7c7c7';

    for (let x = START_X; x <= scaledWidth; x += GRID_SIZE) {
      // omit every 5th line out from the center of the grid
      if (Math.round(x - centerX) % (GRID_SIZE * 5) !== 0) {
        this._ctx.moveTo(x, 0);
        this._ctx.lineTo(x, scaledHeight);
      }
    }

    for (let y = START_Y; y <= scaledHeight; y += GRID_SIZE) {
      // omit every 5th line out from the center of the grid
      if (Math.round(y - centerY) % (GRID_SIZE * 5) !== 0) {
        this._ctx.moveTo(0, y);
        this._ctx.lineTo(scaledWidth, y);
      }
    }

    this._ctx.stroke();

    this._ctx.beginPath();
    this._ctx.lineWidth = 4;
    this._ctx.strokeStyle = '#aaaaaa';

    for (let x = START_X; x <= scaledWidth; x += GRID_SIZE) {
      // only draw every 5th line out from the center of the grid
      if (Math.round(x - centerX) % (GRID_SIZE * 5) === 0) {
        this._ctx.moveTo(x, 0);
        this._ctx.lineTo(x, scaledHeight);
      }
    }

    for (let y = START_Y; y <= scaledHeight; y += GRID_SIZE) {
      // only draw every 5th line out from the center of the grid
      if (Math.round(y - centerY) % (GRID_SIZE * 5) === 0) {
        this._ctx.moveTo(0, y);
        this._ctx.lineTo(scaledWidth, y);
      }
    }

    this._ctx.stroke();
  }
}
