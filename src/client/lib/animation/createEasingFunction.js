import BezierEasing from './BezierEasing';

let Easings = {};

[
  ['linear', [0.0, 0.0, 1.0, 1.0]],
  ['ease', [0.25, 0.1, 0.25, 1.0]],
  ['ease-in', [0.42, 0.0, 1.0, 1.0]],
  ['ease-out', [0.0, 0.0, 0.58, 1.0]],
  ['ease-in-out', [0.42, 0.0, 0.58, 1.0]],
].forEach(function (array) {
  Easings[array[0]] = BezierEasing.apply(null, array[1]);
});

export default function createEasingFunction(config) {
  if (typeof config === 'string') {
    return Easings[config];
  } else {
    return BezierEasing.apply(null, config);
  }
}
