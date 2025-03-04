---
layout: post
title:  "PostgreSQL Intervals are Confusing"
published: true
---
<script
  src="https://cdn.jsdelivr.net/npm/@electric-sql/pglite-repl/dist-webcomponent/Repl.js"
  type="module"
>
</script>
<script 
  src="{{ '/assets/js/pglite.js' | relative_url }}"
  type="module"
>
</script>
<script 
  src="{{ '/assets/js/fakepg.js' | relative_url }}"
  type="module"
>
</script>

This blog post will explain the PostgreSQL built-in datatype `interval` and explain some of its flaws. The blog post also uses PGLite[^1] to execute PostgreSQL queries in the browser. If the PGLite code ever stops working or you find it annoying, then you can find an exact copy of this blog post with all the answers hard-coded[^2].

## Interval Overview

PostgreSQL has many built-in types that users can use for their data[^3]. A subset of these types are the date/time types[^4], which store information about dates and times.

**`timestamp`** stores a point in time including both the date and the time.
<div class="pg">
<pre><code>=> </code><code class='query'>SELECT timestamp '1995-08-06 10:11:12';</code>
<code class="result">                          timestamp                         <br>-----------------------------------------------------------<br> Sun Aug 06 1995 10:11:12 GMT-0400 (Eastern Daylight Time) <br>(1 row)<br></code></pre>
</div>
<br>

**`timestamptz`** is like `timestamp` but with a timezone.
<div class="pg">
<pre><code>=> </code><code class='query'>SELECT timestamptz '1995-08-06 10:11:12 EST';</code>
<code class="result">                        timestamptz                        <br>-----------------------------------------------------------<br> Sun Aug 06 1995 11:11:12 GMT-0400 (Eastern Daylight Time) <br>(1 row)<br></code></pre>
</div>
<br>

**`date`** stores a moment in time without the time of day.
<div class="pg">
<pre><code>=> </code><code class='query'>SELECT date '1995-08-06';</code>
<code class="result">                           date                           <br>-----------------------------------------------------------<br> Sat Aug 05 1995 20:00:00 GMT-0400 (Eastern Daylight Time) <br>(1 row)<br></code></pre>
</div>
<br>

**`time`** just stores the time of day.
<div class="pg">
<pre><code>=> </code><code class='query'>SELECT time '10:11:12';</code>
<code class="result">   time   <br>----------<br> 10:11:12 <br>(1 row)<br></code></pre>
</div>
<br>

**`timetz`** is like `time` but with a timezone.
<div class="pg">
<pre><code>=> </code><code class='query'>SELECT timetz '10:11:12 EST';</code>
<code class="result">   timetz   <br>-------------<br> 10:11:12-05 <br>(1 row)<br></code></pre>
</div>
<br>

The final date/time type is `interval`. The PostgreSQL version 17 date/time docs[^4]  does not spend much time describing what an `interval` actually is and just calls it a “time interval”. The SQL standard[^5] spends even less time describing what they are and immediately dives into what are legal vs illegal `interval`s. The idea behind the `interval` SQL type is that instead of describing a moment in time, like `date`, `timestamp`, `time`, etc., it describes a span of time. To put it a different way, `intervals` represent the space between two moments in time. In PostgreSQL, it might look something like this:

<div class="pg">
<pre><code>=> </code><code class='query'>SELECT interval '1 year 2 months 3 days 4 hours 5 seconds 6 milliseconds';</code>
<code class="result">             interval             <br>-----------------------------------<br> 1 year 2 mons 3 days 04:00:05.006 <br>(1 row)<br></code></pre>
</div>
<br>

Or simply something like this:

<div class="pg">
<pre><code>=> </code><code class='query'>SELECT interval '42 hours';</code>
<code class="result"> interval <br>----------<br> 42:00:00 <br>(1 row)<br></code></pre>
</div>
<br>

`interval`s also allow us to perform arithmetic on date/time types, for example:

<div class="pg">
<pre><code>=> </code><code class='query'>
SELECT date '2020/05/07' + interval '5 days';
SELECT timestamp '2020/05/07 11:11:11' - interval '12 minutes';</code>
<code class="result">                         ?column?                         <br>-----------------------------------------------------------<br> Tue May 12 2020 00:00:00 GMT-0400 (Eastern Daylight Time) <br>(1 row)<br><br>                         ?column?                         <br>-----------------------------------------------------------<br> Thu May 07 2020 10:59:11 GMT-0400 (Eastern Daylight Time) <br>(1 row)<br></code></pre>
</div>
<br>

