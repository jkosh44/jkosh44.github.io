---
layout: page
title: Open Source Projects
permalink: /oss/
---

# [<img src="/assets/img/pg_logo.png" width="75"/>](https://www.postgresql.org/) [PostgreSQL](https://www.postgresql.org/)
- [Handle integer overflow in interval justification functions](https://git.postgresql.org/gitweb/?p=postgresql.git;a=commit;h=54bd1e43ca56e323aef309dc2dc0e1391825ce68)
- [Fix overflow hazards in interval input and output conversions](https://git.postgresql.org/gitweb/?p=postgresql.git;a=commit;h=e39f9904671082c5ad3a2c5acbdbd028fa93bf35)
<br/>
<br/>

# [<img src="/assets/img/noisepage-icon.svg" width="75"/>](https://github.com/cmu-db/postgres) [PG-NoisePage](https://github.com/cmu-db/postgres)
PG-NoisePage is a fork of postgresql with the attempt to port NoisePage's self driving infrastructure over to Postgresql.
- [Implemented functionality to take online copies of replica nodes in order to gather training data](https://github.com/cmu-db/postgres/pull/19)
<br/>
<br/>

# [<img src="/assets/img/noisepage-icon.svg" width="75"/>](https://noise.page/) [NoisePage](https://noise.page/)
NoisePage is a DBMS developed at Carnegie Mellon University that uses machine learning to control its configuration, optimization, and tuning. \
*([All PRs](https://github.com/cmu-db/noisepage/pulls?q=is%3Apr+is%3Aclosed+author%3Ajkosh44))*
- [Implemented data table statistics tracking for cost-based query optimizer (ANALYZE)](https://github.com/cmu-db/noisepage/pull/1450)
- [Improved log replay replication performance by reducing message size and serialization time](https://github.com/cmu-db/noisepage/pull/1572)
- [Added support for nested subqueries with duplicate table names at different query depths](https://github.com/cmu-db/noisepage/pull/1619)
- [Fixed detection of correlated subqueries during optimizer’s plan generation](https://github.com/cmu-db/noisepage/pull/1405)
- [Fixed plan generation of HAVING queries by separately storing group by and aggregate columns](https://github.com/cmu-db/noisepage/pull/1310)
- [Added support for variadic functions and INSERT INTO SELECT statements](https://github.com/cmu-db/noisepage/pull/1139) \
<br/>
<br/>

# [<img src="/assets/img/fluo-logo.png" width="75"/>](https://fluo.apache.org/) [Apache Fluo](https://fluo.apache.org/)
*Committer and Project Management Committee (PMC) member*
Apache Fluo is a distributed processing system that lets users make incremental updates to large data sets. It is built on top of [Apache Accumulo](https://accumulo.apache.org/) and modelled after [Google Percolator](https://research.google/pubs/pub36726/). \
*([All PRs](https://github.com/apache/fluo/pulls?q=is%3Apr+is%3Aclosed+author%3Ajkosh44))*
- [Parallelized the reading of rows during transaction commit to improve system performance](https://github.com/apache/fluo/pull/1080)
- [Migrated from beta Google library to JDK library](https://github.com/apache/fluo/pull/975) and [centralized commit logic to improve reliability](https://github.com/apache/fluo/pull/1001)
- [Added monitoring functionality to CLI using Apache Zookeeper to provide statistics on nodes](https://github.com/apache/fluo/pull/1087) \
<br/>
<br/>

# [<img src="/assets/img/accumulo-logo.png" width="75"/>](https://accumulo.apache.org/) [Apache Accumulo](https://accumulo.apache.org/)
Apache Accumulo is a sorted, distributed key/value store modelled after [Google Bigtable](https://research.google/pubs/pub27898/).
- [Implement method to fetch property by property name prefix](https://github.com/apache/accumulo/pull/1701)
<br/>
<br/>

# [Summernote](https://summernote.org/)
Summernote is a simple WYSIWYG editor.
- [Fixed bug that allowed users to bypass a maximum text length](https://github.com/summernote/summernote/pull/2865)
<br/>
<br/>

# [Jackson](https://github.com/FasterXML/jackson)
Jackson is a Java JSON serialization/deserialization framework.
- [Added ability to register different configurations for objects of the same type but with different names](https://github.com/FasterXML/jackson-databind/pull/2523)