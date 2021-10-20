/**
 * @license
 Copyright (c) 2013 jStat

 Permission is hereby granted, free of charge, to any person obtaining a copy
 of this software and associated documentation files (the "Software"), to deal
 in the Software without restriction, including without limitation the rights
 to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 copies of the Software, and to permit persons to whom the Software is
 furnished to do so, subject to the following conditions:

 The above copyright notice and this permission notice shall be included in
 all copies or substantial portions of the Software.

 THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 THE SOFTWARE.
 */

export function erf(x: number): number {
  const cof = [-1.3026537197817094, 6.4196979235649026e-1, 1.9476473204185836e-2,
    -9.561514786808631e-3, -9.46595344482036e-4, 3.66839497852761e-4,
    4.2523324806907e-5, -2.0278578112534e-5, -1.624290004647e-6,
    1.303655835580e-6, 1.5626441722e-8, -8.5238095915e-8,
    6.529054439e-9, 5.059343495e-9, -9.91364156e-10,
    -2.27365122e-10, 9.6467911e-11, 2.394038e-12,
    -6.886027e-12, 8.94487e-13, 3.13092e-13,
    -1.12708e-13, 3.81e-16, 7.106e-15,
    -1.523e-15, -9.4e-17, 1.21e-16,
    -2.8e-17]
  let j = cof.length - 1
  let isneg = false
  let d = 0
  let dd = 0
  let t, ty, tmp, res

  if (x === 0) {
    return 0
  }
  if (x < 0) {
    x = -x
    isneg = true
  }

  t = 2 / (2 + x)
  ty = 4 * t - 2

  for (; j > 0; j--) {
    tmp = d
    d = ty * d - dd + cof[j]
    dd = tmp
  }

  res = t * Math.exp(-x * x + 0.5 * (cof[0] + ty * d) - dd)
  return isneg ? res - 1 : 1 - res
}

export function erfc(x: number): number {
  return 1 - erf(x)
}

function erfcinv(p: number): number {
  let j = 0
  let x, err, t, pp
  if (p >= 2) {
    return -100
  }
  if (p <= 0) {
    return 100
  }
  pp = (p < 1) ? p : 2 - p
  t = Math.sqrt(-2 * Math.log(pp / 2))
  x = -0.70711 * ((2.30753 + t * 0.27061) /
    (1 + t * (0.99229 + t * 0.04481)) - t)
  for (; j < 2; j++) {
    err = erfc(x) - pp
    x += err / (1.12837916709551257 * Math.exp(-x * x) - x * err)
  }
  return (p < 1) ? x : -x
}

export const exponential = {
  pdf: (x: number, rate: number): number => {
    return x < 0 ? 0 : rate * Math.exp(-rate * x)
  },

  cdf: (x: number, rate: number): number => {
    return x < 0 ? 0 : 1 - Math.exp(-rate * x)
  },
}

export function gammafn(x: number): number {
  const p = [-1.716185138865495, 24.76565080557592, -379.80425647094563,
    629.3311553128184, 866.9662027904133, -31451.272968848367,
    -36144.413418691176, 66456.14382024054
  ]
  const q = [-30.8402300119739, 315.35062697960416, -1015.1563674902192,
    -3107.771671572311, 22538.118420980151, 4755.8462775278811,
    -134659.9598649693, -115132.2596755535]
  let fact: number | boolean = false
  let n = 0
  let xden = 0
  let xnum = 0
  let y = x
  let i, z, yi, res
  if (x > 171.6243769536076) {
    return Infinity
  }
  if (y <= 0) {
    res = y % 1
    if (res) {
      fact = (!(y & 1) ? 1 : -1) * Math.PI / Math.sin(Math.PI * res)
      y = 1 - y
    } else {
      return Infinity
    }
  }
  yi = y
  if (y < 1) {
    z = y++
  } else {
    z = (y -= n = (y | 0) - 1) - 1
  }
  for (i = 0; i < 8; ++i) {
    xnum = (xnum + p[i]) * z
    xden = xden * z + q[i]
  }
  res = xnum / xden + 1
  if (yi < y) {
    res /= yi
  } else if (yi > y) {
    for (i = 0; i < n; ++i) {
      res *= y
      y++
    }
  }
  if (fact) {
    res = fact / res
  }
  return res
}