Any of the following units are valid in `interval`s:

- Millennium
- Century
- Year
- Month
- Week
- Day
- Hour
- Minute
- Second
- Millisecond
- Microsecond

## Interval Comparisons

Now that you know what an `interval` is, what do you think the following will return? As a reminder, `=` is the equality operator in SQL instead of `==`. Take a second and guess before you look at the answer, you have a 50/50 chance. 

<div class="pg">
<pre><code>=> </code><code class='query'>SELECT interval '1 year' = interval '365 days';</code>
<code class="result"> ?column? <br>----------<br>    false <br>(1 row)<br></code></pre>
</div>
<br>

Ok, that might make sense, not every year has 365 days, some have 366 days. Depending on the definition of a year, we might even say that a year has 365.25 days. How about this one? This must surely return false. There's no sane argument to be made that a year is equivalent to 360 days.

<div class="pg">
<pre><code>=> </code><code class='query'>SELECT interval '1 year' = interval '360 days';</code>
<code class="result"> ?column? <br>----------<br>     true <br>(1 row)<br></code></pre>
</div>
<br>

Huh? Now that is strange. What could possibly be going on? Let's look at a different seemingly unrelated example.

<div class="pg">
<pre><code>=> </code><code class='query'>SELECT interval '1 day' = interval '24 hours';</code>
<code class="result"> ?column? <br>----------<br>     true <br>(1 row)<br></code></pre>
</div>
<br>

That's not terribly surprising, if we ignore leap seconds most days have 24 hours. If the above is true, then it might be reasonable to assume that the following two queries return the same answer. 

<div class="fake-pg">
<pre><code>=> </code><code class='query'>
SELECT timestamptz '2024/03/10 01:01:01 America/New_York' + interval '1 day';
SELECT timestamptz '2024/03/10 01:01:01 America/New_York' + interval '24 hours';</code>
<code class="result">                         ?column?                         <br>-----------------------------------------------------------<br> Mon Mar 11 2024 01:01:01 GMT-0400 (Eastern Daylight Time) <br>(1 row)<br><br>                         ?column?                         <br>-----------------------------------------------------------<br> Mon Mar 11 2024 02:01:01 GMT-0400 (Eastern Daylight Time) <br>(1 row)<br></code></pre>
</div>
<br>

Nope, they're off by one hour. If you live in the US, then you might remember March 10th 2024 as being the day when daylight savings started. In most parts of the US, March 10th 2024 was a day with only 23 hours.

(Note: The results of the previous queries had to be hard-coded and were not executed with PGLite because they rely on your browser having the correct timezone and daylight savings information.)

## Interval Internals

The problem is that `interval`s are trying to store three related but incomparable types of information. The first is what some people refer to as a duration of time. These are well defined, precise measurements of elapsed time, usually measured in fractions of a second. Computers may notoriously have a difficult time accurately measuring durations, but in theory 1 seconds has the same length no matter where you are (for the purposes of this post lets ignore time dilation).

The second kind of data stored is days, days are the number of calendar days between two moments in time. For example, 

<div class="pg">
<pre><code>=> </code><code class='query'>SELECT timestamp '2020/05/21 00:00:01' - timestamp '2020/05/20 00:00:01';</code>
<code class="result"> ?column? <br>----------<br>    1 day <br>(1 row)<br></code></pre>
</div>
<br>

As we saw from the daylight savings example, days are not precise. Sometimes they're 24 hours, sometimes they're 23 hours, and sometimes they're 25 hours. You can't compare days to hours without knowing which specific day you're talking about.

The third kind of data stored is months, months are the number of calendar months between two moments in time. It's much more obvious to see that these are not easily comparable to days. Months can range anywhere from 28 to 31 days depending on the month and year.

All other units can be described as multiples of one of these three types of data. Years are 12 months, weeks are 7 days, minutes are 60 seconds, etc.

If we look at how PostgreSQL stores `interval` values internally[^6] we can see that it matches this split.

```C
typedef int64 TimeOffset;

/*
 * Storage format for type interval.
 */
typedef struct
{
	TimeOffset	time;			/* all time units other than days, months and
								 * years */
	int32		day;			/* days, after time for alignment */
	int32		month;			/* months and years, after time for alignment */
} Interval;
```

