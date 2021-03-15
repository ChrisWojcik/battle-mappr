import EventEmitter from './EventEmitter';
import clamp from '@/lib/utils/clamp';

export const SET_ACTIVE_TOOL = 'toolbar/SET_ACTIVE_TOOL';
export const SET_SCALE = 'toolbar/SET_SCALE';
export const SET_BRUSH_SIZE = 'toolbar/SET_BRUSH_SIZE';
export const SET_BRUSH_COLOR = 'toolbar/SET_BRUSH_COLOR';
export const SET_ERASER_SIZE = 'toolbar/SET_ERASER_SIZE';

const MIN_SCALE = 0.1;
const MAX_SCALE = 10;

const MIN_BRUSH_SIZE = 1;
const MAX_BRUSH_SIZE = 30;

const MIN_ERASER_SIZE = 1;
const MAX_ERASER_SIZE = 200;

const BRUSH_SIZE_STORAGE_KEY = '__battle-mappr__brush-size';
const ERASER_SIZE_STORAGE_KEY = '__battle-mappr__eraser-size';
const IDLE_TIMEOUT = 250;

class ToolbarStore extends EventEmitter {
  constructor() {
    super();

    this._activeTool = 'brush';
    this._scale = 1;
    this._brushSize = 5;
    this._brushColor = '#000000';
    this._eraserSize = 20;

    const storedBrushSize = localStorage.getItem(BRUSH_SIZE_STORAGE_KEY);

    if (storedBrushSize) {
      this.setBrushSize(storedBrushSize);
    }

    const storedEraserSize = localStorage.getItem(ERASER_SIZE_STORAGE_KEY);

    if (storedEraserSize) {
      this.setEraserSize(storedEraserSize);
    }

    this._brushSizeIdleTimer;
    this._eraserSizeIdleTimer;
  }

  getActiveTool() {
    return this._activeTool;
  }

  getScale() {
    return this._scale;
  }

  getBrushSize() {
    return this._brushSize;
  }

  getEraserSize() {
    return this._eraserSize;
  }

  getBrushColor() {
    return this._brushColor;
  }

  setActiveTool(tool) {
    this._activeTool = tool;
    this.emit(SET_ACTIVE_TOOL, tool);
  }

  setScale(scale) {
    const oldScale = this._scale;
    const newScale = clamp(scale, MIN_SCALE, MAX_SCALE);

    this._scale = newScale;
    this.emit(SET_SCALE, newScale, oldScale);
  }

  setBrushSize(size) {
    let newSize = parseInt(size, 10);

    if (isNaN(newSize)) {
      return;
    }

    clearTimeout(this._brushSizeIdleTimer);

    this._brushSize = clamp(newSize, MIN_BRUSH_SIZE, MAX_BRUSH_SIZE);
    this.emit(SET_BRUSH_SIZE, this._brushSize);

    this._brushSizeIdleTimer = setTimeout(() => {
      localStorage.setItem(BRUSH_SIZE_STORAGE_KEY, this._brushSize);
    }, IDLE_TIMEOUT);
  }

  setBrushColor(color) {
    if (!/^#[0-9A-Fa-f]{6}/.test(color)) {
      return;
    }

    this._brushColor = color;
    this.emit(SET_BRUSH_COLOR, color);
  }

  setEraserSize(size) {
    let newSize = parseInt(size, 10);

    if (isNaN(newSize)) {
      return;
    }

    clearTimeout(this._eraserSizeIdleTimer);

    this._eraserSize = clamp(newSize, MIN_ERASER_SIZE, MAX_ERASER_SIZE);
    this.emit(SET_ERASER_SIZE, this._eraserSize);

    this._eraserSizeIdleTimer = setTimeout(() => {
      localStorage.setItem(ERASER_SIZE_STORAGE_KEY, this._eraserSize);
    }, IDLE_TIMEOUT);
  }
}

export default ToolbarStore;