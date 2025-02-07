---
layout: page
title: Writing
permalink: /writing/
---

## [The Four ACID Questions](https://materialize.com/blog/the-four-acid-questions/)
## [Role Based Access Control](https://materialize.com/blog/rbac/)

{% for post in site.blogs %}
  <h2>
    <a href="{{ post.url }}">{{ post.title }}</a><br>
  </h2>
{% endfor %}