It uses 64 bits to store the number of microseconds, 32 bits to store the number of days, and 32 bits to store the number of months. Notably `interval`s do not support nanosecond granularity which is unfortunate because most modern date/time types support nanosecond granularity. Though, that's not relevant to this discussion.

Since this one type holds three incomparable fields, we've technically created a type that is only partially ordered, i.e. not every element of this type is directly comparable to every other element. We can conclusively say that 50 microseconds is less than 1000 microseconds. However, we cannot conclusively say if 1 month is less than 31 days, it depends on the month!

Some languages, like Rust, have direct support for partial orders. Unlike the Rust, PostgreSQL tries to treat all types, including `interval`s, as totally ordered. When comparing two `interval`s, PostgreSQL converts each `interval` to a single 128 bit integer of microseconds and then compares those two integers. The set of 128 bit integers is totally ordered, so the comparison can always easily return an answer. Each month is converted to 30 days, each day is converted to 24 hours, and each hour is converted to microseconds as expected[^7].

```C
/*
 *		interval_relop	- is interval1 relop interval2
 *
 * Interval comparison is based on converting interval values to a linear
 * representation expressed in the units of the time field (microseconds,
 * in the case of integer timestamps) with days assumed to be always 24 hours
 * and months assumed to be always 30 days.  To avoid overflow, we need a
 * wider-than-int64 datatype for the linear representation, so use INT128.
 */

static inline INT128
interval_cmp_value(const Interval *interval)
{
	INT128		span;
	int64		days;

	/*
	 * Combine the month and day fields into an integral number of days.
	 * Because the inputs are int32, int64 arithmetic suffices here.
	 */
	days = interval->month * INT64CONST(30);
	days += interval->day;

	/* Widen time field to 128 bits */
	span = int64_to_int128(interval->time);

	/* Scale up days to microseconds, forming a 128-bit product */
	int128_add_int64_mul_int64(&span, days, USECS_PER_DAY);

	return span;
}

static int
interval_cmp_internal(const Interval *interval1, const Interval *interval2)
{
	INT128		span1 = interval_cmp_value(interval1);
	INT128		span2 = interval_cmp_value(interval2);

	return int128_compare(span1, span2);
}
```

This explains the strange result of 360 days equaling 1 year. 1 year is the same as 12 months, 12 months is converted to (12 * 30) days, which is equal 360 days.

However, that code is *only* used to compare `intervals`, not to perform arithmatic with `interval`s. When adding/subtracting an `interval` to/from a `timestamp` we follow these rules[^8]:

1. The months part of the `interval` increments/decrements the calendar month of the `timestamp`.
2. The days part of the `interval` increments/decrements the calendar day of the `timestamp`.
3. The microseconds part of the `interval` increments/decrements the time portion of the `timestamp`.

Incrementing/decrementing a specific unit in a `timestamp` can cause one of the larger units to change as expected. For example, adding one day to Januray 31st will also cause the month to increase to February.

(Note: The arithmetic code is a harder to understand and involves more helper methods and structs so it's not included in this post. It is linked in the footnotes if you're interested.)

This explains why adding 1 day is not always the same as adding 24 hours. If you add 1 day you may be adding 23, 24, or 25 hours depending on the specific day.

The SQL standard anticipated issues around interval comparisons and actually accounted for it[^5].

> There are two classes of intervals. One class, called year-month intervals, has an express or implied datetime precision that includes no fields other than YEAR and MONTH, though not both are required. The other class, called day-time intervals, has an express or implied interval precision that can include any fields other than YEAR or MONTH.
>
> Year-month intervals are mutually comparable only with other year-month intervals.
>
> Day-time intervals are mutually comparable only with other day-time intervals.

They didn't account for daylight savings time causing days not to be directly comparable to time, but they did account for months not being comparable to days and time. I'm not sure why PostgreSQL decided to deviate from this and combine year-month intervals with day-time intervals. The answer is probably buried somewhere in documentation, code comments, commit messages, and/or mailing list threads.

## Wrap Up

Now that you're an `interval` expert, let's try and figure out what the following queries return.