export const gamma = {
  pdf: function pdf(x: number, shape: number, scale: number): number {
    if (x < 0) {
      return 0
    }
    return (x === 0 && shape === 1) ? 1 / scale :
      Math.exp((shape - 1) * Math.log(x) - x / scale -
        gammaln(shape) - shape * Math.log(scale))
  },

  cdf: function cdf(x: number, shape: number, scale: number): number {
    if (x < 0) {
      return 0
    }
    return lowRegGamma(shape, x / scale)
  },

  inv: function(p: number, shape: number, scale: number): number {
    return gammapinv(p, shape) * scale
  }
}

export function gammaln(x: number): number {
  let j = 0
  const cof = [
    76.18009172947146, -86.50532032941677, 24.01409824083091,
    -1.231739572450155, 0.1208650973866179e-2, -0.5395239384953e-5
  ]
  let ser = 1.000000000190015
  let xx, y, tmp
  tmp = (y = xx = x) + 5.5
  tmp -= (xx + 0.5) * Math.log(tmp)
  for (; j < 6; j++) {
    ser += cof[j] / ++y
  }
  return Math.log(2.5066282746310005 * ser / xx) - tmp
}

function lowRegGamma(a: number, x: number): number {
  const aln = gammaln(a)
  let ap = a
  let sum = 1 / a
  let del = sum
  let b = x + 1 - a
  let c = 1 / 1.0e-30
  let d = 1 / b
  let h = d
  let i = 1
  // calculate maximum number of itterations required for a
  const ITMAX = -~(Math.log((a >= 1) ? a : 1 / a) * 8.5 + a * 0.4 + 17)
  let an

  if (x < 0 || a <= 0) {
    return NaN
  } else if (x < a + 1) {
    for (; i <= ITMAX; i++) {
      sum += del *= x / ++ap
    }
    return (sum * Math.exp(-x + a * Math.log(x) - (aln)))
  }

  for (; i <= ITMAX; i++) {
    an = -i * (i - a)
    b += 2
    d = an * d + b
    c = b + an / c
    d = 1 / d
    h *= d * c
  }

  return (1 - h * Math.exp(-x + a * Math.log(x) - (aln)))
}

function gammapinv(p: number, a: number) {
  let j = 0
  const a1 = a - 1
  const EPS = 1e-8
  const gln = gammaln(a)
  let x, err, t, u, pp
  let lna1: number | undefined
  let afac: number | undefined

  if (p >= 1) {
    return Math.max(100, a + 100 * Math.sqrt(a))
  }
  if (p <= 0) {
    return 0
  }
  if (a > 1) {
    lna1 = Math.log(a1)
    afac = Math.exp(a1 * (lna1 - 1) - gln)
    pp = (p < 0.5) ? p : 1 - p
    t = Math.sqrt(-2 * Math.log(pp))
    x = (2.30753 + t * 0.27061) / (1 + t * (0.99229 + t * 0.04481)) - t
    if (p < 0.5) {
      x = -x
    }
    x = Math.max(1e-3,
      a * Math.pow(1 - 1 / (9 * a) - x / (3 * Math.sqrt(a)), 3))
  } else {
    t = 1 - a * (0.253 + a * 0.12)
    if (p < t) {
      x = Math.pow(p / t, 1 / a)
    } else {
      x = 1 - Math.log(1 - (p - t) / (1 - t))
    }
  }

  for (; j < 12; j++) {
    if (x <= 0) {
      return 0
    }
    err = lowRegGamma(a, x) - p
    if (a > 1) {
      t = afac! * Math.exp(-(x - a1) + a1 * (Math.log(x) - lna1!))
    } else {
      t = Math.exp(-x + a1 * Math.log(x) - gln)
    }
    u = err / t
    x -= (t = u / (1 - 0.5 * Math.min(1, u * ((a - 1) / x - 1))))
    if (x <= 0) {
      x = 0.5 * (x + t)
    }
    if (Math.abs(t) < EPS * x) {
      break
    }
  }

  return x
}

export const normal = {
  pdf: function pdf(x: number, mean: number, std: number) {
    return Math.exp(-0.5 * Math.log(2 * Math.PI) -
      Math.log(std) - Math.pow(x - mean, 2) / (2 * std * std))
  },

  cdf: function cdf(x: number, mean: number, std: number) {
    return 0.5 * (1 + erf((x - mean) / Math.sqrt(2 * std * std)))
  },

  inv: function(p: number, mean: number, std: number) {
    return -1.41421356237309505 * std * erfcinv(2 * p) + mean
  }
}

