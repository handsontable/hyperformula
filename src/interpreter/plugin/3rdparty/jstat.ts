/* eslint-disable */
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

  if(x===0) {
    return 0
  }
  if (x < 0) {
    x = -x
    isneg = true
  }

  t = 2 / (2 + x)
  ty = 4 * t - 2

  for(; j > 0; j--) {
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
  if (p >= 2)
    return -100
  if (p <= 0)
    return 100
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
  let fact: number | boolean  = false
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
    if (x < 0)
      return 0
    return (x === 0 && shape === 1) ? 1 / scale :
      Math.exp((shape - 1) * Math.log(x) - x / scale -
        gammaln(shape) - shape * Math.log(scale))
  },

  cdf: function cdf(x: number, shape: number, scale: number): number {
    if (x < 0)
      return 0
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
  for (; j < 6; j++)
    ser += cof[j] / ++y
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

  if (p >= 1)
    return Math.max(100, a + 100 * Math.sqrt(a))
  if (p <= 0)
    return 0
  if (a > 1) {
    lna1 = Math.log(a1)
    afac = Math.exp(a1 * (lna1 - 1) - gln)
    pp = (p < 0.5) ? p : 1 - p
    t = Math.sqrt(-2 * Math.log(pp))
    x = (2.30753 + t * 0.27061) / (1 + t * (0.99229 + t * 0.04481)) - t
    if (p < 0.5)
      x = -x
    x = Math.max(1e-3,
      a * Math.pow(1 - 1 / (9 * a) - x / (3 * Math.sqrt(a)), 3))
  } else {
    t = 1 - a * (0.253 + a * 0.12)
    if (p < t)
      x = Math.pow(p / t, 1 / a)
    else
      x = 1 - Math.log(1 - (p - t) / (1 - t))
  }

  for(; j < 12; j++) {
    if (x <= 0)
      return 0
    err = lowRegGamma(a, x) - p
    if (a > 1)
      t = afac! * Math.exp(-(x - a1) + a1 * (Math.log(x) - lna1!))
    else
      t = Math.exp(-x + a1 * Math.log(x) - gln)
    u = err / t
    x -= (t = u / (1 - 0.5 * Math.min(1, u * ((a - 1) / x - 1))))
    if (x <= 0)
      x = 0.5 * (x + t)
    if (Math.abs(t) < EPS * x)
      break
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
