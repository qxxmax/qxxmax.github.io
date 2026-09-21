---
layout: page
permalink: /research-tools/
title: research tools
title_zh: 研究工具
description: <span class="en">Auditable AI-assisted literature research.</span><span class="zh">可审计的 AI 文献调研流程。</span>
nav: true
nav_order: 3
background_class: page-bg-kaoruhana
---

<div class="en" markdown="1">

## play-the-toy-with-children

A literature-research workflow. One verbal clue becomes an auditable package: paper identities, reading notes, citation lineage, claim boundaries, and a stop decision.

`verbal clue -> candidate pool -> source-link audit -> C0-C4 -> lineage -> gap ledger -> report`

[GitHub](https://github.com/qxxmax/skillforpaper) · [overview (PDF)](/assets/pdf/play-the-toy-part1-literature-research-en.pdf)

<p style="text-align: center;"><a href="/assets/pdf/play-the-toy-part1-literature-research-en.pdf"><img src="/assets/img/research-tools/part1-en.png" alt="Part 1 literature-research overview" style="width: 100%; max-width: 520px;"></a></p>

```text
Use $play-the-toy-with-children for literature research.
Topic: [paper, field, or verbal clue]
intent_mode.primary=cover
scan_level=full
token_policy=balanced
screenshot_policy=key-only
```

For a citation graph or search-strategy audit, add `graph_mode=on` and `optimizer=dijkstra`. The Dijkstra path is navigation, not evidence.

[中文简介](/assets/pdf/play-the-toy-part1-literature-research.pdf)

</div>

<div class="zh" markdown="1">

## play-the-toy-with-children

一套文献调研流程。一句口头线索整理成可复查的包：论文身份、阅读记录、引用谱系、结论边界，以及何时停。

`口头线索 -> 候选池 -> source-link audit -> C0-C4 -> 谱系 -> gap ledger -> report`

[GitHub](https://github.com/qxxmax/skillforpaper) · [简介（PDF）](/assets/pdf/play-the-toy-part1-literature-research.pdf)

<p style="text-align: center;"><a href="/assets/pdf/play-the-toy-part1-literature-research.pdf"><img src="/assets/img/research-tools/part1-zh.png" alt="Part 1 文献调研简介" style="width: 100%; max-width: 520px;"></a></p>

```text
Use $play-the-toy-with-children 做文献调研。
口头线索：[论文、领域或一句问题]
intent_mode.primary=cover
scan_level=full
token_policy=balanced
screenshot_policy=key-only
```

需要引用图或搜索策略审计时，加上 `graph_mode=on` 和 `optimizer=dijkstra`。Dijkstra 路径只是导航，不是证据。

[English overview](/assets/pdf/play-the-toy-part1-literature-research-en.pdf)

</div>