export const beta = {
  pdf: function pdf(x: number, alpha: number, beta: number) {
    // PDF is zero outside the support
    if (x > 1 || x < 0) {
      return 0
    }
    // PDF is one for the uniform case
    if (alpha == 1 && beta == 1) {
      return 1
    }

    if (alpha < 512 && beta < 512) {
      return (Math.pow(x, alpha - 1) * Math.pow(1 - x, beta - 1)) /
        betafn(alpha, beta)!
    } else {
      return Math.exp((alpha - 1) * Math.log(x) +
        (beta - 1) * Math.log(1 - x) -
        betaln(alpha, beta))
    }
  },

  cdf: function cdf(x: number, alpha: number, beta: number) {
    return (x > 1 || x < 0) ? +(x > 1) : ibeta(x, alpha, beta)
  },

  inv: function inv(x: number, alpha: number, beta: number) {
    return ibetainv(x, alpha, beta)
  },
}

function betafn(x: number, y: number) {
  // ensure arguments are positive
  if (x <= 0 || y <= 0) {
    return undefined
  }
  // make sure x + y doesn't exceed the upper limit of usable values
  return (x + y > 170)
    ? Math.exp(betaln(x, y))
    : gammafn(x) * gammafn(y) / gammafn(x + y)
}

function betaln(x: number, y: number) {
  return gammaln(x) + gammaln(y) - gammaln(x + y)
}

function ibetainv(p: number, a: number, b: number) {
  var EPS = 1e-8
  var a1 = a - 1
  var b1 = b - 1
  var j = 0
  var lna, lnb, pp, t, u, err, x, al, h, w, afac
  if (p <= 0) {
    return 0
  }
  if (p >= 1) {
    return 1
  }
  if (a >= 1 && b >= 1) {
    pp = (p < 0.5) ? p : 1 - p
    t = Math.sqrt(-2 * Math.log(pp))
    x = (2.30753 + t * 0.27061) / (1 + t * (0.99229 + t * 0.04481)) - t
    if (p < 0.5) {
      x = -x
    }
    al = (x * x - 3) / 6
    h = 2 / (1 / (2 * a - 1) + 1 / (2 * b - 1))
    w = (x * Math.sqrt(al + h) / h) - (1 / (2 * b - 1) - 1 / (2 * a - 1)) *
      (al + 5 / 6 - 2 / (3 * h))
    x = a / (a + b * Math.exp(2 * w))
  } else {
    lna = Math.log(a / (a + b))
    lnb = Math.log(b / (a + b))
    t = Math.exp(a * lna) / a
    u = Math.exp(b * lnb) / b
    w = t + u
    if (p < t / w) {
      x = Math.pow(a * w * p, 1 / a)
    } else {
      x = 1 - Math.pow(b * w * (1 - p), 1 / b)
    }
  }
  afac = -gammaln(a) - gammaln(b) + gammaln(a + b)
  for (; j < 10; j++) {
    if (x === 0 || x === 1) {
      return x
    }
    // @ts-ignore
    err = ibeta(x, a, b) - p
    t = Math.exp(a1 * Math.log(x) + b1 * Math.log(1 - x) + afac)
    u = err / t
    x -= (t = u / (1 - 0.5 * Math.min(1, u * (a1 / x - b1 / (1 - x)))))
    if (x <= 0) {
      x = 0.5 * (x + t)
    }
    if (x >= 1) {
      x = 0.5 * (x + t + 1)
    }
    if (Math.abs(t) < EPS * x && j > 0) {
      break
    }
  }
  return x
}

function ibeta(x: number, a: number, b: number) {
  // Factors in front of the continued fraction.
  var bt = (x === 0 || x === 1) ? 0 :
    Math.exp(gammaln(a + b) - gammaln(a) -
      gammaln(b) + a * Math.log(x) + b *
      Math.log(1 - x))
  if (x < 0 || x > 1) {
    return false
  }
  if (x < (a + 1) / (a + b + 2))
    // Use continued fraction directly.
  {
    return bt * betacf(x, a, b) / a
  }
  // else use continued fraction after making the symmetry transformation.
  return 1 - bt * betacf(1 - x, b, a) / b
}

