import EventEmitter from '@/lib/EventEmitter';

export const CAN_UNDO_CHANGED = 'undoManager/CAN_UNDO_CHANGED';
export const CAN_REDO_CHANGED = 'undoManager/CAN_REDO_CHANGED';

export default class UndoManager extends EventEmitter {
  constructor() {
    super();

    this._undoStack = [];
    this._redoStack = [];
  }

  get canUndo() {
    return this._undoStack.length > 0;
  }

  get canRedo() {
    return this._redoStack.length > 0;
  }

  undo() {
    if (this.canUndo) {
      const couldUndo = this.canUndo;
      const couldRedo = this.canRedo;

      const [handleUndo, handleRedo] = this._undoStack.pop();

      handleUndo();
      this._redoStack.push([handleUndo, handleRedo]);

      if (this.canUndo !== couldUndo) {
        this.emit(CAN_UNDO_CHANGED, this.canUndo);
      }

      if (this.canRedo !== couldRedo) {
        this.emit(CAN_REDO_CHANGED, this.canRedo);
      }
    }
  }

  redo() {
    if (this.canRedo) {
      const couldRedo = this.canRedo;
      const couldUndo = this.canUndo;

      const [handleUndo, handleRedo] = this._redoStack.pop();

      handleRedo();
      this._undoStack.push([handleUndo, handleRedo]);

      if (this.canRedo !== couldRedo) {
        this.emit(CAN_REDO_CHANGED, this.canRedo);
      }

      if (this.canUndo !== couldUndo) {
        this.emit(CAN_UNDO_CHANGED, this.canUndo);
      }
    }
  }

  registerUndo(handleUndo, handleRedo) {
    const couldUndo = this.canUndo;
    const couldRedo = this.canRedo;

    this._undoStack.push([handleUndo, handleRedo]);
    this._redoStack = [];

    if (this.canUndo !== couldUndo) {
      this.emit(CAN_UNDO_CHANGED, this.canUndo);
    }

    if (this.canRed !== couldRedo) {
      this.emit(CAN_REDO_CHANGED, this.canRedo);
    }
  }
}
