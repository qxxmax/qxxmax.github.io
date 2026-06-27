---
title: "Normalizing flows for lattice field theory — reading map"
title_zh: "Normalizing flow 用于格点场论 —— 阅读地图"
date: 2026-06-25
topic: ml-physics
description: <span class="en">A personal reading list / road map for normalizing-flow samplers on the lattice, with short comments on each entry.</span><span class="zh">个人在整理的 normalizing flow 格点采样阅读清单，每条都附带一两句自己的看法。</span>
---

<div class="en" markdown="1">

This page is meant to grow over time — it tracks what I've actually read versus
what I've only skimmed, and which papers I'd recommend to someone starting out.

## Core papers

- **Albergo, Kanwar, Shanahan (2019)** — first normalizing-flow sampler for
  lattice $\phi^4$; the cleanest starting point.
- **Kanwar et al. (2020)** — gauge-equivariant flows for $U(1)$ and $SU(N)$.
- **Boyda et al. (2021)** — non-trivial group manifolds; introduces matrix-valued
  coupling layers.

## Tutorials & code

- I'll add links here as I clean up my own training scripts.

## Things I'm tracking

- How autocorrelation behavior scales with lattice size near criticality.
- Whether you can usefully share flow parameters across different bare couplings.

</div>

<div class="zh" markdown="1">

这一页会慢慢长大。我用来记自己实际读过 vs. 只是扫过的论文，以及推荐给入门者的清单。

## 核心论文

- **Albergo, Kanwar, Shanahan (2019)** —— 第一次把 normalizing flow
  用到格点 $\phi^4$ 抽样，最适合做起点。
- **Kanwar et al. (2020)** —— $U(1)$ 与 $SU(N)$ 上的 gauge-equivariant flow。
- **Boyda et al. (2021)** —— 推广到非平凡群流形，引入矩阵值的 coupling layer。

## 教程与代码

- 等我把自己的训练脚本整理干净之后会陆续放链接。

## 自己在追踪的问题

- 临界点附近，自相关时间随格点尺寸怎么 scale。
- 不同 bare coupling 下，flow 参数能不能共享/迁移。

</div>
