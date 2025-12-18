// Poisson por método inverso (mismo espíritu que tu Python)
(() => {
  const TF = (window.TF = window.TF || {});
  TF.sim = TF.sim || {};

  function poissonInverse(lambda, u) {
    if (!(lambda > 0)) return 0;

    let p = Math.exp(-lambda);
    let cdf = p;
    let x = 0;

    while (u > cdf) {
      x += 1;
      p = (p * lambda) / x;
      cdf += p;
      if (x > 10000) break;
    }

    return x;
  }

  TF.sim.poisson = { poissonInverse };
})();
