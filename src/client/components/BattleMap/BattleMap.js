import EventEmitter from '@/lib/EventEmitter';
import Toolbar from '@/components/Toolbar';
import SecondaryToolbar from '@/components/SecondaryToolbar';
import BrushCursor from '@/components/BrushCursor';
import GridLayer from './layers/GridLayer';
import DrawingLayer from './layers/DrawingLayer';
import ToolbarStore, { SET_ACTIVE_TOOL, SET_ZOOM } from '@/stores/ToolbarStore';
import UndoManager from '@/stores/UndoManager';
import DrawingLayerStore from '@/stores/DrawingLayerStore';
import throttle from '@/lib/utils/throttle';
import debounce from '@/lib/utils/debounce';
import getDistance from '@/lib/utils/getDistance';
import getCenter from '@/lib/utils/getCenter';

import './BattleMap.scss';

const CURSOR_FOR_TOOL = {
  brush: 'crosshair',
  eraser: 'crosshair',
  pan: 'all-scroll',
};

const ZOOM_FACTOR = 1.05;

export const RESIZE = 'battlemap/resize';
export const PINCH_START = 'battlemap/pinchstart';
export const PINCH_MOVE = 'battlemap/pinchmove';
export const PINCH_END = 'battlemap/pinchend';
export const PINCH_CANCEL = 'battlemap/pinchcancel';
export const DRAG_START = 'battlemap/dragstart';
export const DRAG_MOVE = 'battlemap/dragmove';
export const DRAG_END = 'battlemap/dragend';
export const DRAG_CANCEL = 'battlemap/dragcancel';
export const POINTER_DOWN = 'battlemap/pointerdown';
export const POINTER_MOVE = 'battlemap/pointermove';
export const POINTER_UP = 'battlemap/pointerup';
export const POINTER_CANCEL = 'battlemap/pointercancel';

export default class BattleMap extends EventEmitter {
  constructor(documentId) {
    super();

    this._$el = document.querySelector('#map');

    this._undoManager = new UndoManager();
    this._toolbarStore = new ToolbarStore(this);
    this._drawingLayerStore = new DrawingLayerStore(
      documentId,
      this._undoManager
    );

    this._width = this._$el.offsetWidth;
    this._height = this._$el.offsetHeight;

    this._currentGesture = null;
    this._lastGestureEvent = null;

    // top left corner of the screen, initial screen center
    // has map coordinates 0,0
    this._x = this._width / -2;
    this._y = this._height / -2;

    this._onResize = debounce(this._onResize.bind(this), 250);
    this._onSetActiveTool = this._onSetActiveTool.bind(this);
    this._onSetZoom = this._onSetZoom.bind(this);
    this._onTouchStart = this._onTouchStart.bind(this);
    this._onTouchMove = throttle(this._onTouchMove.bind(this), 10);
    this._onTouchEnd = this._onTouchEnd.bind(this);
    this._onTouchCancel = this._onTouchCancel.bind(this);
    this._onMouseDown = this._onMouseDown.bind(this);
    this._onMouseMove = throttle(this._onMouseMove.bind(this), 10);
    this._onMouseUp = this._onMouseUp.bind(this);
    this._onWheel = this._onWheel.bind(this);

    window.addEventListener('resize', this._onResize, false);
    this._toolbarStore.on(SET_ACTIVE_TOOL, this._onSetActiveTool);
    this._toolbarStore.on(SET_ZOOM, this._onSetZoom);
    this._$el.addEventListener('touchstart', this._onTouchStart, false);
    this._$el.addEventListener('touchmove', this._onTouchMove, false);
    this._$el.addEventListener('touchend', this._onTouchEnd, false);
    this._$el.addEventListener('touchcancel', this._onTouchCancel, false);
    this._$el.addEventListener('mousedown', this._onMouseDown, false);
    this._$el.addEventListener('mousemove', this._onMouseMove, false);
    this._$el.addEventListener('mouseup', this._onMouseUp, false);
    this._$el.addEventListener('mouseout', this._onMouseUp, false);
    this._$el.addEventListener('wheel', this._onWheel, false);

    new Toolbar(this._toolbarStore, this._undoManager);
    new SecondaryToolbar(this._toolbarStore);
    new BrushCursor(this._toolbarStore);

    const gridCanvas = document.createElement('canvas');
    this._$el.appendChild(gridCanvas);

    this._gridLayer = new GridLayer(gridCanvas, this, this._toolbarStore);

    const drawingCanvas = document.createElement('canvas');
    this._$el.appendChild(drawingCanvas);

    this._drawingLayer = new DrawingLayer(
      drawingCanvas,
      this,
      this._toolbarStore,
      this._drawingLayerStore
    );
  }

