---
layout: page
permalink: /research-tools/
title: research tools
title_zh: 研究工具
description: <span class="en">Auditable AI-assisted workflows for research.</span><span class="zh">可审计的 AI 科研协作流程。</span>
nav: true
nav_order: 3
---

<div class="en" markdown="1">

## play-the-toy-with-children

A six-part workflow for working with AI from literature research to project execution, proposal writing, publication, and presentations. **Part 1 is complete and public; Parts 2-6 are the development roadmap.**

### Part 1: literature research

The workflow turns a verbal clue into an auditable research package:

`verbal clue -> candidate pool -> source-link audit -> C0-C4 -> lineage -> gap ledger -> report`

It records source-linked paper identities, full-text reading notes, literature matrices, citation lineages, claim boundaries, open questions, and the stopping decision for each search round.

[GitHub repository](https://github.com/qxxmax/skillforpaper) · [Part 1 overview (PDF)](/assets/pdf/play-the-toy-part1-literature-research-en.pdf) · [Six-part roadmap (PDF)](/assets/pdf/play-the-toy-six-part-roadmap-en.pdf)

<p style="text-align: center;"><a href="/assets/pdf/play-the-toy-part1-literature-research-en.pdf"><img src="/assets/img/research-tools/part1-en.png" alt="English Part 1 literature-research overview" style="width: 100%; max-width: 520px;"></a></p>

### Invoke

```text
Use $play-the-toy-with-children.
intent=cover, scan=full, graph_mode=on, optimizer=dijkstra.
Return to the original sources in every round and preserve sources,
boundaries, and open questions.
```

Chinese versions: [Part 1 overview](/assets/pdf/play-the-toy-part1-literature-research.pdf) · [Six-part roadmap](/assets/pdf/play-the-toy-six-part-roadmap.pdf)

</div>

<div class="zh" markdown="1">

## play-the-toy-with-children

一套从文献调研、研究执行、proposal、论文与代码交付，到 slides 的六部分 AI 科研协作流程。**Part 1 已完成并公开；Parts 2-6 是后续开发路线。**

### Part 1：文献调研

它把一句口头线索整理成可复查的调研包：

`口头线索 -> 候选池 -> source-link audit -> C0-C4 -> 谱系 -> gap ledger -> report`

过程中保留论文身份、全文阅读记录、文献表、引用谱系、结论边界、待确认问题，以及每轮搜索的停止判断。

[GitHub 仓库](https://github.com/qxxmax/skillforpaper) · [Part 1 简介（PDF）](/assets/pdf/play-the-toy-part1-literature-research.pdf) · [六个 Part 路线图（PDF）](/assets/pdf/play-the-toy-six-part-roadmap.pdf)

<p style="text-align: center;"><a href="/assets/pdf/play-the-toy-part1-literature-research.pdf"><img src="/assets/img/research-tools/part1-zh.png" alt="Part 1 文献调研简介" style="width: 100%; max-width: 520px;"></a></p>

### 调用

```text
Use $play-the-toy-with-children.
intent=cover, scan=full, graph_mode=on, optimizer=dijkstra.
每轮回到原文核查，并保留来源、边界与待确认问题。
```

英文版本：[Part 1 overview](/assets/pdf/play-the-toy-part1-literature-research-en.pdf) · [Six-part roadmap](/assets/pdf/play-the-toy-six-part-roadmap-en.pdf)

</div>
