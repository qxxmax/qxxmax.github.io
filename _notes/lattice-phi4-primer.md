---
title: "A short primer on scalar lattice φ⁴ theory"
title_zh: "标量 φ⁴ 格点场论小笔记"
date: 2026-06-20
topic: lattice
description: <span class="en">Action, lattice discretization, and the role of the bare mass in 2D φ⁴ — written while preparing my own implementation of a Monte Carlo sampler.</span><span class="zh">动作量、格点离散化与裸质量在二维 φ⁴ 中的角色 —— 自己实现 Monte Carlo 采样时顺手整理的笔记。</span>
---

<!--
  Math conventions in this site:
    * Display math: $$ ... $$  (Kramdown-safe; MathJax renders as block)
    * Inline math:  $...$       (escape underscores as \_ so Kramdown
                                 does not treat them as italic markers)
-->

<div class="en" markdown="1">

> Status: rough first draft, mostly meant as a personal reference.

## Continuum action

The Euclidean action of a real scalar field in two dimensions is

$$
S[\phi] = \int d^2x \left[ \tfrac{1}{2} (\partial_\mu \phi)^2 + \tfrac{1}{2} m_0^2 \phi^2 + \tfrac{\lambda}{4!} \phi^4 \right].
$$

## Lattice discretization

On an $L \times L$ lattice with spacing $a$, write $x = a\,n$ for $n \in \mathbb{Z}\_L^2$, and let $\hat\phi\_n = a\,\phi(an)$. After the usual finite-difference replacement
$\partial\_\mu \phi(x) \to (\hat\phi\_{n+\hat\mu} - \hat\phi\_n)/a$, the action becomes

$$
S = \sum_n \left[ -2\kappa \sum_\mu \hat\phi_n \hat\phi_{n+\hat\mu}
      + \hat\phi_n^2 + \lambda_L (\hat\phi_n^2 - 1)^2 \right],
$$

with the standard hopping parameter $\kappa$ and dimensionless coupling $\lambda\_L$.

## Notes to self

- The pseudo-critical line in $(\kappa, \lambda\_L)$ is what I usually run autocorrelation studies on.
- Mind the sign convention for $m\_0^2$ when comparing to other people's code.
- For sanity checks, the free theory ($\lambda\_L = 0$) gives an exact propagator that I should always reproduce before training anything.

</div>

<div class="zh" markdown="1">

> 状态：初稿，先作为自己的参考用。

## 连续作用量

二维欧氏度规下，单个实标量场的作用量写作

$$
S[\phi] = \int d^2x \left[ \tfrac{1}{2} (\partial_\mu \phi)^2 + \tfrac{1}{2} m_0^2 \phi^2 + \tfrac{\lambda}{4!} \phi^4 \right].
$$

## 格点离散

在 $L \times L$ 的格点上、格距 $a$，记 $x = a\,n$（$n \in \mathbb{Z}\_L^2$），$\hat\phi\_n = a\,\phi(an)$。把导数项替换为有限差分
$\partial\_\mu \phi(x) \to (\hat\phi\_{n+\hat\mu} - \hat\phi\_n)/a$ 之后，作用量化为

$$
S = \sum_n \left[ -2\kappa \sum_\mu \hat\phi_n \hat\phi_{n+\hat\mu}
      + \hat\phi_n^2 + \lambda_L (\hat\phi_n^2 - 1)^2 \right],
$$

其中 $\kappa$ 是惯用的 hopping 参数，$\lambda\_L$ 是无量纲耦合。

## 几条自己留的提醒

- 自相关时间的研究我一般沿 $(\kappa, \lambda\_L)$ 平面的 pseudo-critical 线扫。
- 跟别人代码对比时注意 $m\_0^2$ 的符号约定。
- 自由理论 ($\lambda\_L = 0$) 有解析的传播子，训练任何东西之前先把这个 sanity check 跑过。

</div>
