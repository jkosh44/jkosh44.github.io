---
layout: post
title:  "Generics and Dynamic Dispatch in Rust"
published: false
---
It took me a long time in my career to truly internalize and understand the difference between generics and dynamic dispatch in programming languages. The goal of this post is to explain what generics and dynamic dispatch are in Rust and compare the tradeoffs associated with them. The contents of this post are specific to Rust, but may also apply to other languages. The intended audience is someone with some to little experience in Rust, but hopefully people with more advanced knowledge can also get some value out of it. It is expected that the reader knows what [traits](https://doc.rust-lang.org/book/ch10-02-traits.html) and [trait bounds](https://doc.rust-lang.org/rust-by-example/generics/bounds.html) are. 

If I say something that's incorrect, please let me know and I will correct it.

All of code used in this blog post can be found [here](https://github.com/jkosh44/generics-vs-dynamic-dispatch-rust).

Generics and dynamic dispatch are both ways that programming languages allow you to abstract away the details of a concrete type. They allow you to specify some functionality without specifying concrete types. This can often help remove code duplication and make code more extensible.

Let's say that we want to write a database. This database is going to write and read data directly from the file system without going through that pesky OS as an intermiedary. This is a perfect use case for either generics or dynamic dispatch. First let's define an (extremely limited) trait for a file system.

```rust
trait FileSystem {
    /// Overwrite the contents of the file identified by `file_id` with `contents`.
    fn write(&mut self, file_id: u64, contents: Vec<u8>);
    /// Read the contents of the file identified by `file_id`.
    fn read(&self, file_id: u64) -> Option<&[u8]>;
}
```

Next let write some implementations of this trait. For now we'll stick to two implementations an in-memory implementation and an Ext2 implementation.

```rust
/// A file system that stores files in memory.
struct InMemoryFileSystem {
    files: HashMap<u64, Vec<u8>>,
}

impl InMemoryFileSystem {
    fn new() -> Self {
        Self {
            files: HashMap::new(),
        }
    }
}

impl FileSystem for InMemoryFileSystem {
    fn write(&mut self, file_id: u64, contents: Vec<u8>) {
        self.files.insert(file_id, contents);
    }

    fn read(&self, file_id: u64) -> Option<&[u8]> {
        self.files.get(&file_id).map(|v| v.as_slice())
    }
}

/// An implementation of the Ext2 file system.
struct Ext2 {
    /// Use your imagination and pretend that this is a real
    /// implementation instead of wrapping the in-memory
    /// implementation.
    fs: InMemoryFileSystem,
}

impl Ext2 {
    fn new() -> Self {
        Self {
            fs: InMemoryFileSystem::new(),
        }
    }
}

impl FileSystem for Ext2 {
    fn write(&mut self, file_id: u64, contents: Vec<u8>) {
        self.fs.write(file_id, contents);
    }

    fn read(&self, file_id: u64) -> Option<&[u8]> {
        self.fs.read(file_id)
    }
}
```

## Generics

Here's what a database implementation using generics might look like

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

    fn get(&self, key: &[u8]) -> Option<&[u8]> {
        let id = self.key_map.get(key)?;
        self.fs.read(*id)
    }
}
```

Notice how this implementation doesn't need to know the concrete details of the file system used. The database can use any file system as long as that file system implements the `FileSystem` trait. Using this type would look like the following

```rust
#[test]
fn test_generic_database() {
    let mut db: GenericDatabase<InMemoryFileSystem> =
        GenericDatabase::new(InMemoryFileSystem::new());
    db.set(b"ny".to_vec(), b"albany".to_vec());
    assert_eq!(db.get(b"ny"), Some(b"albany".as_slice()));

    let mut db: GenericDatabase<Ext2> = GenericDatabase::new(Ext2::new());
    db.set(b"maryland".to_vec(), b"annapolis".to_vec());
    assert_eq!(db.get(b"maryland"), Some(b"annapolis".as_slice()));
}
```

When we use generic types, the compiler is actually generating multiple different types with each concrete type we use. In our example, the compiler will generate types that look like the following

```rust
struct InMemoryDatabase {
    fs: InMemoryFileSystem,
    next_id: u64,
    /// The value of each key is stored in its own file ... maybe not
    /// the most efficient.
    key_map: HashMap<Vec<u8>, u64>,
}

impl InMemoryDatabase {
    fn new(fs: InMemoryFileSystem) -> Self {
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

    fn get(&self, key: &[u8]) -> Option<&[u8]> {
        let id = self.key_map.get(key)?;
        self.fs.read(*id)
    }
}

struct Ext2Database {
    fs: Ext2,
    next_id: u64,
    /// The value of each key is stored in its own file ... maybe not
    /// the most efficient.
    key_map: HashMap<Vec<u8>, u64>,
}

impl Ext2Database {
    fn new(fs: Ext2) -> Self {
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

    fn get(&self, key: &[u8]) -> Option<&[u8]> {
        let id = self.key_map.get(key)?;
        self.fs.read(*id)
    }
}
```

Our test will be re-written as 

```rust
#[test]
fn test_concrete_generic_database() {
    let mut db: InMemoryDatabase = InMemoryDatabase::new(InMemoryFileSystem::new());
    db.set(b"ny".to_vec(), b"albany".to_vec());
    assert_eq!(db.get(b"ny"), Some(b"albany".as_slice()));

    let mut db: Ext2Database = Ext2Database::new(Ext2::new());
    db.set(b"maryland".to_vec(), b"annapolis".to_vec());
    assert_eq!(db.get(b"maryland"), Some(b"annapolis".as_slice()));
}
```

One way to think about generics is that they are a template that the compiler will use to generate code. The amount of code generated depends on how many different concrete types are used with our generic code. In our database example, the compiler will generate two concrete types from our single generic struct.

Generics also work with functions, the concepts are mostly the same so this post will focus on type, but for completeness here's an example with a function:

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

Here's what a similar database implementation might look like, but this time using dynamic dispatch.

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

    fn get(&self, key: &[u8]) -> Option<&[u8]> {
        let id = self.key_map.get(key)?;
        self.fs.read(*id)
    }
}
```

The code looks almost identical to the genric implementation. The only difference is that we've removed the generic type, `<T: FileSystem>`, from the struct name and we've changed the type of `fs` to `Box<dyn FileSystem>`. The `dyn` keyword is a signal that this will use dynamic dispatch. `dyn FileSystem` is what's known as a [trait object](https://doc.rust-lang.org/reference/types/trait-object.html) We'll come back to why we need a `Box` later.

Similarly, this implementation doesn't need to know the concrete details of the file system used. Using this type is also similar to the generic version.

```rust
#[test]
fn test_dynamic_database() {
    let mut db: DynamicDatabase = DynamicDatabase::new(Box::new(InMemoryFileSystem::new()));
    db.set(b"ny".to_vec(), b"albany".to_vec());
    assert_eq!(db.get(b"ny"), Some(b"albany".as_slice()));

    let mut db: DynamicDatabase = DynamicDatabase::new(Box::new(Ext2::new()));
    db.set(b"maryland".to_vec(), b"annapolis".to_vec());
    assert_eq!(db.get(b"maryland"), Some(b"annapolis".as_slice()));
}
```

Unlike generics, the compiler does not generate multiple types during compile time. We only have a single type, `DynamicDatabase`. So, how does the program know what implementation of `set()` and `get()` to use during runtime?

The program uses something called a [vtable](https://en.wikipedia.org/wiki/Virtual_method_table) to look up what implementation to use during runtime. The vtable contains pointers to concrete method implementations and our dynamic type contains a pointer to the vtable. So during runtime we follow the pointers to find the concrete implementations of `set()` and `get()`. That explanation is a little hand wavy, because the goal of this post isn't to give a deep understanding of how dynamic dispatch works under the hood, what's important is to understand that dynamic dispatch will look up type information during runtime.

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

 With generics, the compiler has to generate multiple concrete types during compile time which can lead to noticable increases in compile time. One of Rusts biggest complaints is slow compile times and generics can exacerbate this issue. Dynamic dispatch on the other hand doesn't need to generate any concrete types at compile time which can lead to faster compile times.

### Binary Size

Generic code results in multiple concrete types for a single generic struct. The code for those types is included in the compiled binary, which can lead to larger binary sizes. Dynamic dispatch only has a single type which can lead to smaller binary sizes.

### Runtime

Generic code leads to regular plain old types, which have the same runtime performance as if you had defined multiple types yourself. In the database example, `GenericDatabase<Ext2>` has identical performance to `Ext2Database` because in the compiled binary they would be identical.

Dynamic dispatch on the other hand comes with runtime performance penalty. The first performance hit comes from the vtable itself. It takes time to look up function implementations in the vtable and chase pointers. Another performance hit comes from low level optimizations. The compiler and the CPU can not reason about the implementation of methods hidden behind dymanic dispatch, so the compiler cannot inline functions and the CPU has a worse time performing speculative execution and branch predictions. Dynamic dispatch also usually leads to more memory usage. Types need an extra pointer into the vtable which increases the size by a pointer width.

The final performance hit comes from the `Box`. Imagine we had the following type

```rust
#[derive(Debug)]
struct UnsizedType {
    t: dyn Debug,
}
```

How big, in bits, is this type? How much memory does it need?

What if we had the following function, which does not actually compile

```rust
fn use_unsized_type(ut: UnsizedType) {
    println!("{ut:?}");
}
```

How much stack space does this function need?

There is no answer to these questions, `UnsizedType` (as the name suggests) has no size. It depends on what type is actually used for `t`. If we use a `u64` then it will have a size of 64 bits. If we use a `i8` then it will have a size of 8 bits. For that reason, we must ALWAYS access a trait object through a pointer because pointers always have a known size at compile time. Often people use `Box` which is a pointer to the heap, but it's a misconception that dynamic dispatch always needs a heap allocation. For example, our `dynamic_println` function did not require any heap allocations. However, `Box` is often the easiet pointer type to use which often means that dynamic dispatch will result in a heap allocation. No matter what pointer type we use though, we're still adding a pointer and a layer of indirection to access the type, which can add latency and hurt cache coherency.

Take for example the following two types that implement an 1,000,000 sized array of any type. One version uses generics while the other uses dynamic dispatch.

```rust
struct GenericVec<T: Display> {
    v: [T; 1_000_000],
}

#[test]
fn test_generic_vec() {
    let v = [42_i8; 1_000_000];
    let gv = GenericVec { v };
    let start = Instant::now();
    for e in gv.v {
        println!("{e}");
    }
    let dur = start.elapsed();
    println!("took {dur:?}");
}

struct DynamicVec {
    v: [Box<dyn Display>; 1_000_000],
}

#[test]
fn test_dynamic_vec() {
    let v: [Box<dyn Display>; 1_000_000] =
        std::array::from_fn(|_| Box::new(42_i8) as Box<dyn Display>);
    let gv = DynamicVec { v };
    let start = Instant::now();
    for e in gv.v {
        println!("{e}");
    }
    let dur = start.elapsed();
    println!("took {dur:?}");
}
```

When running this very unscientific benchmark on my computer, the generic version takes roughly 43 milliseconds while the dynamic dispatch version takes roughly 71 milliseconds. So a little under 2x slowdown. Notably, this does not include all the heap allocations required for the dynamic version.

## Ergonomics Tradeoffs

If runtime performance was all someone cared about, then a reasonable question might be, why would anyone use dynamic dispatch? However, runtime performance is not all that matters. Development ergonomics, or put another way ease of use, is also an important factor. Another common misconception is that dynamic dispatch is strictly more ergonomic than generics. That's strictly not true, but overall most people agree that dynamic dispatch is easier to use than generics.

### Generic Virality

Generic types tend to have a viral nature that infect large parts of a code. Taking a look at our `GenericDatabase` type, any type that uses `GenericDatabase` needs to either be generic, use a concrete type, or use dynamic dispatch. For example, these two useless structs also need to be generic over the `FileSystem` trait (or they could have used dynamic dispatch).

```rust
struct GenericDatabaseWrapper<T: FileSystem> {
    db: GenericDatabase<T>,
}

struct GenericDatabaseWrapperWrapper<T: FileSystem> {
    db: GenericDatabaseWrapper<T>,
}
```

The dynamic dispatch version does not need to worry about about the `FileSystem` trait.

```rust
struct DynamicDatabaseWrapper {
    db: DynamicDatabase,
}

struct DynamicDatabaseWrapperWrapper {
    dbw: DynamicDatabaseWrapper,
}
```

Often times changing a single struct to be generic can turn into a very large change as the generic type propagates out all over your code base. This is especially true when altering deeply nested types.

### Cognitive Complexity

Cognitive complexity is a fairly subjective matter, so there isn't an obvious winner in this section. Many people feel that generic code can be overly complex and hard to understand. Generic code tends to be verbose and can significantly complicate a method signature. Also when looking at generic code, you're not actually looking at the types that will be used during runtime, they need to be translated to concrete types first. You may need to perform that translation in your head to fully understand what is going on. On the other hand, after the translation happens you're using a normal plain old type, which behaves just like a normal type. With dynamic dispatch you're using a trait object which has some complexities and limitations, more on that later.

### Conditional Compilation

Since a generic structs allow programmers to create multiple different types, they can allow for greater type safety. Rust allows you to conditionally create methods on a subset of the concrete types created from generic types. Consider the `GenericVec` from earlier, we can conditionally add a method to the type.

```rust
struct GenericVec<T: Display> {
    v: [T; 1_000],
}

impl<T: Add<Output = T> + Copy + Display> GenericVec<T> {
    fn sum(&self, other: &Self) -> Self {
        let v: [T; 1_000] = std::array::from_fn(|idx| self.v[idx] + other.v[idx]);
        GenericVec { v }
    }
}
```

This syntax means that if the inner type of `GenericVec` implements `Add`, `Copy`, and `Display`, then it will have the `sum` method. Trying to use this method would look like this.

```rust
#[test]
fn test_generic_vec_sum() {
    let iv1 = [42_i8; 1_000];
    let iv2 = [42_i8; 1_000];
    let igv1 = GenericVec { v: iv1 };
    let igv2 = GenericVec { v: iv2 };
    let igv3 = igv1.sum(&igv2);
    assert_eq!(igv3.v, [84_i8; 1_000]);

    let sv1 = ["hello"; 1_000];
    let sv2 = ["world"; 1_000];
    let _sgv1 = GenericVec { v: sv1 };
    let _sgv2 = GenericVec { v: sv2 };
    // Does not compile because the `sum` method does not exist for `GenericVec<&str>`.
    // let sgv3 = _sgv1.sum(&_sgv2);
}
```

As you can see we can can't call `sum` on `_sgv1`, because the method doesn't exist. Unlike a dynamic language where this might result in a runtime error, we can't even compile the program.

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

### Dyn Compatibility

STATIC HERE?

### Enum Escape Hatch