function betacf(x: number, a: number, b: number) {
  var fpmin = 1e-30
  var m = 1
  var qab = a + b
  var qap = a + 1
  var qam = a - 1
  var c = 1
  var d = 1 - qab * x / qap
  var m2, aa, del, h

  // These q's will be used in factors that occur in the coefficients
  if (Math.abs(d) < fpmin) {
    d = fpmin
  }
  d = 1 / d
  h = d

  for (; m <= 100; m++) {
    m2 = 2 * m
    aa = m * (b - m) * x / ((qam + m2) * (a + m2))
    // One step (the even one) of the recurrence
    d = 1 + aa * d
    if (Math.abs(d) < fpmin) {
      d = fpmin
    }
    c = 1 + aa / c
    if (Math.abs(c) < fpmin) {
      c = fpmin
    }
    d = 1 / d
    h *= d * c
    aa = -(a + m) * (qab + m) * x / ((a + m2) * (qap + m2))
    // Next step of the recurrence (the odd one)
    d = 1 + aa * d
    if (Math.abs(d) < fpmin) {
      d = fpmin
    }
    c = 1 + aa / c
    if (Math.abs(c) < fpmin) {
      c = fpmin
    }
    d = 1 / d
    del = d * c
    h *= del
    if (Math.abs(del - 1.0) < 3e-7) {
      break
    }
  }

  return h
}

export const binomial = {
  pdf: function(k: number, n: number, p: number): number {
    return (p === 0 || p === 1) ?
      ((n * p) === k ? 1 : 0) :
      combination(n, k) * Math.pow(p, k) * Math.pow(1 - p, n - k)
  },

  cdf: function(x: number, n: number, p: number): number {
    var betacdf
    var eps = 1e-10

    if (x < 0) {
      return 0
    }
    if (x >= n) {
      return 1
    }
    if (p < 0 || p > 1 || n <= 0) {
      return NaN
    }

    x = Math.floor(x)
    var z = p
    var a = x + 1
    var b = n - x
    var s = a + b
    var bt = Math.exp(gammaln(s) - gammaln(b) -
      gammaln(a) + a * Math.log(z) + b * Math.log(1 - z))

    if (z < (a + 1) / (s + 2)) {
      betacdf = bt * betinc(z, a, b, eps)
    } else {
      betacdf = 1 - bt * betinc(1 - z, b, a, eps)
    }

    return Math.round((1 - betacdf) * (1 / eps)) / (1 / eps)
  }
}

function betinc(x: number, a: number, b: number, eps: number) {
  var a0 = 0
  var b0 = 1
  var a1 = 1
  var b1 = 1
  var m9 = 0
  var a2 = 0
  var c9

  while (Math.abs((a1 - a2) / a1) > eps) {
    a2 = a1
    c9 = -(a + m9) * (a + b + m9) * x / (a + 2 * m9) / (a + 2 * m9 + 1)
    a0 = a1 + c9 * a0
    b0 = b1 + c9 * b0
    m9 = m9 + 1
    c9 = m9 * (b - m9) * x / (a + 2 * m9 - 1) / (a + 2 * m9)
    a1 = a0 + c9 * a1
    b1 = b0 + c9 * b1
    a0 = a0 / b1
    b0 = b0 / b1
    a1 = a1 / b1
    b1 = 1
  }

  return a1 / a
}

function combination(n: number, m: number) {
  // make sure n or m don't exceed the upper limit of usable values
  return (n > 170 || m > 170)
    ? Math.exp(combinationln(n, m))
    : (factorial(n) / factorial(m)) / factorial(n - m)
}

function combinationln(n: number, m: number) {
  return factorialln(n) - factorialln(m) - factorialln(n - m)
}

// natural log factorial of n
export function factorialln(n: number) {
  return n < 0 ? NaN : gammaln(n + 1)
}

// factorial of n
export function factorial(n: number) {
  return n < 0 ? NaN : gammafn(n + 1)
}

export const chisquare = {
  pdf: function pdf(x: number, dof: number) {
    if (x < 0) {
      return 0
    }
    return (x === 0 && dof === 2) ? 0.5 :
      Math.exp((dof / 2 - 1) * Math.log(x) - x / 2 - (dof / 2) *
        Math.log(2) - gammaln(dof / 2))
  },

  cdf: function cdf(x: number, dof: number) {
    if (x < 0) {
      return 0
    }
    return lowRegGamma(dof / 2, x / 2)
  },

  inv: function(p: number, dof: number) {
    return 2 * gammapinv(p, 0.5 * dof)
  }
}

