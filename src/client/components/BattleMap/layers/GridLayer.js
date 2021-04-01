const GRID_SIZE = 40;

export default class GridLayer {
  constructor(el, stage, toolbarStore) {
    this._$el = el;
    this._stage = stage;
    this._toolbarStore = toolbarStore;

    this._devicePixelRatio = window.devicePixelRatio || 1;

    this._canvas = document.createElement('canvas');
    this._ctx = this._canvas.getContext('2d');
    this._ctx.imageSmoothingEnabled = false;
    this._$el.insertBefore(this._canvas, this._$el.firstChild);

    this._gridCenter = {
      x: this._$el.offsetWidth / 2,
      y: this._$el.offsetHeight / 2,
    };

    this._width = 0;
    this._height = 0;

    this._isDrawing = false;
    this._raf = null;

    this.draw = this.draw.bind(this);
    this.resize = this.resize.bind(this);
    this._drawGrid = this._drawGrid.bind(this);

    this.resize();
  }

  resize() {
    const width = this._$el.offsetWidth;
    const height = this._$el.offsetHeight;

    this._width = width * this._devicePixelRatio;
    this._height = height * this._devicePixelRatio;

    this._canvas.width = this._width;
    this._canvas.height = this._height;

    this._canvas.style.width = width + 'px';
    this._canvas.style.height = height + 'px';

    this.draw(true);
  }

  draw(force) {
    if (force) {
      cancelAnimationFrame(this._raf);
      this._drawing = true;
      this._drawGrid();
    } else {
      if (!this._isDrawing) {
        this._isDrawing = true;
        this._raf = requestAnimationFrame(this._drawGrid);
      }
    }
  }

  _drawGrid() {
    this._ctx.clearRect(0, 0, this._width, this._height);
    this._ctx.canvas.width = this._ctx.canvas.width;

    const scale = this._toolbarStore.getZoom();
    const absoluteX = this._stage.getAbsolutePosition().x / scale;
    const absoluteY = this._stage.getAbsolutePosition().y / scale;
    const scaledWidth = this._width / scale;
    const scaledHeight = this._height / scale;

    // offsets relative to the original center point
    let centerX = this._gridCenter.x + absoluteX;
    let centerY = this._gridCenter.y + absoluteY;

    // starting from the new offset center find the x/y coordinates of the first
    // set of grid lines that need to be drawn beyond the top/left edge of the canvas
    let START_X = -1 * (Math.ceil(centerX / GRID_SIZE) * GRID_SIZE - centerX);
    let START_Y = -1 * (Math.ceil(centerY / GRID_SIZE) * GRID_SIZE - centerY);

    this._ctx.scale(
      scale * this._devicePixelRatio,
      scale * this._devicePixelRatio
    );

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

    this._isDrawing = false;
  }
}
