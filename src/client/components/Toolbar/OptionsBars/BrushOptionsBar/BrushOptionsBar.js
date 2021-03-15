import {
  SET_ACTIVE_TOOL,
  SET_BRUSH_SIZE,
  SET_BRUSH_COLOR,
} from '@/stores/ToolbarStore';

const ESCAPE_KEY = 27;

export default class BrushOptionsBar {
  constructor(toolbarStore) {
    this._$el = document.querySelector('#options-bar-brush');
    this._$brushSlider = document.querySelector('#options-bar-brush__range');
    this._$brushInput = document.querySelector('#options-bar-brush__input');
    this._$colorButton = document.querySelector(
      '#options-bar-brush__color-button'
    );
    this._$currentColor = document.querySelector(
      '#options-bar-brush__color-current'
    );
    this._$colorButtonLabel = document.querySelector(
      '#options-bar-brush__color-button-label'
    );
    this._$colorMenu = document.querySelector('#options-bar-brush__color-menu');

    this._toolbarStore = toolbarStore;

    this._onSetActiveTool = this._onSetActiveTool.bind(this);
    this._onSetBrushSize = this._onSetBrushSize.bind(this);
    this._onSetBrushColor = this._onSetBrushColor.bind(this);
    this._onBrushSizeChange = this._onBrushSizeChange.bind(this);
    this._onBrushInputBlur = this._onBrushInputBlur.bind(this);
    this._onColorButtonClick = this._onColorButtonClick.bind(this);
    this._onColorMenuEscape = this._onColorMenuEscape.bind(this);
    this._onColorMenuFocusOut = this._onColorMenuFocusOut.bind(this);
    this._onColorMenuPointerDownOutside = this._onColorMenuPointerDownOutside.bind(
      this
    );
    this._onColorMenuButtonClick = this._onColorMenuButtonClick.bind(this);

    this._$brushSlider.addEventListener(
      'input',
      this._onBrushSizeChange,
      false
    );

    this._$brushInput.addEventListener('input', this._onBrushSizeChange, false);

    this._$brushInput.addEventListener(
      'change',
      this._onBrushSizeChange,
      false
    );

    this._$brushInput.addEventListener('blur', this._onBrushInputBlur, false);

    this._$colorButton.addEventListener(
      'click',
      this._onColorButtonClick,
      false
    );

    this._$colorMenu.addEventListener(
      'click',
      this._onColorMenuButtonClick,
      false
    );

    this._toolbarStore.on(SET_ACTIVE_TOOL, this._onSetActiveTool);
    this._toolbarStore.on(SET_BRUSH_SIZE, this._onSetBrushSize);
    this._toolbarStore.on(SET_BRUSH_COLOR, this._onSetBrushColor);

    // check if this options bar should display on load
    this._onSetActiveTool(this._toolbarStore.getActiveTool());

    // set the brush size to the current value in the store
    this._onSetBrushSize(this._toolbarStore.getBrushSize());

    // set the brush color to the current value in the store
    this._onSetBrushColor(this._toolbarStore.getBrushColor());
  }

  _onSetActiveTool(tool) {
    if (tool === 'brush') {
      this._$el.classList.add('options-bar--visible');
    } else {
      this._$el.classList.remove('options-bar--visible');
    }
  }

  _onSetBrushSize(size) {
    this._$brushSlider.value = size;

    if (document.activeElement !== this._$brushInput) {
      this._$brushInput.value = size;
    }
  }

  _onSetBrushColor(color) {
    this._$currentColor.textContent = color;
    this._$colorButtonLabel.style.background = color;
  }

  _onBrushSizeChange(e) {
    e.preventDefault();
    this._toolbarStore.setBrushSize(e.currentTarget.value);
  }

  _onBrushInputBlur(e) {
    e.currentTarget.value = this._toolbarStore.getBrushSize();
  }

  _onColorButtonClick() {
    if (this._$colorMenu.classList.contains('hidden')) {
      this._openColorMenu();
    } else {
      this._closeColorMenu();
    }
  }

  _onColorMenuEscape(e) {
    if (e.keyCode && e.keyCode === ESCAPE_KEY) {
      this._closeColorMenu();
      this._$colorButton.focus();
    }
  }

  _onColorMenuFocusOut(e) {
    if (!this._$colorMenu.contains(e.relatedTarget)) {
      this._closeColorMenu();
    }
  }

  _onColorMenuPointerDownOutside(e) {
    if (
      e.target !== this._$colorMenu &&
      !this._$colorMenu.contains(e.target) &&
      e.target !== this._$colorButton &&
      !this._$colorButton.contains(e.target)
    ) {
      this._closeColorMenu();
    }
  }

  _onColorMenuButtonClick(e) {
    const $button = e.target.closest('.options-bar-brush__color-button');

    if ($button) {
      this._toolbarStore.setBrushColor($button.dataset.color);
      this._closeColorMenu();
      this._$colorButton.focus();
    }
  }

  _openColorMenu() {
    this._$colorButton.setAttribute('aria-expanded', 'true');
    this._$colorMenu.classList.remove('hidden');

    document.addEventListener('keydown', this._onColorMenuEscape, false);
    document.addEventListener(
      'mousedown',
      this._onColorMenuPointerDownOutside,
      false
    );
    document.addEventListener(
      'touchstart',
      this._onColorMenuPointerDownOutside,
      false
    );
    this._$colorMenu.addEventListener(
      'focusout',
      this._onColorMenuFocusOut,
      false
    );
  }

  _closeColorMenu() {
    this._$colorButton.setAttribute('aria-expanded', 'false');
    this._$colorMenu.classList.add('hidden');

    document.removeEventListener('keydown', this._onColorMenuEscape, false);
    document.removeEventListener(
      'mousedown',
      this._onColorMenuPointerDownOutside,
      false
    );
    document.removeEventListener(
      'touchstart',
      this._onColorMenuPointerDownOutside,
      false
    );
    this._$colorMenu.removeEventListener(
      'focusout',
      this._onColorMenuFocusOut,
      false
    );
  }
}
