export default function tween(progress, from, to) {
  const diff = to - from;
  return from + progress * diff;
}
