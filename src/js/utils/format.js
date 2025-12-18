export function fmt2(x) {
  return Number(x).toFixed(2);
}

export function fmt3(x) {
  return Number(x).toFixed(3);
}

export function pad2(n) {
  const s = String(n);
  return s.length >= 2 ? s : `0${s}`;
}