export const centralF = {
  // This implementation of the pdf function avoids float overflow
  // See the way that R calculates this value:
  // https://svn.r-project.org/R/trunk/src/nmath/df.c
  pdf: function pdf(x: number, df1: number, df2: number) {
    var p, q, f

    if (x < 0) {
      return 0
    }

    if (df1 <= 2) {
      if (x === 0 && df1 < 2) {
        return Infinity
      }
      if (x === 0 && df1 === 2) {
        return 1
      }
      return (1 / betafn(df1 / 2, df2 / 2)!) *
        Math.pow(df1 / df2, df1 / 2) *
        Math.pow(x, (df1 / 2) - 1) *
        Math.pow((1 + (df1 / df2) * x), -(df1 + df2) / 2)
    }

    p = (df1 * x) / (df2 + x * df1)
    q = df2 / (df2 + x * df1)
    f = df1 * q / 2.0
    return f * binomial.pdf((df1 - 2) / 2, (df1 + df2 - 2) / 2, p)
  },

  cdf: function cdf(x: number, df1: number, df2: number): number {
    if (x < 0) {
      return 0
    }
    return <number> ibeta((df1 * x) / (df1 * x + df2), df1 / 2, df2 / 2)
  },

  inv: function inv(x: number, df1: number, df2: number) {
    return df2 / (df1 * (1 / ibetainv(x, df1 / 2, df2 / 2) - 1))
  },
}

export const weibull = {
  pdf: function pdf(x: number, scale: number, shape: number) {
    if (x < 0 || scale < 0 || shape < 0) {
      return 0
    }
    return (shape / scale) * Math.pow((x / scale), (shape - 1)) *
      Math.exp(-(Math.pow((x / scale), shape)))
  },

  cdf: function cdf(x: number, scale: number, shape: number) {
    return x < 0 ? 0 : 1 - Math.exp(-Math.pow((x / scale), shape))
  },
}

export const poisson = {
  pdf: function pdf(k: number, l: number) {
    if (l < 0 || (k % 1) !== 0 || k < 0) {
      return 0
    }

    return Math.pow(l, k) * Math.exp(-l) / factorial(k)
  },

  cdf: function cdf(x: number, l: number) {
    var k = 0
    if (x < 0) {
      return 0
    }
    var sum = 0
    for (; k <= x; k++) {
      sum += poisson.pdf(k, l)
    }
    return sum
  },
}

