const GRID_SIZE = 40;

export default class GridLayer {
  constructor(el, stage) {
    this._$el = el;
    this._stage = stage;

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

    this.draw = this.draw.bind(this);
    this.resize = this.resize.bind(this);
    this._drawGrid = this._drawGrid.bind(this);

    this.resize();
  }

  resize() {
    const width = this._$el.offsetWidth;
    const height = this._$el.offsetHeight;

    this._canvas.width = width;
    this._canvas.height = height;

    this._width = width;
    this._height = height;

    this.draw();
  }

  draw() {
    if (!this._isDrawing) {
      this._isDrawing = true;
      requestAnimationFrame(this._drawGrid);
    }
  }

  _drawGrid() {
    this._ctx.clearRect(0, 0, this._width, this._height);
    this._ctx.canvas.width = this._ctx.canvas.width;

    const scale = this._stage.scaleX();
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

    this._ctx.scale(scale, scale);

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
