import { SET_ACTIVE_TOOL } from '@/stores/ToolbarStore';
import { CAN_UNDO_CHANGED, CAN_REDO_CHANGED } from '@/stores/UndoManager';
import BrushOptionsBar from './OptionsBars/BrushOptionsBar';
import EraserOptionsBar from './OptionsBars/EraserOptionsBar';

import './Toolbar.scss';
import './OptionsBars/OptionsBar.scss';

const SPACEBAR_KEY = 32;
const Z_KEY = 90;

export default class Toolbar {
  constructor(toolbarStore, undoManager) {
    this._$el = document.querySelector('#toolbar');
    this._$map = document.querySelector('#map');
    this._$buttons = this._$el.querySelectorAll('.toolbar__button');

    this._toolbarStore = toolbarStore;
    this._undoManager = undoManager;

    this._lastActiveTool;

    new BrushOptionsBar(this._toolbarStore);
    new EraserOptionsBar(this._toolbarStore);

    this._onButtonPointerDown = this._onButtonPointerDown.bind(this);
    this._onButtonClick = this._onButtonClick.bind(this);
    this._onKeyDown = this._onKeyDown.bind(this);
    this._onKeyUp = this._onKeyUp.bind(this);
    this._onSetActiveTool = this._onSetActiveTool.bind(this);
    this._onCanUndoChanged = this._onCanUndoChanged.bind(this);
    this._onCanRedoChanged = this._onCanRedoChanged.bind(this);

    this._$buttons.forEach(($button) => {
      $button.addEventListener('mousedown', this._onButtonPointerDown, false);
      $button.addEventListener('touchstart', this._onButtonPointerDown, false);
      $button.addEventListener('click', this._onButtonClick, false);
    });

    document.addEventListener('keydown', this._onKeyDown, false);
    document.addEventListener('keyup', this._onKeyUp, false);

    this._toolbarStore.on(SET_ACTIVE_TOOL, this._onSetActiveTool);
    this._undoManager.on(CAN_UNDO_CHANGED, this._onCanUndoChanged);
    this._undoManager.on(CAN_REDO_CHANGED, this._onCanRedoChanged);
  }

  _onButtonPointerDown(e) {
    if (e.currentTarget.getAttribute('aria-disabled') === 'true') {
      e.preventDefault();
    }
  }

  _onButtonClick(e) {
    const tool = e.currentTarget.dataset.tool;

    switch (tool) {
      case 'undo': {
        this._undoManager.undo();
        break;
      }
      case 'redo': {
        this._undoManager.redo();
        break;
      }
      default: {
        this._toolbarStore.setActiveTool(tool);
      }
    }
  }

  _onKeyDown(e) {
    if (e.keyCode === Z_KEY && (e.ctrlKey || e.metaKey) && !e.repeat) {
      e.preventDefault();

      if (e.shiftKey) {
        this._undoManager.redo();
      } else {
        this._undoManager.undo();
      }
    }

    if (
      e.keyCode === SPACEBAR_KEY &&
      this._toolbarStore.getActiveTool() !== 'pan'
    ) {
      this._lastActiveTool = this._toolbarStore.getActiveTool();
      this._toolbarStore.setActiveTool('pan');
    }
  }

  _onKeyUp(e) {
    if (e.keyCode === SPACEBAR_KEY) {
      this._toolbarStore.setActiveTool(this._lastActiveTool);
    }
  }

  _onSetActiveTool(tool) {
    this._$buttons.forEach(($button) => {
      if ($button.dataset.tool === tool) {
        $button.classList.add('active');
      } else {
        $button.classList.remove('active');
      }
    });
  }

  _onCanUndoChanged(canUndo) {
    this._$el
      .querySelector('.toolbar__button[data-tool="undo"]')
      .setAttribute('aria-disabled', !canUndo);
  }

  _onCanRedoChanged(canRedo) {
    this._$el
      .querySelector('.toolbar__button[data-tool="redo"]')
      .setAttribute('aria-disabled', !canRedo);
  }
}
