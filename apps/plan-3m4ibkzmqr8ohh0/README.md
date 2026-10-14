# 🔢 Prime Cruncher

Build a Prime Number Cruncher app. It should:

1. Have a number input (default 1,000,000) and a "Start" button.
2. When clicked, spawn a background worker using os.workers.spawn() that runs a 
   Sieve of Eratosthenes up to the given number.
3. The worker should send progress messages back every ~50ms with 
   { type: "progress", percent, found } so the UI can show a live progress bar 
   and running count of primes found.
4. When done, the worker sends { type: "done", count, elapsed } and terminates.
5. While the worker is running, keep a separate lightweight animation running 
   on the main thread (a simple CSS spinner or bouncing dot) to visually prove 
   the UI thread is NOT blocked.
6. Show the final count and time taken when complete.
7. Allow cancelling a running calculation (call worker.terminate()).

## Documentation

- [Build plan](plan.md)
- [Change history](CHANGELOG.md)
- [App manifest](manifest.json)

Built with **one_OS**. Install this app from this repository using the one_OS App Store.
