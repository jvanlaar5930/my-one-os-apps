Pending Application Name: "Prime Cruncher" 🔢

A multi-threaded prime calculator that proves UI responsiveness by running Sieve of Eratosthenes in a background worker while the main thread animates continuously.

**Features:**
- Input field (default 1,000,000) to set the search range
- Background worker spawned via `os.workers.spawn()` running Sieve of Eratosthenes
- Progress bar and live counter ("X primes found") updated every ~50ms from the worker
- CSS spinner animation on main thread (proves UI is not blocked during computation)
- Final results: total count and elapsed time (e.g. "78,498 primes in 3.24s")
- Cancel button to terminate the worker mid-calculation

**Bridge & data:**
- `os.workers.spawn()`, `worker.postMessage()`, `worker.onMessage()`, `worker.terminate()` (no other APIs needed)
- No storage, filesystem, AI, or database

**Layout:**
- Form: number input + Start/Cancel buttons
- Running state: animated spinner, progress bar with percentage, live counter
- Results display: final count and elapsed time

**Build steps:**
1. Create HTML & CSS: form (input, buttons), progress bar (styled `<div>` with width %), counter text, rotating spinner (`@keyframes`), results section
2. Write Sieve of Eratosthenes as a worker code string: receive upper limit via postMessage, run sieve, send progress every ~50ms with `{ type: "progress", percent, count }`, send `{ type: "done", primes, elapsed }` on completion
3. Main JS form submit: validate input, spawn worker with sieve code, record start time, show running UI state
4. Set `worker.onMessage()` listener: handle progress (update bar width and counter), handle done (display results and elapsed time)
5. Implement cancel button: call `worker.terminate()`, reset UI, clear timer
6. Optional: `worker.onError()` handler for unexpected failures