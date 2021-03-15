import { SET_ACTIVE_TOOL } from '@/stores/ToolbarStore';
import BrushOptionsBar from './OptionsBars/BrushOptionsBar';
import EraserOptionsBar from './OptionsBars/EraserOptionsBar';

import './Toolbar.scss';
import './OptionsBars/OptionsBar.scss';

const SPACEBAR_KEY = 32;

export default class Toolbar {
  constructor(toolbarStore) {
    this._$el = document.querySelector('#toolbar');
    this._$map = document.querySelector('#map');
    this._toolbarStore = toolbarStore;
    this._$buttons = this._$el.querySelectorAll('.toolbar__button');

    this._lastActiveTool;
    this._holdingKey = false;

    new BrushOptionsBar(this._toolbarStore);
    new EraserOptionsBar(this._toolbarStore);

    this._onButtonClick = this._onButtonClick.bind(this);
    this._onKeyDown = this._onKeyDown.bind(this);
    this._onKeyUp = this._onKeyUp.bind(this);
    this._onSetActiveTool = this._onSetActiveTool.bind(this);

    this._$buttons.forEach(($button) => {
      $button.addEventListener('click', this._onButtonClick, false);
    });

    document.addEventListener('keydown', this._onKeyDown, false);
    document.addEventListener('keyup', this._onKeyUp, false);

    this._toolbarStore.on(SET_ACTIVE_TOOL, this._onSetActiveTool);
  }

  _onButtonClick(e) {
    this._toolbarStore.setActiveTool(e.currentTarget.dataset.tool);
  }

  _onKeyDown(e) {
    if (e.keyCode === SPACEBAR_KEY && !this._holdingKey) {
      this._lastActiveTool = this._toolbarStore.getActiveTool();
      this._holdingKey = true;
      this._toolbarStore.setActiveTool('pan');
    }
  }

  _onKeyUp(e) {
    if (e.keyCode === SPACEBAR_KEY) {
      this._toolbarStore.setActiveTool(this._lastActiveTool);
      this._holdingKey = false;
      this._lastActiveTool = undefined;
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
}
