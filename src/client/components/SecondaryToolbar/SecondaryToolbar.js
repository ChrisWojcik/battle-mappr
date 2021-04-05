import createEasingFunction from '@/lib/animation/createEasingFunction';
import tween from '@/lib/animation/tween';

import './SecondaryToolbar.scss';

const ZOOM_FACTOR = 1.5;
const ZOOM_DURATION = 400;
const PLUS_KEY = 187;
const MINUS_KEY = 189;

export default class SecondaryToolbar {
  constructor(toolbarStore) {
    this._$el = document.getElementById('secondary-toolbar');
    this._$buttons = this._$el.querySelectorAll('.secondary-toolbar__button');

    this._toolbarStore = toolbarStore;

    this._runningZoomAnimation;

    this._onButtonPointerDown = this._onButtonPointerDown.bind(this);
    this._onButtonClick = this._onButtonClick.bind(this);
    this._onKeyDown = this._onKeyDown.bind(this);

    this._$buttons.forEach(($button) => {
      $button.addEventListener('mousedown', this._onButtonPointerDown, false);
      $button.addEventListener('touchstart', this._onButtonPointerDown, false);
      $button.addEventListener('click', this._onButtonClick, false);
    });

    document.addEventListener('keydown', this._onKeyDown, false);
  }

  _onButtonPointerDown(e) {
    if (e.currentTarget.getAttribute('aria-disabled') === 'true') {
      e.preventDefault();
    }
  }

  _onButtonClick(e) {
    const tool = e.currentTarget.dataset.tool;

    switch (tool) {
      case 'zoom-in': {
        this._handleZoomIn();
        break;
      }
      case 'zoom-out': {
        this._handleZoomOut();
        break;
      }
      default: {
        return;
      }
    }
  }

  _onKeyDown(e) {
    if (e.keyCode === PLUS_KEY && !e.repeat) {
      e.preventDefault();
      this._handleZoomIn();
    }

    if (e.keyCode === MINUS_KEY && !e.repeat) {
      e.preventDefault();
      this._handleZoomOut();
    }
  }

  _handleZoomIn() {
    const startValue = this._toolbarStore.getZoom();
    const endValue = startValue * ZOOM_FACTOR;

    this._animateZoom(startValue, endValue);
  }

  _handleZoomOut() {
    const startValue = this._toolbarStore.getZoom();
    const endValue = startValue / ZOOM_FACTOR;

    this._animateZoom(startValue, endValue);
  }

  _animateZoom(startValue, endValue) {
    const easeOut = createEasingFunction('ease-out');
    let startTime;

    const tick = (timestamp) => {
      if (!startTime) {
        startTime = timestamp;
      }

      const elapsedTime = timestamp - startTime;
      const progress = easeOut(elapsedTime / ZOOM_DURATION);

      if (elapsedTime >= ZOOM_DURATION) {
        this._toolbarStore.setZoom(endValue);
      } else {
        this._toolbarStore.setZoom(tween(progress, startValue, endValue));
        this._runningZoomAnimation = window.requestAnimationFrame(tick);
      }
    };

    cancelAnimationFrame(this._runningZoomAnimation);
    this._runningZoomAnimation = window.requestAnimationFrame(tick);
  }
}