  get width() {
    return this._width;
  }

  get height() {
    return this._height;
  }

  get x() {
    return this._x;
  }

  get y() {
    return this._y;
  }

  _onSetActiveTool(tool) {
    this._$el.style.cursor = CURSOR_FOR_TOOL[tool];

    if (this._currentGesture === 'drag' && tool !== 'pan') {
      this._onDragCancel();
    }
  }

  _onResize() {
    this._width = this._$el.offsetWidth;
    this._height = this._$el.offsetHeight;
    this.emit(RESIZE);
  }

  _onTouchStart(e) {
    e.preventDefault();
    this._$el.focus();

    if (this._currentGesture) {
      return;
    }

    if (e.touches.length > 1) {
      this._onPinchStart(e);
    } else if (this._toolbarStore.getActiveTool() === 'pan') {
      this._onDragStart(e);
    } else {
      this._onPointerDown(e);
    }
  }

  _onMouseDown(e) {
    e.preventDefault();
    this._$el.focus();

    if (this._toolbarStore.getActiveTool() === 'pan') {
      this._onDragStart(e);
    } else {
      this._onPointerDown(e);
    }
  }

  _onPinchStart(e) {
    this._currentGesture = 'pinch';

    const p1 = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY,
    };

    const p2 = {
      x: e.touches[1].clientX,
      y: e.touches[1].clientY,
    };

    const center = getCenter(p1, p2);

    const evt = {
      type: PINCH_START,
      center: { clientX: center.x, clientY: center.y },
    };

