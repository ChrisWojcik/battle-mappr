export default class EventEmitter {
  constructor() {
    this._listeners = {};
  }

  emit(event, ...args) {
    if (!this._listeners[event]) {
      return;
    }

    this._listeners[event].forEach((listener) => {
      listener(...args);
    });
  }

  on(event, listener) {
    this._listeners[event] = this._listeners[event] || [];
    this._listeners[event].push(listener);
  }

  off(event, listener) {
    if (!this._listeners[event]) {
      return;
    }

    for (let i = 0; i < this._listeners[event].length; i++) {
      if (this._listeners[event][i] === listener) {
        this._listeners[event].splice(i, 1);
        break;
      }
    }
  }
}
