---
layout: page
title: Open Source Projects
permalink: /oss/
---

# [<img src="/assets/img/pg_logo.png" width="75"/>](https://www.postgresql.org/) [PostgreSQL](https://www.postgresql.org/)
- [Support +/- infinity in the interval data type](https://git.postgresql.org/gitweb/?p=postgresql.git;a=commit;h=519fc1bd9e9d7b408903e44f55f83f6db30742b7)
- [Improve handling of date_trunc() units for infinite input values](https://git.postgresql.org/gitweb/?p=postgresql.git;a=commit;h=d85ce012f99f63249bb45a78fcecb7a2383920b1)
- Remove dependence on signed integer wrapping [[0]](https://git.postgresql.org/gitweb/?p=postgresql.git;a=commit;h=9e9a2b7031f64e49fcaf28f21a4e70eb1212165f) [[1]](https://git.postgresql.org/gitweb/?p=postgresql.git;a=commit;h=108d2adb9e9e084cd57bf514d06ef4b954719ffa)
- [Add overflow checks to money type](https://git.postgresql.org/gitweb/?p=postgresql.git;a=commit;h=22b0ccd65d275d227a7d911aede12d34e1b5dfc9)
- [Fix incorrect return value for pg_size_pretty(bigint)](https://git.postgresql.org/gitweb/?p=postgresql.git;a=commit;h=b181062aa5727a013c96b64476f884c992b5068d)
- [Detect integer overflow in array_set_slice()](https://git.postgresql.org/gitweb/?p=postgresql.git;a=commit;h=991f8cf8abe244547093ddffcc4b9209076f3525)
- [Detect more overflows in timestamp[tz]_pl_interval](https://git.postgresql.org/gitweb/?p=postgresql.git;a=commit;h=4019285c064028fbf613f0e43766416a63b826db)
- [Catch overflow when rounding intervals in AdjustIntervalForTypmod](https://git.postgresql.org/gitweb/?p=postgresql.git;a=commit;h=5ebc9c90173f32cffe373a80835f157b9ebfa3bd)
- Tighten Interval parsing [[0]](https://git.postgresql.org/gitweb/?p=postgresql.git;a=commit;h=d6d1430f404386162831bc32906ad174b2007776) [[1]](https://git.postgresql.org/gitweb/?p=postgresql.git;a=commit;h=165d581f146b09543b832513ee00fead132ba6b1) [[2]](https://git.postgresql.org/gitweb/?p=postgresql.git;a=commit;h=617f9b7d4b10fec00a86802eeb34d7295c52d747)
- Fix privilege check for SET SESSION AUTHORIZATION [[0]](https://git.postgresql.org/gitweb/?p=postgresql.git;a=commit;h=0fef8775382886bef023aee67cb744711ed7a32f) [[1]](https://git.postgresql.org/gitweb/?p=postgresql.git;a=commit;h=9987a7bf34061ed5cffc4e5113da056358976e94) [[2]](https://git.postgresql.org/gitweb/?p=postgresql.git;a=commit;h=a0363ab7aafda7d16ae59e72d86866c02ad3d657)
- [Tighten error checks in datetime input, and remove bogus "ISO" format](https://git.postgresql.org/gitweb/?p=postgresql.git;a=commit;h=5b3c5953553bb9fb0b171abc6041e7c7e9ca5b4d)
- [Reject combining "epoch" and "infinity" with other datetime fields](https://git.postgresql.org/gitweb/?p=postgresql.git;a=commit;h=bcc704b52490492e6bd73c4444056b3e9644504d)
- [Fix overflow hazards in interval input and output conversions](https://git.postgresql.org/gitweb/?p=postgresql.git;a=commit;h=e39f9904671082c5ad3a2c5acbdbd028fa93bf35)
- [Handle integer overflow in interval justification functions](https://git.postgresql.org/gitweb/?p=postgresql.git;a=commit;h=54bd1e43ca56e323aef309dc2dc0e1391825ce68)
- [Guard against overflow in make_interval()](https://git.postgresql.org/gitweb/?p=postgresql.git;a=commit;h=b2d55447a563036579d6777f64a7483dceeab6ea)
<br/>
<br/>

# [pg_duration](https://github.com/jkosh44/pg_duration)
pg_duration is a PostgreSQL extension written by me (Joseph Koshakow) that adds a duration data type to PostgreSQL.
<br/>
<br/>

# [<img src="/assets/img/noisepage-icon.svg" width="75"/>](https://github.com/cmu-db/postgres) [PG-NoisePage](https://github.com/cmu-db/postgres)
PG-NoisePage is a fork of PostgreSQL with the attempt to port NoisePage's self driving infrastructure over to Postgresql.
- [Implement functionality to take online copies of replica nodes in order to gather training data](https://github.com/cmu-db/postgres/pull/19)
<br/>
<br/>

# [<img src="/assets/img/noisepage-icon.svg" width="75"/>](https://noise.page/) [NoisePage](https://noise.page/)
NoisePage is a DBMS developed at Carnegie Mellon University that uses machine learning to control its configuration, optimization, and tuning. \
*([All PRs](https://github.com/cmu-db/noisepage/pulls?q=is%3Apr+is%3Aclosed+author%3Ajkosh44))*
- [Implement data table statistics tracking for cost-based query optimizer (ANALYZE)](https://github.com/cmu-db/noisepage/pull/1450)
- [Improve log replay replication performance by reducing message size and serialization time](https://github.com/cmu-db/noisepage/pull/1572)
- [Add support for nested subqueries with duplicate table names at different query depths](https://github.com/cmu-db/noisepage/pull/1619)
- [Fix detection of correlated subqueries during optimizer’s plan generation](https://github.com/cmu-db/noisepage/pull/1405)
- [Fix plan generation of HAVING queries by separately storing group by and aggregate columns](https://github.com/cmu-db/noisepage/pull/1310)
- [Add support for variadic functions and INSERT INTO SELECT statements](https://github.com/cmu-db/noisepage/pull/1139) \
<br/>
<br/>

# [<img src="/assets/img/fluo-logo.png" width="75"/>](https://fluo.apache.org/) [Apache Fluo](https://fluo.apache.org/)
*Committer and Project Management Committee (PMC) member*
Apache Fluo is a distributed processing system that lets users make incremental updates to large data sets. It is built on top of [Apache Accumulo](https://accumulo.apache.org/) and modelled after [Google Percolator](https://research.google/pubs/pub36726/). \
*([All PRs](https://github.com/apache/fluo/pulls?q=is%3Apr+is%3Aclosed+author%3Ajkosh44))*
- [Parallelize the reading of rows during transaction commit to improve system performance](https://github.com/apache/fluo/pull/1080)
- [Migrate from beta Google library to JDK library](https://github.com/apache/fluo/pull/975) and [centralized commit logic to improve reliability](https://github.com/apache/fluo/pull/1001)
- [Added monitoring functionality to CLI using Apache Zookeeper to provide statistics on nodes](https://github.com/apache/fluo/pull/1087) \
<br/>
<br/>

# [Rust Postgres](https://github.com/sfackler/rust-postgres)
Rust-Postgres is a PostgreSQL library for Rust.
- [Add Multirange types](https://github.com/sfackler/rust-postgres/pull/963)
- [Fix display of 0 dimensional arrays](https://github.com/sfackler/rust-postgres-array/pull/12)
<br/>
<br/>

# [<img src="/assets/img/accumulo-logo.png" width="75"/>](https://accumulo.apache.org/) [Apache Accumulo](https://accumulo.apache.org/)
Apache Accumulo is a sorted, distributed key/value store modelled after [Google Bigtable](https://research.google/pubs/pub27898/).
- [Implement method to fetch property by property name prefix](https://github.com/apache/accumulo/pull/1701)
<br/>
<br/>

# [<img src="/assets/img/summernote-logo.png" width="75"/>](https://summernote.org/) [Summernote](https://summernote.org/)
Summernote is a simple WYSIWYG editor.
- [Fix bug that allowed users to bypass a maximum text length](https://github.com/summernote/summernote/pull/2865)
<br/>
<br/>

# [<img src="/assets/img/jackson-logo.png" width="75"/>](https://github.com/FasterXML/jackson) [Jackson](https://github.com/FasterXML/jackson)
Jackson is a Java JSON serialization/deserialization framework.
- [Add ability to register different configurations for objects of the same type but with different names](https://github.com/FasterXML/jackson-databind/pull/2523)

# [JCommander](https://jcommander.org/)
JCommander is an annotation based command line parameter parsing framework for Java.
- [Fix `usage()` for missing description on commands](https://github.com/cbeust/jcommander/commit/d5e14a9b43a450acc1f595e2d9a9536e47514b2a)
