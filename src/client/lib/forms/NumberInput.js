import clamp from '@/lib/utils/clamp';

export default class NumberInput {
  constructor($el) {
    this._$el = $el;
    this._$incrementButton = this._$el.querySelector('.form-number-button-inc');
    this._$decrementButton = this._$el.querySelector('.form-number-button-dec');
    this._$input = this._$el.querySelector('.form-control');

    if (!this._$incrementButton || !this._$decrementButton || !this._$input) {
      return;
    }

    this._increment = this._increment.bind(this);
    this._decrement = this._decrement.bind(this);

    this._$incrementButton.addEventListener('click', this._increment, false);
    this._$decrementButton.addEventListener('click', this._decrement, false);
  }

  _increment() {
    let asNumber = Number(this._$input.value);

    if (!isNaN(asNumber)) {
      this._$input.value = clamp(
        asNumber + Number(this._$el.dataset.step) || 1,
        Number(this._$el.dataset.min),
        Number(this._$el.dataset.max)
      );

      this._$input.dispatchEvent(new Event('change', { bubbles: true }));
    }
  }

  _decrement() {
    let asNumber = Number(this._$input.value);

    if (!isNaN(asNumber)) {
      this._$input.value = clamp(
        asNumber - this._$el.dataset.step || 1,
        Number(this._$el.dataset.min),
        Number(this._$el.dataset.max)
      );

      this._$input.dispatchEvent(new Event('change', { bubbles: true }));
    }
  }
}
