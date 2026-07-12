---
layout: page
permalink: /talks/
title: talks
title_zh: 报告与讲演
description: <span class="en">Slides and handouts from seminars and research presentations.</span><span class="zh">研讨课与研究报告的幻灯片及公开讲义。</span>
nav: true
nav_order: 3
---

{% assign talks_sorted = site.talks | sort: 'date' | reverse %}

<ul class="post-list">
{% for talk in talks_sorted %}
  <li>
    <h3>
      {% if talk.pdf %}
        <a href="{{ talk.pdf | relative_url }}" target="_blank" rel="noopener">
      {% else %}
        <a href="{{ talk.url | relative_url }}">
      {% endif %}
        <span class="en">{{ talk.title }}</span>{% if talk.title_zh %}<span class="zh">{{ talk.title_zh }}</span>{% else %}<span class="zh">{{ talk.title }}</span>{% endif %}
      </a>
      {% if talk.pdf %}
        <small><span class="en">[PDF]</span><span class="zh">[PDF]</span></small>
      {% endif %}
    </h3>
    <p class="post-meta">
      <span class="en">{{ talk.date | date: '%b %d, %Y' }}</span><span class="zh">{{ talk.date | date: '%Y 年 %-m 月 %-d 日' }}</span>
      {% if talk.event %}&nbsp; &middot; &nbsp;{{ talk.event }}{% endif %}
    </p>
    {% if talk.description %}<p>{{ talk.description }}</p>{% endif %}
  </li>
{% endfor %}
</ul>

{% if talks_sorted.size == 0 %}
<p><span class="en">No talks yet.</span><span class="zh">暂时还没有公开报告。</span></p>
{% endif %}