export const hypgeom = {
  pdf: function pdf(k: number, N: number, m: number, n: number): number {
    // Hypergeometric PDF.

    // A simplification of the CDF algorithm below.

    // k = number of successes drawn
    // N = population size
    // m = number of successes in population
    // n = number of items drawn from population

    // if(k !== k | 0) {
    //   return false;
    // } else
    if (k < 0 || k < m - (N - n)) {
      // It's impossible to have this few successes drawn.
      return 0
    } else if (k > n || k > m) {
      // It's impossible to have this many successes drawn.
      return 0
    } else if (m * 2 > N) {
      // More than half the population is successes.

      if (n * 2 > N) {
        // More than half the population is sampled.

        return hypgeom.pdf(N - m - n + k, N, N - m, N - n)
      } else {
        // Half or less of the population is sampled.

        return hypgeom.pdf(n - k, N, N - m, n)
      }

    } else if (n * 2 > N) {
      // Half or less is successes.

      return hypgeom.pdf(m - k, N, m, N - n)

    } else if (m < n) {
      // We want to have the number of things sampled to be less than the
      // successes available. So swap the definitions of successful and sampled.
      return hypgeom.pdf(k, N, n, m)
    } else {
      // If we get here, half or less of the population was sampled, half or
      // less of it was successes, and we had fewer sampled things than
      // successes. Now we can do this complicated iterative algorithm in an
      // efficient way.

      // The basic premise of the algorithm is that we partially normalize our
      // intermediate product to keep it in a numerically good region, and then
      // finish the normalization at the end.

      // This variable holds the scaled probability of the current number of
      // successes.
      var scaledPDF = 1

      // This keeps track of how much we have normalized.
      var samplesDone = 0

      for (var i = 0; i < k; i++) {
        // For every possible number of successes up to that observed...

        while (scaledPDF > 1 && samplesDone < n) {
          // Intermediate result is growing too big. Apply some of the
          // normalization to shrink everything.

          scaledPDF *= 1 - (m / (N - samplesDone))

          // Say we've normalized by this sample already.
          samplesDone++
        }

        // Work out the partially-normalized hypergeometric PDF for the next
        // number of successes
        scaledPDF *= (n - i) * (m - i) / ((i + 1) * (N - m - n + i + 1))
      }

      for (; samplesDone < n; samplesDone++) {
        // Apply all the rest of the normalization
        scaledPDF *= 1 - (m / (N - samplesDone))
      }

      // Bound answer sanely before returning.
      return Math.min(1, Math.max(0, scaledPDF))
    }
  },

  cdf: function cdf(x: number, N: number, m: number, n: number): number {
    // Hypergeometric CDF.

    // This algorithm is due to Prof. Thomas S. Ferguson, <tom@math.ucla.edu>,
    // and comes from his hypergeometric test calculator at
    // <http://www.math.ucla.edu/~tom/distributions/Hypergeometric.html>.

    // x = number of successes drawn
    // N = population size
    // m = number of successes in population
    // n = number of items drawn from population

    if (x < 0 || x < m - (N - n)) {
      // It's impossible to have this few successes drawn or fewer.
      return 0
    } else if (x >= n || x >= m) {
      // We will always have this many successes or fewer.
      return 1
    } else if (m * 2 > N) {
      // More than half the population is successes.

      if (n * 2 > N) {
        // More than half the population is sampled.

        return cdf(N - m - n + x, N, N - m, N - n)
      } else {
        // Half or less of the population is sampled.

        return 1 - hypgeom.cdf(n - x - 1, N, N - m, n)
      }

    } else if (n * 2 > N) {
      // Half or less is successes.

      return 1 - hypgeom.cdf(m - x - 1, N, m, N - n)

    } else if (m < n) {
      // We want to have the number of things sampled to be less than the
      // successes available. So swap the definitions of successful and sampled.
      return hypgeom.cdf(x, N, n, m)
    } else {
      // If we get here, half or less of the population was sampled, half or
      // less of it was successes, and we had fewer sampled things than
      // successes. Now we can do this complicated iterative algorithm in an
      // efficient way.

      // The basic premise of the algorithm is that we partially normalize our
      // intermediate sum to keep it in a numerically good region, and then
      // finish the normalization at the end.

      // Holds the intermediate, scaled total CDF.
      var scaledCDF = 1

      // This variable holds the scaled probability of the current number of
      // successes.
      var scaledPDF = 1

      // This keeps track of how much we have normalized.
      var samplesDone = 0

      for (var i = 0; i < x; i++) {
        // For every possible number of successes up to that observed...

        while (scaledCDF > 1 && samplesDone < n) {
          // Intermediate result is growing too big. Apply some of the
          // normalization to shrink everything.

          var factor = 1 - (m / (N - samplesDone))

          scaledPDF *= factor
          scaledCDF *= factor

          // Say we've normalized by this sample already.
          samplesDone++
        }

        // Work out the partially-normalized hypergeometric PDF for the next
        // number of successes
        scaledPDF *= (n - i) * (m - i) / ((i + 1) * (N - m - n + i + 1))

        // Add to the CDF answer.
        scaledCDF += scaledPDF
      }

      for (; samplesDone < n; samplesDone++) {
        // Apply all the rest of the normalization
        scaledCDF *= 1 - (m / (N - samplesDone))
      }

      // Bound answer sanely before returning.
      return Math.min(1, Math.max(0, scaledCDF))
    }
  }
}

export const studentt = {
  pdf: function pdf(x: number, dof: number) {
    dof = dof > 1e100 ? 1e100 : dof
    return (1 / (Math.sqrt(dof) * betafn(0.5, dof / 2)!)) *
      Math.pow(1 + ((x * x) / dof), -((dof + 1) / 2))
  },

  cdf: function cdf(x: number, dof: number): number {
    var dof2 = dof / 2
    return <number> ibeta((x + Math.sqrt(x * x + dof)) /
      (2 * Math.sqrt(x * x + dof)), dof2, dof2)
  },

  inv: function(p: number, dof: number) {
    var x = ibetainv(2 * Math.min(p, 1 - p), 0.5 * dof, 0.5)
    x = Math.sqrt(dof * (1 - x) / x)
    return (p > 0.5) ? x : -x
  },
}

