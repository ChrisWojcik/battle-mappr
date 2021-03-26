import Konva from 'konva';

const GRID_SIZE = 40;

export default class GridLayer {
  constructor(stage) {
    this._stage = stage;
    this._layer = new Konva.Layer({ listening: false, draggable: false });
    this._stage.add(this._layer);

    this.draw = this.draw.bind(this);
  }

  draw() {
    this._layer.destroyChildren();

    const r = this._getViewportRect();
    const ITERATIONS_X = Math.ceil((r.width * 1.5) / GRID_SIZE);
    const ITERATIONS_Y = Math.ceil((r.height * 1.5) / GRID_SIZE);
    const previousGridLineX = Math.floor(r.left / GRID_SIZE) * GRID_SIZE;
    const nextGridLineX = Math.ceil(r.right / GRID_SIZE) * GRID_SIZE;
    const previousGridLineY = Math.floor(r.top / GRID_SIZE) * GRID_SIZE;
    const nextGridLineY = Math.floor(r.bottom / GRID_SIZE) * GRID_SIZE;

    const largeLines = [];
    const smallLines = [];

    for (
      let x = previousGridLineX - GRID_SIZE * ITERATIONS_X;
      x <= nextGridLineX + GRID_SIZE * ITERATIONS_X;
      x += GRID_SIZE
    ) {
      const isLargeLine = x % (GRID_SIZE * 5) === 0;
      const group = isLargeLine ? largeLines : smallLines;

      const gridLine = new Konva.Line({
        stroke: isLargeLine ? '#aaaaaa' : '#c7c7c7',
        strokeWidth: isLargeLine ? 4 : 2,
        points: [
          x,
          previousGridLineY - GRID_SIZE * ITERATIONS_Y,
          x,
          nextGridLineY + GRID_SIZE * ITERATIONS_Y,
        ],
        shadowForStrokeEnabled: false,
        listening: false,
        bezier: false,
        hitStrokeWidth: 0,
        shadowEnabled: false,
        dashEnabled: false,
        draggable: false,
        perfectDrawEnabled: false,
      });

      group.push(gridLine);
    }

    for (
      let y = previousGridLineY - GRID_SIZE * ITERATIONS_Y;
      y <= nextGridLineY + GRID_SIZE * ITERATIONS_Y;
      y += GRID_SIZE
    ) {
      const isLargeLine = y % (GRID_SIZE * 5) === 0;
      const group = isLargeLine ? largeLines : smallLines;

      const gridLine = new Konva.Line({
        stroke: isLargeLine ? '#aaaaaa' : '#c7c7c7',
        strokeWidth: isLargeLine ? 4 : 2,
        points: [
          previousGridLineX - GRID_SIZE * ITERATIONS_X,
          y,
          nextGridLineX + GRID_SIZE * ITERATIONS_X,
          y,
        ],
        shadowForStrokeEnabled: false,
        listening: false,
        bezier: false,
        hitStrokeWidth: 0,
        shadowEnabled: false,
        dashEnabled: false,
        draggable: false,
        perfectDrawEnabled: false,
      });

      group.push(gridLine);
    }

    smallLines.forEach((line) => this._layer.add(line));
    largeLines.forEach((line) => this._layer.add(line));
    this._layer.batchDraw();
  }

  _getViewportRect() {
    const scale = this._stage.scaleX();
    const absolutePosition = this._stage.getAbsolutePosition();
    const width = this._stage.width() / scale;
    const height = this._stage.height() / scale;
    const top = (absolutePosition.y * -1) / scale;
    const left = (absolutePosition.x * -1) / scale;

    return {
      width,
      height,
      top,
      right: left + width,
      bottom: top + height,
      left,
    };
  }
}
