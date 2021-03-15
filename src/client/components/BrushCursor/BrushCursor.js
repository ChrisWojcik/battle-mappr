import SUPPORTS from '@/lib/featureDetection';
import {
  SET_ACTIVE_TOOL,
  SET_SCALE,
  SET_BRUSH_SIZE,
  SET_ERASER_SIZE,
} from '@/stores/ToolbarStore';

import './BrushCursor.scss';

export default class BrushCursor {
  constructor(toolbarStore) {
    // disable on touch devices
    if ('ontouchstart' in window) {
      return;
    }

    this._$el = document.querySelector('#brush-cursor');
    this._$cursor = this._$el.firstElementChild;
    this._toolbarStore = toolbarStore;

    this._onMouseMove = this._onMouseMove.bind(this);
    this._onSetActiveTool = this._onSetActiveTool.bind(this);
    this._onSetScale = this._onSetScale.bind(this);
    this._onSetBrushSize = this._onSetBrushSize.bind(this);
    this._onSetEraserSize = this._onSetEraserSize.bind(this);

    this._toolbarStore.on(SET_ACTIVE_TOOL, this._onSetActiveTool);
    this._toolbarStore.on(SET_SCALE, this._onSetScale);
    this._toolbarStore.on(SET_BRUSH_SIZE, this._onSetBrushSize);
    this._toolbarStore.on(SET_ERASER_SIZE, this._onSetEraserSize);

    this._watchPointerPosition();
    this._onSetActiveTool(this._toolbarStore.getActiveTool());
  }

  _watchPointerPosition() {
    document.addEventListener(
      'mousemove',
      this._onMouseMove,
      SUPPORTS.passiveEventListeners ? { passive: true } : false
    );
  }

  _onMouseMove(e) {
    this._$el.style.transform = `translate(${e.clientX}px, ${e.clientY}px)`;
  }

  _onSetActiveTool(tool) {
    if (tool === 'brush' || tool === 'eraser') {
      this._$el.style.display = '';
      this._onSetBrushSize(this._toolbarStore.getBrushSize());
      this._onSetEraserSize(this._toolbarStore.getEraserSize());
    } else {
      this._$el.style.display = 'none';
    }
  }

  _onSetScale(scale) {
    this._$cursor.style.transform = `translate(-50%, -50%) scale(${scale})`;
  }

  _onSetBrushSize(size) {
    if (this._toolbarStore.getActiveTool() === 'brush') {
      this._$cursor.style.height = size + 'px';
      this._$cursor.style.width = size + 'px';
    }
  }

  _onSetEraserSize(size) {
    if (this._toolbarStore.getActiveTool() === 'eraser') {
      this._$cursor.style.height = size + 'px';
      this._$cursor.style.width = size + 'px';
    }
  }
}
