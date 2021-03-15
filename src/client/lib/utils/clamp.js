export default function clamp(num, min = -Infinity, max = Infinity) {
  return Math.min(Math.max(num, min), max);
}