export const lognormal = {
  pdf: function pdf(x: number, mu: number, sigma: number) {
    if (x <= 0) {
      return 0
    }
    return Math.exp(-Math.log(x) - 0.5 * Math.log(2 * Math.PI) -
      Math.log(sigma) - Math.pow(Math.log(x) - mu, 2) /
      (2 * sigma * sigma))
  },

  cdf: function cdf(x: number, mu: number, sigma: number) {
    if (x < 0) {
      return 0
    }
    return 0.5 +
      (0.5 * erf((Math.log(x) - mu) / Math.sqrt(2 * sigma * sigma)))
  },

  inv: function(p: number, mu: number, sigma: number) {
    return Math.exp(-1.41421356237309505 * sigma * erfcinv(2 * p) + mu)
  },
}

export const negbin = {
  pdf: function pdf(k: number, r: number, p: number) {
    if (k !== k >>> 0) {
      return false
    }
    if (k < 0) {
      return 0
    }
    return combination(k + r - 1, r - 1) *
      Math.pow(1 - p, k) * Math.pow(p, r)
  },

  cdf: function cdf(x: number, r: number, p: number) {
    var sum = 0,
      k = 0
    if (x < 0) {
      return 0
    }
    for (; k <= x; k++) {
      sum += <number> negbin.pdf(k, r, p)
    }
    return sum
  }
}

function sum(arr: number[]): number {
  var sum = 0
  var i = arr.length
  while (--i >= 0) {
    sum += arr[i]
  }
  return sum
}

export function mean(arr: number[]): number {
  return sum(arr) / arr.length
}

export function sumsqerr(arr: number[]): number {
  var meanv = mean(arr)
  var sum = 0
  var i = arr.length
  var tmp
  while (--i >= 0) {
    tmp = arr[i] - meanv
    sum += tmp * tmp
  }
  return sum
}

export function variance(arr: number[], flag: any) {
  return sumsqerr(arr) / (arr.length - (flag ? 1 : 0))
}

export function stdev(arr: number[], flag: any) {
  return Math.sqrt(variance(arr, flag))
}

// 2 different parameter setups
// (value, alpha, sd, n)
// (value, alpha, array)
export function normalci() {
  var args = [].slice.call(arguments),
    ans = new Array(2),
    change
  if (args.length === 4) {
    change = Math.abs(normal.inv(args[1] / 2, 0, 1) *
      args[2] / Math.sqrt(args[3]))
  } else {
    // @ts-ignore
    change = Math.abs(normal.inv(args[1] / 2, 0, 1) * stdev(args[2]) / Math.sqrt(args[2].length))
  }
  ans[0] = args[0] - change
  ans[1] = args[0] + change
  return ans
}

export function tci() {
  var args = [].slice.call(arguments),
    ans = new Array(2),
    change
  if (args.length === 4) {
    change = Math.abs(studentt.inv(args[1] / 2, args[3] - 1) *
      args[2] / Math.sqrt(args[3]))
  } else {
    // @ts-ignore
    change = Math.abs(studentt.inv(args[1] / 2, args[2].length - 1) * stdev(args[2], true) / Math.sqrt(args[2].length))
  }
  ans[0] = args[0] - change
  ans[1] = args[0] + change
  return ans
}

function product(arr: number[]): number {
  var prod = 1
  var i = arr.length
  while (--i >= 0) {
    prod *= arr[i]
  }
  return prod
}

export function geomean(arr: number[]): number {
  return Math.pow(product(arr), 1 / arr.length)
}

export function covariance(arr1: number[], arr2: number[]): number {
  var u = mean(arr1)
  var v = mean(arr2)
  var arr1Len = arr1.length
  var sq_dev = new Array(arr1Len)
  var i

  for (i = 0; i < arr1Len; i++) {
    sq_dev[i] = (arr1[i] - u) * (arr2[i] - v)
  }

  return sum(sq_dev) / (arr1Len - 1)
}

export function corrcoeff(arr1: number[], arr2: number[]): number {
  return covariance(arr1, arr2) /
    stdev(arr1, 1) /
    stdev(arr2, 1)
}
