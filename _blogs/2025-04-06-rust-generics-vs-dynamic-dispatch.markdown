---
layout: post
title:  "Generics and Dynamic Dispatch in Rust"
published: true
---
The goal of this post is to explain what generics and dynamic dispatch are in Rust and compare the tradeoffs associated with them. The contents of this post are specific to Rust, but may also apply to other languages. The post is not trying to claim that one approach is superior to the other. The intended audience is someone with some to little experience in Rust, but hopefully people with more advanced knowledge can also get some value out of it. It is expected that the reader knows what [traits](https://doc.rust-lang.org/book/ch10-02-traits.html) and [trait bounds](https://doc.rust-lang.org/rust-by-example/generics/bounds.html) are. 

If I say something that's incorrect, please let me know and I will correct it.

All of the code used in this blog post can be found [here](https://github.com/jkosh44/generics-vs-dynamic-dispatch-rust/blob/main/src/main.rs).

Generics and dynamic dispatch are both ways that programming languages allow you to abstract away the details of a concrete type. This can often help remove code duplication and make code more extensible.

Let's say that we want to write a database. This database is going to write and read data directly from the file system without going through that pesky OS as an intermediary. This is a perfect use case for either generics or dynamic dispatch. First let's define an (extremely limited) trait for a file system.

```rust
trait FileSystem {
    /// Overwrite the contents of the file identified by `file_id` with `contents`.
    fn write(&mut self, file_id: u64, contents: Vec<u8>);
    /// Read the contents of the file identified by `file_id`.
    fn read(&self, file_id: u64) -> Option<Vec<u8>>;
}
```

Next let's write some implementations of this trait. For now we'll stick to two implementations: A [FAT32](https://en.wikipedia.org/wiki/File_Allocation_Table) and a [EXT4](https://docs.kernel.org/filesystems/ext4/).

```rust
/// An implementation of the FAT32 file system
struct Fat32 {
    ...
}

impl FileSystem for Fat32 {
    ...
}

/// An implementation of the EXT4 file system
struct Ext4 {
    ...
}

impl FileSystem for Ext4 {
    ...
}
```

## Generics

Here's what a database implementation using generics might look like.

```rust
struct GenericDatabase<T: FileSystem> {
    fs: T,
    next_id: u64,
    /// The value of each key is stored in its own file ... maybe not
    /// the most efficient.
    key_map: HashMap<Vec<u8>, u64>,
}

impl<T: FileSystem> GenericDatabase<T> {
    fn new(fs: T) -> Self {
        Self {
            fs,
            next_id: 0,
            key_map: HashMap::new(),
        }
    }

    fn set(&mut self, key: Vec<u8>, value: Vec<u8>) {
        let id = self.key_map.entry(key).or_insert_with(|| {
            let id = self.next_id;
            self.next_id += 1;
            id
        });
        self.fs.write(*id, value);
    }

    fn get(&self, key: &[u8]) -> Option<Vec<u8>> {
        let id = self.key_map.get(key)?;
        self.fs.read(*id)
    }
}
```

Notice how this implementation doesn't need to know the concrete details of the file system used. The database can use any file system as long as that file system implements the `FileSystem` trait. Using this type would look like the following.

```rust
#[test]
fn test_generic_database() {
    let fs = Fat32::new();
    let mut db = GenericDatabase::new(fs);
    db.set(b"ny".to_vec(), b"albany".to_vec());
    assert_eq!(db.get(b"ny"), Some(b"albany".to_vec()));

    let fs = Ext4::new();
    let mut db = GenericDatabase::new(fs);
    db.set(b"maryland".to_vec(), b"annapolis".to_vec());
    assert_eq!(db.get(b"maryland"), Some(b"annapolis".to_vec()));
}
```

When we write generic structs, the compiler is actually generating multiple different structs during compile time with each concrete type we use. This process is called [Monomorphization](https://rustc-dev-guide.rust-lang.org/backend/monomorph.html). In our example, the compiler will generate types that look like the following.


```rust
struct Fat32Database {
    fs: Fat32,
    next_id: u64,
    /// The value of each key is stored in its own file ... maybe not
    /// the most efficient.
    key_map: HashMap<Vec<u8>, u64>,
}

impl Fat32Database {
    fn new(fs: Fat32) -> Self {
        Self {
            fs,
            next_id: 0,
            key_map: HashMap::new(),
        }
    }

    fn set(&mut self, key: Vec<u8>, value: Vec<u8>) {
        let id = self.key_map.entry(key).or_insert_with(|| {
            let id = self.next_id;
            self.next_id += 1;
            id
        });
        self.fs.write(*id, value);
    }

    fn get(&self, key: &[u8]) -> Option<Vec<u8>> {
        let id = self.key_map.get(key)?;
        self.fs.read(*id)
    }
}

struct Ext4Database {
    fs: Ext4,
    next_id: u64,
    /// The value of each key is stored in its own file ... maybe not
    /// the most efficient.
    key_map: HashMap<Vec<u8>, u64>,
}

impl Ext4Database {
    fn new(fs: Ext4) -> Self {
        Self {
            fs,
            next_id: 0,
            key_map: HashMap::new(),
        }
    }

    fn set(&mut self, key: Vec<u8>, value: Vec<u8>) {
        let id = self.key_map.entry(key).or_insert_with(|| {
            let id = self.next_id;
            self.next_id += 1;
            id
        });
        self.fs.write(*id, value);
    }

    fn get(&self, key: &[u8]) -> Option<Vec<u8>> {
        let id = self.key_map.get(key)?;
        self.fs.read(*id)
    }
}
```

Our test will be re-written as.

```rust
#[test]
fn test_concrete_generic_database() {
    let fs = Fat32::new();
    let mut db = Fat32Database::new(fs);
    db.set(b"ny".to_vec(), b"albany".to_vec());
    assert_eq!(db.get(b"ny"), Some(b"albany".to_vec()));

    let fs = Ext4::new();
    let mut db = Ext4Database::new(fs);
    db.set(b"maryland".to_vec(), b"annapolis".to_vec());
    assert_eq!(db.get(b"maryland"), Some(b"annapolis".to_vec()));
}
```

This would be extremely annoying to write by hand because `Fat32Database` and `Ext4Database` are almost identical in every way. One way to think about generics is that they are a template that the compiler will use to generate code. Generics let you define structs that are *generic* over a set of types, the set of types is defined by the trait bounds. In our example that set is all types that implement the `FileSystem` trait. In theory the compiler can generate code for every single type in that set, but it would be extremely wasteful. In practice the compiler only generates code for the types that are actually used with the generic struct.

Generics also work with functions, the concepts are mostly the same so this post will focus on structs, but for completeness here's an example with a function:

```rust
fn generic_add<T>(t1: T, t2: T)
where
    T: Add,
    <T as Add>::Output: Debug,
{
    let sum = t1 + t2;
    println!("{sum:?}")
}

#[test]
fn test_generic_add() {
    generic_add(42_i64, 42_i64);
    generic_add(42_u64, 42_u64);
}
```

This would get converted to something that looks like the following:

```rust
fn i64_generic_add(t1: i64, t2: i64) {
    let sum = t1 + t2;
    println!("{sum:?}")
}

fn u64_generic_add(t1: u64, t2: u64) {
    let sum = t1 + t2;
    println!("{sum:?}")
}

#[test]
fn test_concrete_generic_add() {
    i64_generic_add(42_i64, 42_i64);
    u64_generic_add(42_u64, 42_u64);
}
```

Note: Sometimes generics are referred to as static dispatch.

## Dynamic Dispatch

Here's what a similar database implementation might look like, but this time using [dynamic dispatch](https://doc.rust-lang.org/std/keyword.dyn.html).

```rust
struct DynamicDatabase {
    fs: Box<dyn FileSystem>,
    next_id: u64,
    /// The value of each key is stored in its own file ... maybe not
    /// the most efficient.
    key_map: HashMap<Vec<u8>, u64>,
}

impl DynamicDatabase {
    fn new(fs: Box<dyn FileSystem>) -> Self {
        Self {
            fs,
            next_id: 0,
            key_map: HashMap::new(),
        }
    }

    fn set(&mut self, key: Vec<u8>, value: Vec<u8>) {
        let id = self.key_map.entry(key).or_insert_with(|| {
            let id = self.next_id;
            self.next_id += 1;
            id
        });
        self.fs.write(*id, value);
    }

    fn get(&self, key: &[u8]) -> Option<Vec<u8>> {
        let id = self.key_map.get(key)?;
        self.fs.read(*id)
    }
}
```

The code looks almost identical to the generic implementation. The only difference is that we've removed the generic type, `<T: FileSystem>`, from the struct name and we've changed the type of `fs` to `Box<dyn FileSystem>`. The `dyn` keyword is a signal that this will use dynamic dispatch. `dyn FileSystem` is what's known as a [trait object](https://doc.rust-lang.org/reference/types/trait-object.html) We'll come back to why we need a `Box` later.

Similarly, this implementation doesn't need to know the concrete details of the file system used. Using this type is also similar to the generic version.

```rust
#[test]
fn test_dynamic_database() {
    let fs = Box::new(Fat32::new());
    let mut db = DynamicDatabase::new(fs);
    db.set(b"ny".to_vec(), b"albany".to_vec());
    assert_eq!(db.get(b"ny"), Some(b"albany".to_vec()));

    let fs = Box::new(Ext4::new());
    let mut db = DynamicDatabase::new(fs);
    db.set(b"maryland".to_vec(), b"annapolis".to_vec());
    assert_eq!(db.get(b"maryland"), Some(b"annapolis".to_vec()));
}
```

Unlike generics, the compiler does not generate multiple types during compile time. We only have a single type, `DynamicDatabase`. So, how does the program know what implementation of `set()` and `get()` to use during runtime?

The program uses something called a [vtable](https://en.wikipedia.org/wiki/Virtual_method_table) to look up what implementation to use during runtime. The vtable contains pointers to concrete method implementations and our trait object contains a pointer to the vtable. So during runtime we follow the pointers to find the concrete implementations of `set()` and `get()`. The important takeaway is that dynamic dispatch will look up type information during runtime.

Again, for completeness, here's a function that uses dynamic dispatch. I actually couldn't figure out how to rewrite the generic add function using dynamic dispatch, so I came up with something else. More on this later.

```rust
fn dynamic_println(t: &dyn Display) {
    println!("{t}");
}

#[test]
fn test_dynamic_println() {
    dynamic_println(&42_i64);
    dynamic_println(&42_u64);
}
```

Both the generic and dynamic dispatch struct implementations look almost identical, their behavior is almost identical, so why would we use one over the other?

## Performance Tradeoffs

Arguably the most important tradeoff is about performance. Generics and dynamic dispatch allow programmers to tradeoff compile time performance with runtime performance.

### Compile Time

With generics, the compiler has to generate multiple concrete types during compile time which can lead to noticeable increases in compile time latency. One of Rust's biggest complaints is slow compile times and generics can exacerbate this issue. Dynamic dispatch on the other hand doesn't need to generate any concrete types which can lead to faster compile times.

### Binary Size

Generic code results in multiple concrete types for a single generic struct. The code for those types is included in the compiled binary, which can lead to larger binary sizes. Dynamic dispatch only has a single type which can lead to smaller binary sizes.

### Runtime

Generic code leads to regular plain old types, which have the same runtime performance as if you had defined multiple types yourself. In the database example, `GenericDatabase<Fat32>` has identical performance to `Fat32Database` because in the compiled binary they would be identical.

Dynamic dispatch on the other hand comes with a runtime performance penalty. The first performance hit comes from the vtable itself. It takes time to look up function implementations in the vtable and chase pointers. Additionally, the compiler and the CPU can not reason about the implementation of methods hidden behind dynamic dispatch, so the compiler cannot inline functions and the CPU has a worse time performing speculative execution and branch predictions. Dynamic dispatch also usually leads to more memory usage. Types need an extra pointer into the vtable which increases the size of structs by a pointer width.

The final performance hit comes from the `Box`. Imagine we had the following type.

```rust
#[derive(Debug)]
struct UnsizedType {
    t: dyn Debug,
}
```

How big, in bits, is this type? How much memory does it need?

What if we had the following function, which does not actually compile.

```rust
fn use_unsized_type(ut: UnsizedType) {
    println!("{ut:?}");
}
```

How much stack space does this function need?

There is no answer to these questions, `UnsizedType` (as the name suggests) has no size. It depends on what type is actually used for `t`. If we use a `u64` then it will have a size of 64 bits. If we use an `i8` then it will have a size of 8 bits. For that reason, we must ALWAYS access a trait object through a pointer because pointers always have a known size at compile time. Often people use `Box` which is a pointer to the heap, but it's a misconception that dynamic dispatch always needs a heap allocation. For example, our `dynamic_println` function did not require any heap allocations. However, `Box` is often the easiest pointer type to use which often means that dynamic dispatch will result in a heap allocation. No matter what pointer type we use though, we're still adding a pointer and a layer of indirection to access the type, which can add latency and hurt cache coherency.

Take for example the following two types that implement an 1,000,000 sized array of any type that implements `AddOne`. One version uses generics while the other uses dynamic dispatch.

Consider the following comparison between generics and dynamic dispatch.

```rust
trait AddOne {
    fn add_one(&mut self);
}

impl AddOne for i8 {
    fn add_one(&mut self) {
        *self += 1;
    }
}

struct GenericVec<T: AddOne> {
    v: [T; 1_000],
}

#[test]
fn test_generic_vec() {
    let v = [42_i8; 1_000];
    let gv = GenericVec { v };
    let start = Instant::now();
    for mut e in gv.v {
        e.add_one()
    }
    let dur = start.elapsed();
    println!("took {dur:?}");
}

struct DynamicVec {
    v: [Box<dyn AddOne>; 1_000],
}

#[test]
fn test_dynamic_vec() {
    let v: [Box<dyn AddOne>; 1_000] = std::array::from_fn(|_| Box::new(42_i8) as Box<dyn AddOne>);
    let gv = DynamicVec { v };
    let start = Instant::now();
    for mut e in gv.v {
        e.add_one();
    }
    let dur = start.elapsed();
    println!("took {dur:?}");
}
```

When running this very unscientific benchmark on my computer, the generic version takes roughly 19 microseconds while the dynamic dispatch version takes roughly 61 microseconds. So about a 3x slowdown. Notably, this does not include all the heap allocations required for the dynamic version.

## Ergonomics Tradeoffs

If runtime performance was all someone cared about, then a reasonable question might be, why would anyone use dynamic dispatch? However, runtime performance is not all that matters. Development ergonomics, or put another way, ease of use, is also an important factor. Another common misconception is that dynamic dispatch is strictly more ergonomic than generics. That's strictly not true, but overall most people agree that dynamic dispatch is easier to use than generics.

### Generic Virality

Generic types tend to have a viral nature that infect large parts of a code. Taking a look at our `GenericDatabase` type, any type that uses `GenericDatabase` needs to either be generic, use a concrete type, or use dynamic dispatch. For example, these two structs also need to be generic over the `FileSystem` trait (or they could have used dynamic dispatch).

```rust
struct GenericDatabaseWrapper<T: FileSystem> {
    db: GenericDatabase<T>,
}

struct GenericDatabaseWrapperWrapper<T: FileSystem> {
    db: GenericDatabaseWrapper<T>,
}
```

The dynamic dispatch version does not need to worry about the `FileSystem` trait.

```rust
struct DynamicDatabaseWrapper {
    db: DynamicDatabase,
}

struct DynamicDatabaseWrapperWrapper {
    dbw: DynamicDatabaseWrapper,
}
```

Oftentimes changing a single struct to be generic can turn into a very large change as the generic type propagates out all over your code base. This is especially true when altering deeply nested types. I have personally had a single change to add a generic field blow up into hundreds of lines of code changed. Removing a generic type can be just as bad because the removal of the generic type can propagate out as well.

### Cognitive Complexity

Cognitive complexity is a fairly subjective matter, so there isn't an obvious winner in this section. However, most people agree that generic code can be overly complex and hard to understand. Generic code tends to be verbose and can significantly complicate a method signature. Also when looking at generic code, you're not actually looking at the types that will be used during runtime, they need to be translated to concrete types first. You may need to perform that translation in your head to fully understand what is going on. On the other hand, after the translation happens you're using a normal plain old type, which behaves just like a normal type. With dynamic dispatch you're using a trait object which has some complexities and limitations, more on that later.

[Go famously did not add generics](https://go.dev/doc/faq#beginning_generics) for a very long time due to the complexity it would add to the language. This led to some [horrifyingly hilarious hacks](https://www.reddit.com/r/rust/comments/5penft/comment/dcsgk7n/) to add the same functionality that generics provide. 

### Mix and Match

One benefit of dynamic dispatch is that they allow you to mix and match different types within a single data structure. Consider `Vec` as an example, usually every element needs to be the same type. However, dynamic dispatch allows us to treat different types as the same type which allows us to break this invariant.

```
#[test]
fn dynamic_mix_and_match() {
    let mut v: Vec<Box<dyn Any>> = Vec::new();
    v.push(Box::new(42));
    v.push(Box::new("hello"));
    v.push(Box::new(Vec::<bool>::new()));
    v.push(Box::new(false));
}
```

This would not be possible with generics alone, you'd have to create a single type that encompasses all types that you want to mix and match.

```rust
enum IntOrStrOrBoolVecOrBool {
    I64(i64),
    Str(&'static str),
    BoolVec(Vec<bool>),
    Bool(bool),
}

#[test]
fn generic_mix_and_match() {
    let mut v = Vec::new();
    v.push(IntOrStrOrBoolVecOrBool::I64(42));
    v.push(IntOrStrOrBoolVecOrBool::Str("hello"));
    v.push(IntOrStrOrBoolVecOrBool::BoolVec(Vec::new()));
    v.push(IntOrStrOrBoolVecOrBool::Bool(false));
}
```

This approach is much more verbose and cumbersome, and it can come with a memory cost. The size of an enum is the size of its largest variant and (sometimes) a tag byte. Trait objects require two additional pointers, but different instances can be different sizes.

### Type Safety and Downcast

When using dynamic dispatch, you have to cast a concrete type into a trait object. The compiler is able to reason about these casts and tell you if there's an issue.

```rust
fn dynamic_cast(t: &dyn Display) {
    println!("{t}");
}

#[test]
fn test_dynamic_cast() {
    let i = 42;
    dynamic_cast(&i);


    let t = Mutex::new(42);
    // Fails to compile because `Mutex` does not implement `Display`.
    // dynamic_cast(&t);
}
```

The example above does not compile, because the compiler is smart enough to know that `Mutex` does not implement `Display`. However, the compiler cannot reason about casting a trait object back into a concrete type. Converting from a trait object to a concrete type requires us to [downcast](https://doc.rust-lang.org/std/any/trait.Any.html#method.downcast_ref) the trait object. The compiler is not able to reason about the downcast and it's up to the programmer to ensure that it's correct. If the programmer makes a mistake, then it results in a runtime error instead of a compile time error.

```rust
trait AnyDisplay: Display + Any {}
impl<T: Display + Any> AnyDisplay for T {}

struct DynamicProcessor {
    inner: Box<dyn AnyDisplay>,
}

impl DynamicProcessor {
    fn process(&mut self) {
        println!("{}", self.inner);
    }

    fn into_inner(self) -> Box<dyn AnyDisplay> {
        self.inner
    }
}

#[test]
fn test_dynamic_processor() {
    let t1 = Box::new(42);
    let mut processor = DynamicProcessor { inner: t1 };
    processor.process();

    let t2: Box<dyn Any> = processor.into_inner();

    // Causes a panic because `t2` is not a char.
    // let t2: Box<char> = t2.downcast().unwrap();

    // Does not compile because `dyn Any` does not implement `Add`.
    // println!("{}", *t2 + 1);

    let t2: Box<i32> = t2.downcast().unwrap();
    println!("{}", *t2 + 1);
}
```

Trying to downcast `t2` to a `char` causes a  runtime panic. Also, even though it's obvious to us that `t2` is an integer, we must explicitly downcast back from a `dyn Any` to an `i32`. As the code gets more complex and the original type creation moves farther away from the call to `downcast`, the safety of this becomes less obvious and more error prone. Note, we must first cast the trait object into `dyn Any` before downcasting it into a concrete type. This is usually perfectly safe but can involve some extra typing.

Generic types are converted into plain old regular types by the compiler. So the compiler is able to reason about the explicit type and provide type safety for its entire lifetime.

```rust
struct GenericProcessor<T: Display> {
    inner: T,
}

impl<T: Display> GenericProcessor<T> {
    fn process(&mut self) {
        println!("{}", self.inner);
    }

    fn into_inner(self) -> T {
        self.inner
    }
}

#[test]
fn test_generic_processor() {
    let t1: i32 = 42;
    let mut processor = GenericProcessor { inner: t1 };
    processor.process();
    // No cast needed, we know `t2` is an `i32`.
    let t2 = processor.into_inner();
    println!("{}", t2 + 1);
}
```

Rust knows that `t2` is an integer, because `GenericProcessor` is actually converted into `I32GenericProcessor` by the compiler. We don't lose any type information when using generics, dynamic dispatch on the other hand requires us to throw away all type information except for the implementation of a single trait. 

### Conditional Compilation

Since generic structs allow programmers to create multiple different types, they have more opportunities for type safety. Rust allows you to conditionally create methods on a subset of the concrete types created from generic types. Consider a type similar to the `GenericVec` from earlier, we can conditionally add a method to that type with the following syntax.

```rust
struct GenericDisplayVec<T: Display> {
    v: [T; 1_000],
}

impl<T: Add<Output = T> + Copy + Display> GenericDisplayVec<T> {
    fn sum(&self, other: &Self) -> Self {
        let v: [T; 1_000] = std::array::from_fn(|idx| self.v[idx] + other.v[idx]);
        GenericDisplayVec { v }
    }
}
```

This syntax means that if the inner type of `GenericVec` implements `Add`, `Copy`, and `Display`, then it will have the `sum` method. Trying to use this method would look like this.

```rust
#[test]
fn test_generic_vec_sum() {
    let iv1 = [42_i8; 1_000];
    let iv2 = [42_i8; 1_000];
    let igv1 = GenericDisplayVec { v: iv1 };
    let igv2 = GenericDisplayVec { v: iv2 };
    let igv3 = igv1.sum(&igv2);
    assert_eq!(igv3.v, [84_i8; 1_000]);

    let sv1 = ["hello"; 1_000];
    let sv2 = ["world"; 1_000];
    let _sgv1 = GenericDisplayVec { v: sv1 };
    let _sgv2 = GenericDisplayVec { v: sv2 };
    // Does not compile because the `sum` method does not exist for `GenericDisplayVec<&str>`.
    // let _sgv3 = sgv1.sum(&sgv2);
}
```

As you can see we can't call `sum` on `_sgv1`, because the method doesn't exist. Unlike a dynamic language where this might result in a runtime error, we can't even compile the program.

This feature can be combined with marker traits to add some interesting type safety. For example, let's create a trait with no methods to represent session permissions and some structs that implement this trait.

```rust
trait SessionPermissions {}
struct ReadWrite {}
impl SessionPermissions for ReadWrite {}
struct ReadOnly {}
impl SessionPermissions for ReadOnly {}
```

Neither the trait or structs actually contain any functionality, but they will be used to mark different types of sessions. Next let's create a type to represent sessions for our database.

```rust
struct Session<T: SessionPermissions> {
    _phantom: std::marker::PhantomData<T>,
}

impl<T: SessionPermissions> Session<T> {
    fn read(&self) {
        println!("I AM READING");
    }
}

impl Session<ReadWrite> {
    fn new_writer() -> Session<ReadWrite> {
        Session {
            _phantom: Default::default(),
        }
    }

    fn write(&mut self) {
        println!("I AM WRITING");
    }
}

impl Session<ReadOnly> {
    fn new_reader() -> Session<ReadOnly> {
        Session {
            _phantom: Default::default(),
        }
    }
}
```

In the above code we've defined a struct `Session` that takes a generic type `T` that implements `SessionPermissions`. The type is not actually used in the struct, it's only there to describe the privileges of the session. We're required to include a [`PhantomData`](https://doc.rust-lang.org/std/marker/struct.PhantomData.html) field because Rust requires us to use all generic types. What we've actually done is create two separate types, a read-only session type and a read-write session type. Both types have the read method, but only the read-write type has the write method. Using these types would look something like this.

```rust
#[test]
fn conditional_type_safety() {
    let mut session = Session::new_writer();
    session.read();
    session.write();

    let mut session = Session::new_reader();
    session.read();
    // Does not compile because this method does not exist.
    // session.write();
}
```

We don't have to check permissions at runtime, the permissions are compiled into the code and it's not even possible to try and write with a read-only session.

We can even convert the sessions from/to reader/writer.

```rust
impl Session<ReadWrite> {
    ...

    fn into_reader(self) -> Session<ReadOnly> {
        Session {
            _phantom: Default::default(),
        }
    }

    ...
}

impl Session<ReadOnly> {
    ...

    fn into_writer(self) -> Session<ReadWrite> {
        Session {
            _phantom: Default::default(),
        }
    }
}
```

These methods CANNOT take `&mut self`, a `Session<ReadOnly>` cannot be directly converted into a `Session<ReadWrite>` and vice versa. These are two completely separate types, so we need to make a new instance. This would be the same as trying to directly convert a `Vec` into a `HashSet` without creating a new object.

```rust
#[test]
fn converting_sessions() {
    let mut session = Session::new_writer();
    session.read();
    session.write();

    let mut session = session.into_reader();
    session.read();
    // Does not compile because this method does not exist anymore.
    // session.write();
}
```

### Dyn Compatibility

Let's revisit our `generic_add` function.

```rust
fn generic_add<T>(t1: T, t2: T)
where
    T: Add,
    <T as Add>::Output: Debug,
{
    let sum = t1 + t2;
    println!("{sum:?}")
}
```

Before reading this section, try to rewrite this function using dynamic dispatch.

...

Did you figure it out? The generic version took me about 30 seconds to write. I spent about 15 minutes, with the help of ChatGPT, on the dynamic dispatch before giving up. Why is it so hard? Conceptually it's pretty simple, accept two arguments that can be added together to produce a type that can be printed via `Debug`. Then add them together and print their sum.

The issue comes from [dyn compatibility](https://doc.rust-lang.org/reference/items/traits.html#dyn-compatibility) formerly known as object safety. When attempting to write the function you may have seen errors that look like this:

```
error[E0038]: the trait `Addable` is not dyn compatible
   --> src/main.rs:200:25
    |
200 | fn dynamic_add(t1: &dyn Addable, t2: &dyn Addable) {}
    |                         ^^^^^^^ `Addable` is not dyn compatible
    |
note: for a trait to be dyn compatible it needs to allow building a vtable
      for more information, visit <https://doc.rust-lang.org/reference/items/traits.html#dyn-compatibility>
   --> src/main.rs:198:16
    |
198 | "trait Addable: Add<Self, Output = dyn Debug> + Sized {}"
    |       -------  ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    |       |        |         |
    |       |        |         ...because it uses `Self` as a type parameter
    |       |        ...because it uses `Self` as a type parameter
    |       this trait is not dyn compatible...

```

Of the many constraints that dyn compatibility requires, `Add<Self>` breaks at least one. It uses a generic type. If we try to wrap the `Add` trait in another trait to remove the generic parameters, such as the following.

```rust
trait Addable: Add<Self, Output = dyn Debug> + Sized {}
```

We break another rule, using `Self` as a type parameter.

Understanding the rules behind dyn compatibility is often unintuitive and difficult. Fixing issues around dyn compatibility are even harder. Functionality that isn't dyn compatible is fundamentally not possible to implement using dynamic dispatch. So trying to form a mental model for dyn compatibility often requires understanding how dynamic dispatch works under the hood. Personally I find it hard to find a mental model to tie all of the rules together. It's just that if you think about how dynamic dispatch is implemented and think about how you would implement something that isn't dyn compatible, you realize it's not possible. I find that static methods are the clearest example.

Let's extend our `FileSystem` trait with a static method.

```rust
trait FileSystem {
    ...

    /// Return the name of the file system.
    fn name() -> &'static str;
}

impl FileSystem for Fat32 {
    ...

    fn name() -> &'static str {
        "FAT32"
    }
}

impl FileSystem for Ext4 {
    ...

    fn name() -> &'static str {
        "EXT4"
    }
}
```

Maybe we want to add a fun little welcome message when our database starts up.

```rust
impl<T: FileSystem> GenericDatabase<T> {
    fn welcome() -> String {
        format!(
            "Welcome the a blazingly fast database using the {} file system",
            T::name()
        )
    }

    ...
}

impl DynamicDatabase {
    fn welcome() -> String {
        format!(
            "Welcome the a blazingly fast database using the {} file system",
            FileSystem::name()
        )
    }

    ...
}
```

If you try to recompile the code, you'll see the following error.

```
error[E0038]: the trait `FileSystem` is not dyn compatible
   --> src/main.rs:233:13
    |
233 |     fs: Box<dyn FileSystem>,
    |             ^^^^^^^^^^^^^^ `FileSystem` is not dyn compatible
    |
note: for a trait to be dyn compatible it needs to allow building a vtable
      for more information, visit <https://doc.rust-lang.org/reference/items/traits.html#dyn-compatibility>
   --> src/main.rs:18:8
    |
12  | trait FileSystem {
    |       ---------- this trait is not dyn compatible...
...
18  |     fn name() -> &'static str;
    |        ^^^^ ...because associated function `name` has no `self` parameter
```

Recall that dynamic dispatch needs to look up method implementations in the vtable via a pointer in the instance of a trait object. Static methods are not associated with any instance of an object, so there's no pointer to the vtable for us to follow. To fix the issue, we need to add `&self` to the method signature.

```rust
trait FileSystem {
    ...

    /// Return the name of the file system.
    fn name(&self) -> &'static str;
}

impl FileSystem for Fat32 {
    ...

    fn name(&self) -> &'static str {
        "FAT32"
    }
}

impl FileSystem for Ext3 {
    ...

    fn name(&self) -> &'static str {
        "EXT4"
    }
}

impl<T: FileSystem> GenericDatabase<T> {
    fn welcome(&self) -> String {
        format!(
            "Welcome the a blazingly fast database using the {} file system",
            self.fs.name()
        )
    }

    ...
}

impl DynamicDatabase {
    fn welcome(&self) -> String {
        format!(
            "Welcome the a blazingly fast database using the {} file system",
            self.fs.name()
        )
    }

    ...
}
```

That usually isn't an issue, just a bit annoying because `self` is never used in the function implementation. It *is* used at runtime to lookup the method implementation in the vtable. This can be an issue if you need a static method before constructing an object, such as a constructor itself. dyn compatible objects cannot construct themselves within the trait, they must rely on external functions to construct them.

The compiler will usually give a useful error message, so the best thing to do when running into dyn compatible issues is to listen to the compiler or to restructure the code to avoid dynamic dispatch.

### Enum Escape Hatch

While generics and dynamic dispatch allow you to write code that is abstract over some set of types, they both come with their drawbacks. Often the set of types that are actually used is fairly small, in the low single digits. In those cases before reaching for generics and dynamic dispatch, ask yourself, "can I just use an enum?". Enums can often be simpler while providing the same functionality that you're looking for. Let's take a look at the database again, but this time using an enum.

```rust
enum FileSystemEnum {
    Fat32(Fat32),
    Ext4(Ext4),
}

impl FileSystemEnum {
    fn write(&mut self, file_id: u64, contents: Vec<u8>) {
        match self {
            FileSystemEnum::Fat32(fs) => fs.write(file_id, contents),
            FileSystemEnum::Ext4(fs) => fs.write(file_id, contents),
        }
    }

    fn read(&self, file_id: u64) -> Option<Vec<u8>> {
        match self {
            FileSystemEnum::Fat32(fs) => fs.read(file_id),
            FileSystemEnum::Ext4(fs) => fs.read(file_id),
        }
    }

    fn name(&self) -> &'static str {
        match self {
            FileSystemEnum::Fat32(fs) => fs.name(),
            FileSystemEnum::Ext4(fs) => fs.name(),
        }
    }
}

struct EnumDatabase {
    fs: FileSystemEnum,
    next_id: u64,
    /// The value of each key is stored in its own file ... maybe not
    /// the most efficient.
    key_map: HashMap<Vec<u8>, u64>,
}

impl EnumDatabase {
    fn welcome(&self) -> String {
        format!(
            "Welcome the a blazingly fast database using the {} file system",
            self.fs.name()
        )
    }

    fn new(fs: FileSystemEnum) -> Self {
        Self {
            fs,
            next_id: 0,
            key_map: HashMap::new(),
        }
    }

    fn set(&mut self, key: Vec<u8>, value: Vec<u8>) {
        let id = self.key_map.entry(key).or_insert_with(|| {
            let id = self.next_id;
            self.next_id += 1;
            id
        });
        self.fs.write(*id, value);
    }

    fn get(&self, key: &[u8]) -> Option<Vec<u8>> {
        let id = self.key_map.get(key)?;
        self.fs.read(*id)
    }
}
```

This almost feels like the best of both worlds, so what's the problem? Why not always use enums instead? One small issue is that it can be verbose and cumbersome. Adding a new file system requires adding a new variant to the enum and adding a branch to every function. The bigger issue is that all file system types need to be visible to the module that defines the enum, otherwise you wouldn't be able to add the new enum variant. This makes the enum approach not very extendible, which for some use cases is a non-starter. If you're releasing your database as an open source project, then users wouldn't be able to add new file systems with the enum approach. They'd have to fork your project and update the enum. With the generic and dynamic dispatch approach, they'd just have to implement a trait.

## Wrapping Up

Generics and dynamic dispatch both allow programmers to implement code that are abstract over a set of concrete types. Generics cause the compiler to generate multiple versions of the code written, while dynamic dispatch will look up type information at runtime. Generics can often allow us to add some type safety into the compilation of our program, while dynamic dispatch allows us to treat different types as the same type using trait objects.
