import { SET_ACTIVE_TOOL, SET_ERASER_SIZE } from '@/stores/ToolbarStore';

export default class EraserOptionsBar {
  constructor(toolbarStore) {
    this._$el = document.querySelector('#options-bar-eraser');
    this._$eraserSlider = document.querySelector('#options-bar-eraser__range');
    this._$eraserInput = document.querySelector('#options-bar-eraser__input');
    this._toolbarStore = toolbarStore;

    this._onSetActiveTool = this._onSetActiveTool.bind(this);
    this._onSetEraserSize = this._onSetEraserSize.bind(this);
    this._onEraserSizeChange = this._onEraserSizeChange.bind(this);
    this._onEraserInputBlur = this._onEraserInputBlur.bind(this);

    this._$eraserSlider.addEventListener(
      'input',
      this._onEraserSizeChange,
      false
    );

    this._$eraserInput.addEventListener(
      'input',
      this._onEraserSizeChange,
      false
    );

    this._$eraserInput.addEventListener(
      'change',
      this._onEraserSizeChange,
      false
    );

    this._$eraserInput.addEventListener('blur', this._onEraserInputBlur, false);

    this._toolbarStore.on(SET_ACTIVE_TOOL, this._onSetActiveTool);
    this._toolbarStore.on(SET_ERASER_SIZE, this._onSetEraserSize);

    // check if this options bar should display on load
    this._onSetActiveTool(this._toolbarStore.getActiveTool());

    // set the Eraser size to what is currently in the store
    this._onSetEraserSize(this._toolbarStore.getEraserSize());
  }

  _onSetActiveTool(tool) {
    if (tool === 'eraser') {
      this._$el.classList.add('options-bar--visible');
    } else {
      this._$el.classList.remove('options-bar--visible');
    }
  }

  _onSetEraserSize(size) {
    this._$eraserSlider.value = size;

    if (document.activeElement !== this._$eraserInput) {
      this._$eraserInput.value = size;
    }
  }

  _onEraserSizeChange(e) {
    e.preventDefault();
    this._toolbarStore.setEraserSize(e.currentTarget.value);
  }

  _onEraserInputBlur(e) {
    e.currentTarget.value = this._toolbarStore.getEraserSize();
  }
}
