---
layout: page
permalink: /publications/
title: publications
description: Grouped by research theme; within each theme reverse-chronological. 按主题分组，组内按时间倒序。
nav: true
nav_order: 2
---

<!-- _pages/publications.md -->

{% include bib_search.liquid %}

<div class="publications">

<h2 class="year">
  <span lang="en">ML samplers & Boltzmann distributions</span>
  <span lang="zh" hidden>机器学习采样与玻尔兹曼分布</span>
</h2>

{% bibliography -f papers -q @*[topic=ml_boltzmann] %}

<h2 class="year">
  <span lang="en">Agent workflows</span>
  <span lang="zh" hidden>Agent 工作流</span>
</h2>

{% bibliography -f papers -q @*[topic=agent_workflow] %}

{% assign agent_papers = site.data.papers | where: "topic", "agent_workflow" %}
<p class="text-muted" id="agent_workflow_empty"><em lang="en">In preparation — preprints coming soon.</em><em lang="zh" hidden>预印本筹备中。</em></p>

<h2 class="year">
  <span lang="en">Base / foundation models</span>
  <span lang="zh" hidden>基础模型</span>
</h2>

{% bibliography -f papers -q @*[topic=base_model] %}

<p class="text-muted" id="base_model_empty"><em lang="en">In preparation — preprints coming soon.</em><em lang="zh" hidden>预印本筹备中。</em></p>

<h2 class="year">
  <span lang="en">Bayesian neural networks</span>
  <span lang="zh" hidden>贝叶斯神经网络</span>
</h2>

{% bibliography -f papers -q @*[topic=bayesian_nn] %}

<p class="text-muted" id="bayesian_nn_empty"><em lang="en">In preparation — preprints coming soon.</em><em lang="zh" hidden>预印本筹备中。</em></p>

<h2 class="year">
  <span lang="en">Real-time evolution</span>
  <span lang="zh" hidden>实时演化</span>
</h2>

{% bibliography -f papers -q @*[topic=realtime] %}

<p class="text-muted" id="realtime_empty"><em lang="en">In preparation — preprints coming soon.</em><em lang="zh" hidden>预印本筹备中。</em></p>

<h2 class="year">
  <span lang="en">Other</span>
  <span lang="zh" hidden>其它</span>
</h2>

{% bibliography -f papers -q @*[topic=other] %}

</div>

<script>
(function () {
  // Hide the "coming soon" placeholder when the preceding {% bibliography %} block
  // actually emitted any entries (jekyll-scholar renders <ol class="bibliography">).
  ['agent_workflow', 'base_model', 'bayesian_nn', 'realtime'].forEach(function (id) {
    var el = document.getElementById(id + '_empty');
    if (!el) return;
    var prev = el.previousElementSibling;
    while (prev && prev.nodeType === 3) prev = prev.previousElementSibling;
    if (prev && prev.matches && prev.matches('ol.bibliography')) {
      el.style.display = 'none';
    }
  });
})();
</script>
