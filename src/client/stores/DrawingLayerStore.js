import connection from '@/lib/sharedb/connection';
import EventEmitter from './EventEmitter';

export const DRAWING_LAYER_LOADED = 'drawing/DRAWING_LAYER_LOADED';
export const DRAWING_LAYER_ERROR = 'drawing/DRAWING_LAYER_ERROR';
export const ADD_LINE = 'drawing/ADD_LINE';
export const REMOVE_LINE = 'drawing/REMOVE_LINE';
export const REORDER_LINE = 'drawing/REORDER_LINE';
export const REPLACE_LINE = 'drawing/REPLACE_LINE';
export const REMOVE_ALL_LINES = 'drawing/REMOVE_ALL_LINES';
export const REPLACE_ALL_LINES = 'drawing/REPLACE_ALL_LINES';

const DRAWING = 'drawing';

export default class DrawingLayerStore extends EventEmitter {
  constructor(documentId) {
    super();

    this._documentId = documentId;

    this._handleOp = this._handleOp.bind(this);
    this._submitOp = this._submitOp.bind(this);

    this._init();
  }

  on(event, ...args) {
    // if the doc is already loaded with data, fire the event immediately
    if (event === DRAWING_LAYER_LOADED && this._doc) {
      this.emit(DRAWING_LAYER_LOADED, this.getAllLines());
    }

    super.on(event, ...args);
  }

  getAllLines() {
    return this._doc && this._doc.data ? this._doc.data[DRAWING] : [];
  }

  addLine(index, line) {
    this._submitOp([
      {
        p: [DRAWING, index],
        li: line,
      },
    ]);
  }

  _init() {
    const doc = connection.get('boards', this._documentId);

    doc.subscribe((err) => {
      if (err) {
        console.error(err);
        return;
      }

      this._doc = doc;
      this.emit(DRAWING_LAYER_LOADED, this.getAllLines());
      this._doc.on('op', this._handleOp);
    });
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
        this.emit(DRAWING_LAYER_ERROR, err);

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

  _handleOp(ops, isLocal) {
    ops.forEach((op) => {
      if (op.p[0] !== DRAWING) {
        return;
      }

      if (op.ld && op.li) {
        const index = op.p[1];
        const newLine = op.li;
        const oldLine = op.ld;

        this.emit(REPLACE_LINE, index, newLine, oldLine, isLocal);
        return;
      }

      if (op.ld) {
        const index = op.p[1];
        const line = op.ld;

        this.emit(REMOVE_LINE, index, line, isLocal);
        return;
      }

      if (op.li) {
        const index = op.p[1];
        const line = op.li;

        this.emit(ADD_LINE, index, line, isLocal);
        return;
      }

      if (op.lm) {
        const oldIndex = op.p[1];
        const newIndex = op.lm;

        this.emit(REORDER_LINE, oldIndex, newIndex, isLocal);
        return;
      }

      if (op.od && (!op.li || op.li.length === 0)) {
        this.emit(REMOVE_ALL_LINES, isLocal);
        return;
      }

      if (op.oi) {
        this.emit(REPLACE_ALL_LINES, op.oi, isLocal);
        return;
      }
    });
  }
}