<div class="pg">
<pre><code>=> </code><code class='query'>
SELECT date '2025/01/31' + interval '1 month';
SELECT date '2025/01/30' + interval '1 month';
SELECT date '2025/01/29' + interval '1 month';
SELECT date '2025/01/28' + interval '1 month';</code>
<code class="result">                         ?column?                         <br>-----------------------------------------------------------<br> Fri Feb 28 2025 00:00:00 GMT-0500 (Eastern Standard Time) <br>(1 row)<br><br>                         ?column?                         <br>-----------------------------------------------------------<br> Fri Feb 28 2025 00:00:00 GMT-0500 (Eastern Standard Time) <br>(1 row)<br><br>                         ?column?                         <br>-----------------------------------------------------------<br> Fri Feb 28 2025 00:00:00 GMT-0500 (Eastern Standard Time) <br>(1 row)<br><br>                         ?column?                         <br>-----------------------------------------------------------<br> Fri Feb 28 2025 00:00:00 GMT-0500 (Eastern Standard Time) <br>(1 row)<br></code></pre>
</div>
<br>

Some of you may have guessed correctly, but if you're anything like me then even after all of that information you still guessed wrong. 

The explanation is that after incrementing the months, we have to clamp the days to the maximum valid day of the current month to keep it a valid `timestamp`. So we add 1 to January and get February, and clamp the days to 28 since that's the largest valid day for February (in 2025).

Some of you may be asking, what are the actual use cases for `interval`s in PostgreSQL if they have all of these footguns? To be honest, I'm not actually sure. They're probably best avoided unless you can account for their sharp edges. One potential use is to store durations of some event. For example, you may want to store the results of a race, or the length of a class. However, for all the reasons stated above, it's very hard to precisely compare two `interval`s. If one festival lasted 3 days and 6 hours while another lasted 3 days 5 hours and 30 minutes, then which one lasted longer? The answer depends on the day that each festival started. 

If you want to accurately compare two `interval`s you have a couple of options. The first is to always store the `interval` with a starting (or ending) `timestamp` and time zone. The second option is to only ever use the duration part of an `interval`, always make sure that days and months are zero. However, these both come with drawbacks. The first option requires a lot of extra storage and requires the user to perform extra logic when they want to get a precise duration of time. The second option wastes a lot of space, the months and days fields take up 64 bits per `interval`, but are always set to zero leading to very low information density. It also does not provide guard rails against someone accidently setting the months or days to a non-zero value.

Of course you could always roll your own solution using integers, but then you lose out on useful type information and built-in functions and operators.

To help with this problem I created the pg_duration[^9] PostgreSQL extension. It creates a new type, called `duration`, that behaves the same as the `interval` type, but it doesn't have the days and months field. It only stores an amount of microseconds in 64 bits, which makes it trivially totally ordered. It also has all of the same built-in functionaly as `interval`s (except for day and month specific functionality). You can read more about it in the project `README`.

---

[^1]: [https://pglite.dev/](https://pglite.dev/)

[^2]: <a href="{{ "/blogs/2025-02-07-postgresql-intervals-are-confusing" | relative_url }}?fake-pg">Hard coded version</a>

[^3]: [https://www.postgresql.org/docs/current/datatype.html](https://www.postgresql.org/docs/current/datatype.html)

[^4]: [https://www.postgresql.org/docs/17/datatype-datetime.html](https://www.postgresql.org/docs/17/datatype-datetime.html)

[^5]: The SQL standard is not available for free, you have to purchase it from ANSI, [https://webstore.ansi.org/standards/iso/isoiec90752023-2502169](https://webstore.ansi.org/standards/iso/isoiec90752023-2502169), or you could just take my word for it. 

[^6]: [Interval struct](https://github.com/postgres/postgres/blob/ecb8226af63dc8f1c0859977102764704368693b/src/include/datatype/timestamp.h#L18-L53)

[^7]: [Interval comparison code](https://github.com/postgres/postgres/blob/15a79c73111f0c9738ee81b796f7de5bfeb3aedc/src/backend/utils/adt/timestamp.c#L2483-L2522)

[^8]: [Interval arithmetic code](https://github.com/postgres/postgres/blob/15a79c73111f0c9738ee81b796f7de5bfeb3aedc/src/backend/utils/adt/timestamp.c#L3049-L3188)

[^9]: [https://github.com/jkosh44/pg_duration](https://github.com/jkosh44/pg_duration)
