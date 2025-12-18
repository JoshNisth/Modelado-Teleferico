(() => {
  const TF = (window.TF = window.TF || {});
  TF.utils = TF.utils || {};

  function fmt2(x) {
    return Number(x).toFixed(2);
  }

  function fmt3(x) {
    return Number(x).toFixed(3);
  }

  function pad2(n) {
    const s = String(n);
    return s.length >= 2 ? s : `0${s}`;
  }

  TF.utils.format = { fmt2, fmt3, pad2 };
})();