    this.emit(PINCH_START, evt);
    this._lastGestureEvent = evt;
  }

  _onDragStart(e) {
    this._currentGesture = 'drag';
    this._startX = this._x;
    this._startY = this._y;

    const evt = {
      type: DRAG_START,
      clientX: e.touches ? e.touches[0].clientX : e.clientX,
      clientY: e.touches ? e.touches[0].clientY : e.clientY,
    };

    const { x, y } = this._transformPointerPosition(evt);
    evt.x = x;
    evt.y = y;

    this.emit(DRAG_START, evt);
    this._lastGestureEvent = evt;
  }

  _onPointerDown(e) {
    this._currentGesture = 'pointer';

    const evt = {
      type: POINTER_DOWN,
      clientX: e.touches ? e.touches[0].clientX : e.clientX,
      clientY: e.touches ? e.touches[0].clientY : e.clientY,
    };

    const { x, y } = this._transformPointerPosition(evt);
    evt.x = x;
    evt.y = y;

    this.emit(POINTER_DOWN, evt);
    this._lastGestureEvent = evt;
  }

  _onTouchMove(e) {
    e.preventDefault();

    if (this._currentGesture === 'pinch') {
      this._onPinchMove(e);
    } else if (this._currentGesture === 'drag') {
      if (e.touches.length > 1) {
        this._onDragCancel();
        this._onPinchStart(e);
      } else {
        this._onDragMove(e);
      }
    } else if (this._currentGesture === 'pointer') {
      if (e.touches.length > 1) {
        this._onPointerCancel();
        this._onPinchStart(e);
      } else {
        this._onPointerMove(e);
      }
    }
  }

  _onMouseMove(e) {
    e.preventDefault();

    if (this._currentGesture === 'drag') {
      this._onDragMove(e);
    } else if (this._currentGesture === 'pointer') {
      this._onPointerMove(e);
    }
  }

  _onPinchMove(e) {
    if (!e.touches.length > 1) {
      this._onPinchCancel(e);
      return;
    }

    const p1 = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY,
    };

    const p2 = {
      x: e.touches[1].clientX,
      y: e.touches[1].clientY,
    };

    const center = getCenter(p1, p2);

    const evt = {
      type: PINCH_MOVE,
      center: { clientX: center.x, clientY: center.y },
      distance: getDistance(p1, p2),
    };

    const zoom =
      this._toolbarStore.getZoom() *
      (evt.distance / (this._lastGestureEvent.distance || evt.distance));

    this._toolbarStore.setZoom(zoom, { clientX: center.x, clientY: center.y });

    this.emit(PINCH_MOVE, evt);
    this._lastGestureEvent = evt;
  }

  _onDragMove(e) {
    const evt = {
      type: DRAG_MOVE,
      clientX: e.touches ? e.touches[0].clientX : e.clientX,
      clientY: e.touches ? e.touches[0].clientY : e.clientY,
    };

    evt.deltaX = evt.clientX - this._lastGestureEvent.clientX;
    evt.deltaY = evt.clientY - this._lastGestureEvent.clientY;

    this._x -= evt.deltaX;
    this._y -= evt.deltaY;

    const { x, y } = this._transformPointerPosition(evt);
    evt.x = x;
    evt.y = y;

    this.emit(DRAG_MOVE, evt);
    this._lastGestureEvent = evt;
  }

  _onPointerMove(e) {
    const evt = {
      type: POINTER_MOVE,
      clientX: e.touches ? e.touches[0].clientX : e.clientX,
      clientY: e.touches ? e.touches[0].clientY : e.clientY,
    };

    evt.deltaX = evt.clientX - this._lastGestureEvent.clientX;
    evt.deltaY = evt.clientY - this._lastGestureEvent.clientY;

    const { x, y } = this._transformPointerPosition(evt);
    evt.x = x;
    evt.y = y;

    this.emit(POINTER_MOVE, evt);
    this._lastGestureEvent = evt;
  }

  _onTouchEnd(e) {
    e.preventDefault();

    if (this._currentGesture === 'pinch') {
      this._onPinchEnd(e);
    } else if (this._currentGesture === 'drag') {
      this._onDragEnd(e);
    } else if (this._currentGesture === 'pointer') {
      this._onPointerUp(e);
    }
  }

  _onMouseUp(e) {
    e.preventDefault();

    if (this._currentGesture === 'drag') {
      this._onDragEnd(e);
    } else if (this._currentGesture === 'pointer') {
      this._onPointerUp(e);
    }
  }

  _onPinchEnd(e) {
    const evt = { type: PINCH_END };

    this.emit(PINCH_END, evt);
    this._currentGesture = null;
    this._lastGestureEvent = null;
  }

  _onDragEnd(e) {
    const evt = { type: DRAG_END };

    this._startX = null;
    this._startY = null;

    this.emit(DRAG_END, evt);
    this._currentGesture = null;
    this._lastGestureEvent = null;
  }

  _onPointerUp(e) {
    const evt = {
      type: POINTER_UP,
      clientX: this._lastGestureEvent.clientX,
      clientY: this._lastGestureEvent.clientY,
      x: this._lastGestureEvent.x,
      y: this._lastGestureEvent.y,
    };

    this.emit(POINTER_UP, evt);
    this._currentGesture = null;
    this._lastGestureEvent = null;
  }

  _onTouchCancel(e) {
    e.preventDefault();

    if (this._currentGesture === 'pinch') {
      this._onPinchCancel(e);
    } else if (this._currentGesture === 'drag') {
      this._onDragCancel(e);
    } else if (this._currentGesture === 'pointer') {
      this._onPointerCancel(e);
    }
  }

  _onPinchCancel() {
    const evt = { type: PINCH_CANCEL };

    this.emit(PINCH_CANCEL, evt);
    this._currentGesture = null;
    this._lastGestureEvent = null;
  }

  _onDragCancel() {
    const evt = { type: DRAG_CANCEL };

    this._startX = null;
    this._startY = null;

    this.emit(DRAG_CANCEL, evt);
    this._currentGesture = null;
    this._lastGestureEvent = null;
  }

  _onPointerCancel() {
    const evt = { type: POINTER_CANCEL };

    this.emit(POINTER_CANCEL, evt);
    this._currentGesture = null;
    this._lastGestureEvent = null;
  }

  _onWheel(e) {
    e.preventDefault();

    const oldZoom = this._toolbarStore.getZoom();
    const newZoom =
      e.deltaY < 0 ? oldZoom * ZOOM_FACTOR : oldZoom / ZOOM_FACTOR;

    this._toolbarStore.setZoom(newZoom, e);
  }

  _onSetZoom(newZoom, oldZoom, center) {
    const pointTo = {
      x: (center.clientX + this._x) / oldZoom,
      y: (center.clientY + this._y) / oldZoom,
    };

    this._x = pointTo.x * newZoom - center.clientX;
    this._y = pointTo.y * newZoom - center.clientY;
  }

  _transformPointerPosition(pos) {
    const scale = this._toolbarStore.getZoom();

    return {
      x: (pos.clientX + this._x) / scale,
      y: (pos.clientY + this._y) / scale,
    };
  }
}
