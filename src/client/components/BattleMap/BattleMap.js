import Konva from 'konva';
import Toolbar from '@/components/Toolbar';
import BrushCursor from '@/components/BrushCursor';
import GridLayer from './layers/GridLayer';
import DrawingLayer from './layers/DrawingLayer';
import ToolbarStore, {
  SET_ACTIVE_TOOL,
  SET_SCALE,
} from '@/stores/ToolbarStore';
import DrawingLayerStore from '@/stores/DrawingLayerStore';
import debounce from '@/lib/utils/debounce';

import './BattleMap.scss';

const CURSOR_FOR_TOOL = {
  brush: 'crosshair',
  eraser: 'crosshair',
  pan: 'all-scroll',
};

const SCALE_FACTOR = 1.05;

class BattleMap {
  constructor(documentId) {
    this._$el = document.querySelector('#map');
    this._toolbarStore = new ToolbarStore();
    this._drawingLayerStore = new DrawingLayerStore(documentId);

    new Toolbar(this._toolbarStore);
    new BrushCursor(this._toolbarStore);

    const width = this._$el.offsetWidth;
    const height = this._$el.offsetHeight;

    this._stage = new Konva.Stage({
      container: this._$el,
      width,
      height,
      x: width / 2,
      y: height / 2,
    });

    this._gridLayer = new GridLayer(this._stage);
    this._drawingLayer = new DrawingLayer(
      this._stage,
      this._toolbarStore,
      this._drawingLayerStore
    );

    this._onResize = debounce(this._onResize.bind(this), 250);
    this._onSetActiveTool = this._onSetActiveTool.bind(this);
    this._onSetScale = this._onSetScale.bind(this);
    this._onDragend = this._onDragend.bind(this);
    this._onWheel = this._onWheel.bind(this);

    window.addEventListener('resize', this._onResize, false);
    this._toolbarStore.on(SET_ACTIVE_TOOL, this._onSetActiveTool);
    this._toolbarStore.on(SET_SCALE, this._onSetScale);
    this._stage.on('dragend', this._onDragend);
    this._stage.on('wheel', this._onWheel);

    this._gridLayer.draw();
  }

  _onSetActiveTool(tool) {
    this._$el.style.cursor = CURSOR_FOR_TOOL[tool];
    this._stage.draggable(tool === 'pan');
  }

  _onResize() {
    this._stage.width(this._$el.offsetWidth);
    this._stage.height(this._$el.offsetHeight);

    this._gridLayer.draw();
  }

  _onDragend() {
    this._gridLayer.draw();
  }

  _onWheel(e) {
    e.evt.preventDefault();

    const oldScale = this._toolbarStore.getScale();
    const newScale =
      e.evt.deltaY < 0 ? oldScale * SCALE_FACTOR : oldScale / SCALE_FACTOR;

    this._toolbarStore.setScale(newScale);

    clearTimeout(this._wheelIdleTimeout);

    this._wheelIdleTimeout = setTimeout(() => {
      this._gridLayer.draw();
    }, 200);
  }

  _onSetScale(newScale, oldScale) {
    const pointer = this._stage.getPointerPosition();

    const mousePointTo = {
      x: (pointer.x - this._stage.x()) / oldScale,
      y: (pointer.y - this._stage.y()) / oldScale,
    };

    this._stage.scale({ x: newScale, y: newScale });

    const newPos = {
      x: pointer.x - mousePointTo.x * newScale,
      y: pointer.y - mousePointTo.y * newScale,
    };

    this._stage.position(newPos);
    this._stage.batchDraw();
  }
}

export default BattleMap;
