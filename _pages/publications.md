---
layout: page
permalink: /publications/
title: publications
title_zh: 论文
description: <span class="en">Grouped by research theme; within each theme reverse-chronological.</span><span class="zh">按主题分组，组内按时间倒序。</span>
nav: true
nav_order: 2
---

<!-- _pages/publications.md -->

{% include bib_search.liquid %}

<div class="publications">

<h2 class="year">
  <span class="en">ML samplers & Boltzmann distributions</span>
  <span class="zh">机器学习采样与玻尔兹曼分布</span>
</h2>

{% bibliography -f papers -q @*[topic=ml_boltzmann] %}

<h2 class="year">
  <span class="en">Mechanistic interpretability</span>
  <span class="zh">可解释性的一种</span>
</h2>

{% bibliography -f papers -q @*[topic=network_analysis] %}

<h2 class="year">
  <span class="en">General relativity</span>
  <span class="zh">广义相对论</span>
</h2>

{% bibliography -f papers -q @*[topic=general_relativity] %}

</div>

<!--
  Hidden sections — un-comment a block when it has at least one paper:

  <h2 class="year">
    <span lang="en">Agent workflows</span>
    <span lang="zh" hidden>Agent 工作流</span>
  </h2>
  {% bibliography -f papers -q @*[topic=agent_workflow] %}

  <h2 class="year">
    <span lang="en">Base / foundation models</span>
    <span lang="zh" hidden>基础模型</span>
  </h2>
  {% bibliography -f papers -q @*[topic=base_model] %}

  <h2 class="year">
    <span lang="en">Bayesian neural networks</span>
    <span lang="zh" hidden>贝叶斯神经网络</span>
  </h2>
  {% bibliography -f papers -q @*[topic=bayesian_nn] %}

  <h2 class="year">
    <span lang="en">Real-time evolution</span>
    <span lang="zh" hidden>实时演化</span>
  </h2>
  {% bibliography -f papers -q @*[topic=realtime] %}
-->
