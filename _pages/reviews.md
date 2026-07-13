---
layout: page
permalink: /reviews/
title: revision notes
title_zh: 复习讲义
description: <span class="en">AI-drafted revision handouts — condensed summaries for exam prep, mostly PDFs. Empty for now; entries will be added over time.</span><span class="zh">由 AI 起草的复习讲义，主要用于考试复习的浓缩总结，多为 PDF。目前还是空的，之后会陆续加内容。</span>
nav: true
nav_order: 6
---

<!-- _pages/reviews.md -->

{% assign reviews_sorted = site.reviews | sort: 'date' | reverse %}

<ul class="post-list">
{% for review in reviews_sorted %}
  <li>
    <h3>
      {% if review.external_pdf %}
        <a href="{{ review.external_pdf }}" rel="external nofollow noopener" target="_blank">
      {% else %}
        <a href="{{ review.url | relative_url }}">
      {% endif %}
        <span class="en">{{ review.title }}</span>{% if review.title_zh %}<span class="zh">{{ review.title_zh }}</span>{% else %}<span class="zh">{{ review.title }}</span>{% endif %}
      </a>
      {% if review.external_pdf %}
        <small>
          <span class="en">[PDF]</span><span class="zh">[PDF]</span>
        </small>
      {% endif %}
    </h3>
    <p class="post-meta">
      <span class="en">{{ review.date | date: '%b %d, %Y' }}</span><span class="zh">{{ review.date | date: '%Y 年 %-m 月 %-d 日' }}</span>
    </p>
    {% if review.description %}
      <p>{{ review.description }}</p>
    {% endif %}
  </li>
{% endfor %}
</ul>

{% if reviews_sorted.size == 0 %}
<p>
  <span class="en">Nothing here yet — PDFs will be added over time.</span>
  <span class="zh">暂时还没有内容，之后会陆续加入 PDF。</span>
</p>
{% endif %}
