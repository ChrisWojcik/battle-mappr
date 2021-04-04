import connection from '@/lib/sharedb/connection';
import EventEmitter from '@/lib/EventEmitter';

export const LOADED = 'drawing/LOADED';
export const ERROR = 'drawing/ERROR';
export const LINES = 'drawing/LINES';

const DRAWING = 'drawing';

export default class DrawingLayerStore extends EventEmitter {
  constructor(documentId, undoManager) {
    super();

    this._documentId = documentId;

    this._undoManager = undoManager;

    this._handleOp = this._handleOp.bind(this);
    this._submitOp = this._submitOp.bind(this);

    this._init();
  }

  on(event, ...args) {
    // if the doc is already loaded with data, fire the event immediately
    if (event === LOADED && this._doc) {
      this.emit(LOADED);
      this.emit(LINES, this.getAllLines());
    }

    super.on(event, ...args);
  }

  getAllLines() {
    return this._doc && this._doc.data ? this._doc.data[DRAWING] : [];
  }

  addLine(line) {
    const index = this._doc.data[DRAWING].length;

    this._handleAddLine(line, index);

    this._undoManager.registerUndo(
      () => {
        this._handleRemoveLine(line);
      },
      () => {
        this._handleAddLine(line, index);
      }
    );
  }

  _init() {
    const doc = connection.get('boards', this._documentId);

    doc.subscribe((err) => {
      if (err) {
        console.error(err);
        return;
      }

      this._doc = doc;
      this.emit(LOADED);
      this.emit(LINES, this.getAllLines());
      this._doc.on('op', this._handleOp);
    });
  }

  _handleAddLine(line, index) {
    this._submitOp([
      {
        p: [DRAWING, index],
        li: line,
      },
    ]);
  }

  _handleRemoveLine(line) {
    for (let i = this._doc.data[DRAWING].length - 1; i >= 0; i--) {
      if (this._doc.data[DRAWING][i].id === line.id) {
        this._submitOp([
          {
            p: [DRAWING, i],
            ld: line,
          },
        ]);

        break;
      }
    }
  }

  _submitOp(op) {
    if (!this._doc) {
      throw new Error('Doc is not ready to receive ops.');
    }

    this._doc.submitOp(op, (err) => {
      // if doc was destroyed while this was in flight, just bail
      if (!this._doc) {
        return;
      }

      // if we're in a bad state, destroy the doc and wait until
      // we can re-sync with the server
      if (err) {
        console.error(err);
        this.emit(ERROR, err);

        this._doc.pause();
        this._doc.removeListener('op', this._handleOp);
        this._doc.unsubscribe();
        this._doc.destroy();
        this._doc.whenNothingPending(() => {
          this._init();
        });
        this._doc = null;
      }
    });
  }

  _handleOp(ops) {
    for (let i = 0; i < ops.length; i++) {
      if (ops[i].p[0] === DRAWING) {
        this.emit(LINES, this.getAllLines());
        break;
      }
    }
  }
}
