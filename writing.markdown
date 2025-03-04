---
layout: page
title: Writing
permalink: /writing/
---

{% for post in site.blogs %}
  <h2>
    <a href="{{ post.url }}">{{ post.title }}</a><br>
  </h2>
{% endfor %}

## [Role Based Access Control](https://materialize.com/blog/rbac/)
## [The Four ACID Questions](https://materialize.com/blog/the-four-acid-questions/)
