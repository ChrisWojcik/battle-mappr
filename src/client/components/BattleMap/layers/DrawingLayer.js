import cuid from 'cuid';
import simplify from 'simplify-flat-array';
import { LOADED, ERROR, LINES } from '@/stores/DrawingLayerStore';
import { SET_ACTIVE_TOOL, SET_ZOOM } from '@/stores/ToolbarStore';
import {
  RESIZE,
  DRAG_MOVE,
  POINTER_DOWN,
  POINTER_MOVE,
  POINTER_UP,
  POINTER_CANCEL,
} from '@/components/BattleMap';

export default class DrawingLayer {
  constructor(canvas, battleMap, toolbarStore, layerStore, undoManager) {
    this._$el = canvas;
    this._battleMap = battleMap;
    this._toolbarStore = toolbarStore;
    this._layerStore = layerStore;
    this._undoManager = undoManager;

    this._ctx = canvas.getContext('2d');
    this._ctx.imageSmoothingEnabled = false;

    // constrain resolution of this layer for performance reasons
    this._resolution = Math.min(window.devicePixelRatio || 1, 2);

    this._isDrawing = false;
    this._raf = null;

    this._ready = false;
    this._currentLine = null;
    this._mode = null;

    this._onLoaded = this._onLoaded.bind(this);
    this._onError = this._onError.bind(this);
    this._requestDraw = this._requestDraw.bind(this);
    this._draw = this._draw.bind(this);
    this._onResize = this._onResize.bind(this);
    this._onZoom = this._onZoom.bind(this);
    this._onSetActiveTool = this._onSetActiveTool.bind(this);
    this._onPointerDown = this._onPointerDown.bind(this);
    this._onPointerMove = this._onPointerMove.bind(this);
    this._onPointerUp = this._onPointerUp.bind(this);
    this._onPointerCancel = this._onPointerCancel.bind(this);

    this._toolbarStore.on(SET_ACTIVE_TOOL, this._onSetActiveTool);
    this._toolbarStore.on(SET_ZOOM, this._onZoom);

    this._layerStore.on(LOADED, this._onLoaded);
    this._layerStore.on(ERROR, this._onError);
    this._layerStore.on(LINES, this._requestDraw);

    this._battleMap.on(RESIZE, this._onResize);
    this._battleMap.on(DRAG_MOVE, this._requestDraw);

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

    const lines = this._layerStore.getAllLines();
    const scale = this._toolbarStore.getZoom();

    this._ctx.scale(scale * this._resolution, scale * this._resolution);

    for (let i = 0; i < lines.length; i++) {
      this._drawLine(lines[i]);
    }

    if (this._currentLine) {
      this._drawLine(this._currentLine);
    }
  }

  _drawLine(line) {
    const scale = this._toolbarStore.getZoom();

    this._ctx.beginPath();
    this._ctx.strokeStyle = line.strokeStyle;
    this._ctx.lineWidth = line.lineWidth;
    this._ctx.lineCap = 'round';
    this._ctx.lineJoin = 'round';
    this._ctx.globalCompositeOperation = line.globalCompositeOperation;

    for (let i = 0; i < line.points.length; i += 2) {
      if (i === 0) {
        this._ctx.moveTo(
          line.points[i] - this._battleMap.x / scale,
          line.points[i + 1] - this._battleMap.y / scale
        );
      } else {
        this._ctx.lineTo(
          line.points[i] - this._battleMap.x / scale,
          line.points[i + 1] - this._battleMap.y / scale
        );
      }
    }

    this._ctx.stroke();
  }

  _onSetActiveTool(tool) {
    if (!this._ready) {
      return;
    }

    const canDraw = tool === 'brush' || tool === 'eraser';

    if (canDraw) {
      if (!this._mode) {
        this._battleMap.on(POINTER_DOWN, this._onPointerDown);
        this._battleMap.on(POINTER_MOVE, this._onPointerMove);
        this._battleMap.on(POINTER_UP, this._onPointerUp);
        this._battleMap.on(POINTER_CANCEL, this._onPointerCancel);
      }

      this._mode = tool;
    } else {
      this._mode = null;

      this._battleMap.off(POINTER_DOWN, this._onPointerDown);
      this._battleMap.off(POINTER_MOVE, this._onPointerMove);
      this._battleMap.off(POINTER_UP, this._onPointerUp);
      this._battleMap.off(POINTER_CANCEL, this._onPointerCancel);

      if (this._currentLine) {
        this._currentLine = null;
        this._requestDraw();
      }
    }
  }

  _onLoaded() {
    this._ready = true;
    this._onSetActiveTool(this._toolbarStore.getActiveTool());
  }

  _onError() {
    this._onSetActiveTool(null);
    this._currentLine = null;
    this._ready = false;
    this._requestDraw();
  }

  _onPointerDown(e) {
    this._currentLine = {
      id: cuid(),
      strokeStyle: this._toolbarStore.getBrushColor(),
      lineWidth:
        this._mode === 'brush'
          ? this._toolbarStore.getBrushSize()
          : this._toolbarStore.getEraserSize(),
      globalCompositeOperation:
        this._mode === 'brush' ? 'source-over' : 'destination-out',
      points: [e.x, e.y],
    };
  }

  _onPointerMove(e) {
    if (!this._currentLine) {
      return;
    }

    this._drawLine({
      ...this._currentLine,
      points: [
        this._currentLine.points[this._currentLine.points.length - 2],
        this._currentLine.points[this._currentLine.points.length - 1],
        e.x,
        e.y,
      ],
    });

    this._currentLine.points.push(e.x, e.y);
  }

  _onPointerUp(e) {
    if (!this._currentLine) {
      return;
    }

    // apply path simplification algorithms
    this._currentLine.points = simplify(this._currentLine.points, 0.5, false);

    if (this._currentLine.points.length === 2) {
      // if the mouse never moved, make sure there are at least two sets
      // of x,y coordinates to allow the "line" to display as a dot
      this._currentLine.points.push(e.x + 0.0000001, e.y + 0.0000001);
    }

    this._layerStore.addLine(this._currentLine);

    this._currentLine = null;
    this._requestDraw();
  }

  _onPointerCancel() {
    this._currentLine = null;
  }
}
