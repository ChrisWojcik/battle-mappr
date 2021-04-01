import Konva from 'konva';
import Toolbar from '@/components/Toolbar';
import BrushCursor from '@/components/BrushCursor';
import GridLayer from './layers/GridLayer';
import DrawingLayer from './layers/DrawingLayer';
import ToolbarStore, { SET_ACTIVE_TOOL, SET_ZOOM } from '@/stores/ToolbarStore';
import DrawingLayerStore from '@/stores/DrawingLayerStore';
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

class BattleMap {
  constructor(documentId) {
    this._$el = document.querySelector('#map');
    this._toolbarStore = new ToolbarStore();
    this._drawingLayerStore = new DrawingLayerStore(documentId);

    new Toolbar(this._toolbarStore);
    new BrushCursor(this._toolbarStore);

    const width = this._$el.offsetWidth;
    const height = this._$el.offsetHeight;

    // by default Konva prevent some events when node is dragging
    // it improve the performance and work well for 95% of cases
    // we need to enable all events on Konva, even when we are dragging a node
    // so it triggers touchmove correctly
    Konva.hitOnDragEnabled = true;

    this._lastDist = 0;
    this._lastCenter = null;

    this._stage = new Konva.Stage({
      container: this._$el,
      width,
      height,
    });

    this._gridLayer = new GridLayer(this._$el, this._stage, this._toolbarStore);

    this._drawingLayer = new DrawingLayer(
      this._stage,
      this._toolbarStore,
      this._drawingLayerStore
    );

    this._onResize = debounce(this._onResize.bind(this), 250);
    this._onSetActiveTool = this._onSetActiveTool.bind(this);
    this._onSetZoom = this._onSetZoom.bind(this);
    this._onTouchStart = this._onTouchStart.bind(this);
    this._onTouchMove = this._onTouchMove.bind(this);
    this._onTouchEnd = this._onTouchEnd.bind(this);
    this._onDragmove = this._onDragmove.bind(this);
    this._onWheel = this._onWheel.bind(this);

    window.addEventListener('resize', this._onResize, false);
    this._toolbarStore.on(SET_ACTIVE_TOOL, this._onSetActiveTool);
    this._toolbarStore.on(SET_ZOOM, this._onSetZoom);
    this._stage.on('touchstart', this._onTouchStart);
    this._stage.on('touchmove', this._onTouchMove);
    this._stage.on('touchend touchcancel', this._onTouchEnd);
    this._stage.on('dragmove', this._onDragmove);
    this._stage.on('wheel', this._onWheel);
  }

  _onSetActiveTool(tool) {
    this._$el.style.cursor = CURSOR_FOR_TOOL[tool];
    this._stage.draggable(tool === 'pan');
  }

  _onResize() {
    this._stage.width(this._$el.offsetWidth);
    this._stage.height(this._$el.offsetHeight);

    this._gridLayer.resize();
  }

  _onTouchStart(e) {
    if (e.evt.touches && !(e.evt.touches[0] && e.evt.touches[1])) {
      return;
    }

    e.evt.preventDefault();

    if (this._stage.isDragging()) {
      this._stage.stopDrag();
    }

    const p1 = {
      x: e.evt.touches[0].clientX,
      y: e.evt.touches[0].clientY,
    };

    const p2 = {
      x: e.evt.touches[1].clientX,
      y: e.evt.touches[1].clientY,
    };

    if (!this._lastCenter) {
      this._lastCenter = getCenter(p1, p2);
      return;
    }
  }

  _onTouchMove(e) {
    if (e.evt.touches && !(e.evt.touches[0] && e.evt.touches[1])) {
      return;
    }

    e.evt.preventDefault();

    if (this._stage.isDragging()) {
      this._stage.stopDrag();
    }

    const p1 = {
      x: e.evt.touches[0].clientX,
      y: e.evt.touches[0].clientY,
    };

    const p2 = {
      x: e.evt.touches[1].clientX,
      y: e.evt.touches[1].clientY,
    };

    if (!this._lastCenter) {
      this._lastCenter = getCenter(p1, p2);
      return;
    }

    const newCenter = getCenter(p1, p2);
    const dist = getDistance(p1, p2);

    if (!this._lastDist) {
      this._lastDist = dist;
    }

    const newZoom = this._stage.scaleX() * (dist / this._lastDist);

    this._lastDist = dist;
    this._lastCenter = newCenter;

    this._toolbarStore.setZoom(newZoom, newCenter);
  }

  _onTouchEnd() {
    this._lastDist = 0;
    this._lastCenter = null;
  }

  _onDragmove() {
    this._gridLayer.draw();
  }

  _onWheel(e) {
    e.evt.preventDefault();

    const oldZoom = this._toolbarStore.getZoom();
    const newZoom =
      e.evt.deltaY < 0 ? oldZoom * ZOOM_FACTOR : oldZoom / ZOOM_FACTOR;

    this._toolbarStore.setZoom(newZoom, this._stage.getPointerPosition());
  }

  _onSetZoom(newZoom, oldZoom, center) {
    const pointTo = {
      x: (center.x - this._stage.x()) / oldZoom,
      y: (center.y - this._stage.y()) / oldZoom,
    };

    this._stage.scale({ x: newZoom, y: newZoom });

    const newPos = {
      x: center.x - pointTo.x * newZoom,
      y: center.y - pointTo.y * newZoom,
    };

    this._stage.position(newPos);
    this._gridLayer.draw();
    this._stage.batchDraw();
  }
}

export default BattleMap;
