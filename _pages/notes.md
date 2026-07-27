---
layout: page
permalink: /notes/
title: lecture notes
title_zh: 讲义笔记
description: <span class="en">Self-study notes — mostly on lattice field theory and machine learning for physics. Living documents; expect typos and revisions.</span><span class="zh">自学笔记，主要围绕格点场论与「用机器学习做物理」。处于持续整理中，可能有错漏，会陆续修订。</span>
nav: true
nav_order: 5
background_class: page-bg-charlotte
---

<!-- _pages/notes.md -->

{% assign notes_sorted = site.notes | sort: 'date' | reverse %}

{% assign topics = "lattice|ml-physics|misc" | split: "|" %}

{% for topic in topics %}
  {% assign group = notes_sorted | where: 'topic', topic %}
  {% if group.size > 0 %}
    {% case topic %}
      {% when 'lattice' %}
        {% assign topic_en = "Lattice field theory & lattice QCD" %}
        {% assign topic_zh = "格点场论与格点 QCD" %}
      {% when 'ml-physics' %}
        {% assign topic_en = "Machine learning for physics" %}
        {% assign topic_zh = "用机器学习做物理" %}
      {% else %}
        {% assign topic_en = "Miscellaneous" %}
        {% assign topic_zh = "其他" %}
    {% endcase %}

<h2 class="year">
  <span class="en">{{ topic_en }}</span>
  <span class="zh">{{ topic_zh }}</span>
</h2>

<ul class="post-list">
{% for note in group %}
  <li>
    <h3>
      {% if note.external_pdf %}
        <a href="{{ note.external_pdf }}" rel="external nofollow noopener" target="_blank">
      {% else %}
        <a href="{{ note.url | relative_url }}">
      {% endif %}
        <span class="en">{{ note.title }}</span>{% if note.title_zh %}<span class="zh">{{ note.title_zh }}</span>{% else %}<span class="zh">{{ note.title }}</span>{% endif %}
      </a>
      {% if note.external_pdf %}
        <small>
          <span class="en">[PDF]</span><span class="zh">[PDF]</span>
        </small>
      {% endif %}
    </h3>
    <p class="post-meta">
      <span class="en">{{ note.date | date: '%b %d, %Y' }}</span><span class="zh">{{ note.date | date: '%Y 年 %-m 月 %-d 日' }}</span>
    </p>
    {% if note.description %}
      <p>{{ note.description }}</p>
    {% endif %}
  </li>
{% endfor %}
</ul>

  {% endif %}
{% endfor %}

{% if notes_sorted.size == 0 %}
<p>
  <span class="en">No notes yet — come back soon.</span>
  <span class="zh">暂时还没有笔记，过段时间再来。</span>
</p>
{% endif %}
