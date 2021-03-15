import Konva from 'konva';
import cuid from 'cuid';
import {
  DRAWING_LAYER_LOADED,
  DRAWING_LAYER_ERROR,
  ADD_LINE,
  REMOVE_LINE,
  REORDER_LINE,
  REPLACE_LINE,
  REMOVE_ALL_LINES,
  REPLACE_ALL_LINES,
} from '@/stores/DrawingLayerStore';
import { SET_ACTIVE_TOOL } from '@/stores/ToolbarStore';
import throttle from '@/lib/utils/throttle';

export default class DrawingLayer {
  constructor(stage, toolbarStore, layerStore) {
    this._stage = stage;
    this._layer = new Konva.Layer({ listening: false });
    this._stage.add(this._layer);

    this._onLoaded = this._onLoaded.bind(this);
    this._onError = this._onError.bind(this);
    this._onAddLine = this._onAddLine.bind(this);
    this._onRemoveLine = this._onRemoveLine.bind(this);
    this._onReorderLine = this._onReorderLine.bind(this);
    this._onReplaceLine = this._onReplaceLine.bind(this);
    this._onRemoveAllLines = this._onRemoveAllLines.bind(this);
    this._onReplaceAllLines = this._onReplaceAllLines.bind(this);
    this._onSetActiveTool = this._onSetActiveTool.bind(this);
    this._onPointerDown = this._onPointerDown.bind(this);
    this._onPointerMove = throttle(this._onPointerMove.bind(this), 20);
    this._onPointerUp = this._onPointerUp.bind(this);

    this._ready = false;
    this._currentLine = null;
    this._mode = null;

    this._toolbarStore = toolbarStore;
    this._toolbarStore.on(SET_ACTIVE_TOOL, this._onSetActiveTool);

    this._layerStore = layerStore;
    this._layerStore.on(DRAWING_LAYER_LOADED, this._onLoaded);
    this._layerStore.on(DRAWING_LAYER_ERROR, this._onError);
    this._layerStore.on(ADD_LINE, this._onAddLine);
    this._layerStore.on(REMOVE_LINE, this._onRemoveLine);
    this._layerStore.on(REORDER_LINE, this._onReorderLine);
    this._layerStore.on(REPLACE_LINE, this._onReplaceLine);
    this._layerStore.on(REMOVE_ALL_LINES, this._onRemoveAllLines);
    this._layerStore.on(REPLACE_ALL_LINES, this._onReplaceAllLines);
  }

  _onLoaded(lines) {
    lines.forEach((attrs) => {
      const line = this._createLine(attrs);
      this._layer.add(line);
    });

    this._layer.batchDraw();
    this._ready = true;
    this._onSetActiveTool(this._toolbarStore.getActiveTool());
  }

  _onError() {
    this._onSetActiveTool(null);
    this._layer.destroyChildren();
    this._layer.batchDraw();
    this._currentLine = null;
    this._ready = false;
  }

  _onSetActiveTool(tool) {
    if (!this._ready) {
      return;
    }

    const canDraw = tool === 'brush' || tool === 'eraser';

    if (canDraw) {
      if (!this._mode) {
        this._stage.on('mousedown touchstart', this._onPointerDown);
        this._stage.on('mousemove touchmove', this._onPointerMove);
        this._stage.on(
          'mouseup mouseout touchend touchcancel',
          this._onPointerUp
        );
      }

      this._mode = tool;
    } else {
      this._mode = null;

      this._stage.off('mousedown touchstart', this._onPointerDown);
      this._stage.off('mousemove touchmove', this._onPointerMove);
      this._stage.off(
        'mouseup mouseout touchend touchcancel',
        this._onPointerUp
      );

      if (this._currentLine) {
        this._currentLine.destroy();
        this._currentLine = null;
        this._layer.batchDraw();
      }
    }
  }

  _onPointerDown(e) {
    e.evt.preventDefault();
    const pos = this._getPointerPosition();

    this._currentLine = this._createLine({
      id: cuid(),
      stroke: this._toolbarStore.getBrushColor(),
      strokeWidth:
        this._mode === 'brush'
          ? this._toolbarStore.getBrushSize()
          : this._toolbarStore.getEraserSize(),
      bezier: true,
      globalCompositeOperation:
        this._mode === 'brush' ? 'source-over' : 'destination-out',
      points: [pos.x, pos.y],
    });

    this._layer.add(this._currentLine);
  }

  _onPointerMove(e) {
    if (!this._currentLine) {
      return;
    }

    e.evt.preventDefault();

    const pos = this._getPointerPosition();
    this._currentLine.points([...this._currentLine.points(), pos.x, pos.y]);
    this._layer.batchDraw();
  }

  _onPointerUp(e) {
    if (!this._currentLine) {
      return;
    }

    e.evt.preventDefault();

    if (this._currentLine.points().length === 2) {
      // if the mouse never moved, make sure there are at least two sets
      // of x,y coordinates to allow the "line" to display as a dot
      const pos = this._getPointerPosition();

      this._currentLine.points([
        ...this._currentLine.points(),
        pos.x + 0.0000001,
        pos.y + 0.0000001,
      ]);

      this._currentLine.bezier(false);

      this._layer.batchDraw();
    }

    this._layerStore.addLine(
      this._currentLine.zIndex(),
      this._serializeLine(this._currentLine)
    );

    this._currentLine = null;
  }

  _onAddLine(index, attrs, isLocal) {
    if (isLocal) {
      return;
    }

    const line = this._createLine(attrs);
    this._layer.add(line);
    line.zIndex(index);

    this._layer.batchDraw();
  }

  _onRemoveLine(index) {
    const line = this._layer.children[index];

    if (line) {
      line.destroy();
    }

    this._layer.batchDraw();
  }

  _onReorderLine(oldIndex, newIndex) {
    const line = this._layer.children[oldIndex];

    if (line) {
      line.zIndex(newIndex);
    }

    this._layer.batchDraw();
  }

  _onReplaceLine(index, newLine) {
    let line = this._layer.children[index];

    if (line) {
      line.destroy();
    }

    line = this._createLine(newLine);
    this._layer.addLine(line);
    line.zIndex(index);

    this._layer.batchDraw();
  }

  _onRemoveAllLines() {
    this._layer.destroyChildren();
    this._layer.batchDraw();
  }

  _onReplaceAllLines(lines) {
    this._layer.destroyChildren();

    lines.forEach((attrs) => {
      const line = this._createLine(attrs);
      this._layer.add(line);
    });

    this._layer.batchDraw();
  }

  _getPointerPosition() {
    const pos = this._stage.getPointerPosition();
    const scale = this._stage.scaleX();

    return {
      x: (pos.x - this._stage.x()) / scale,
      y: (pos.y - this._stage.y()) / scale,
    };
  }

  _createLine(attrs) {
    return new Konva.Line({
      lineCap: 'round',
      lineJoin: 'round',
      shadowForStrokeEnabled: false,
      listening: false,
      ...attrs,
    });
  }

  _serializeLine(line) {
    const { attrs } = line;

    return {
      id: attrs.id,
      stroke: attrs.stroke,
      strokeWidth: attrs.strokeWidth,
      bezier: attrs.bezier,
      globalCompositeOperation: attrs.globalCompositeOperation,
      points: attrs.points,
    };
  }
}
