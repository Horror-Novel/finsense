import { useState } from "react";

/**
 * EVENT LOOP DEMONSTRATION COMPONENT
 *
 * This component intentionally demonstrates JavaScript event loop scheduling,
 * specifically the order of execution between Synchronous tasks, Microtasks 
 * (Promises, queueMicrotask), and Macrotasks (setTimeout).
 */
export default function EventLoopDemo() {
  const [logs, setLogs] = useState([]);

  const handleRunDemo = () => {
    // Clear previous logs
    setLogs([]);
    
    // We'll collect the logs synchronously and asynchronously, 
    // then update state so React renders them in the order they execute.
    const addLog = (msg) => {
      setLogs((prev) => [...prev, msg]);
    };

    // 1. Synchronous Code (Executes immediately on the call stack)
    addLog("1. Sync execution started");

    // 2. Macrotask (Executes in the next iteration of the event loop)
    setTimeout(() => {
      addLog("5. Macrotask (setTimeout) executed");
    }, 0);

    // 3. Microtask via Promise (Executes after current synchronous code, before macrotasks)
    Promise.resolve().then(() => {
      addLog("3. Microtask (Promise) executed");
    });

    // 4. Microtask via queueMicrotask (Executes in the same microtask queue)
    queueMicrotask(() => {
      addLog("4. Microtask (queueMicrotask) executed");
    });

    // 5. More Synchronous Code
    addLog("2. Sync execution finished");
  };

  return (
    <div className="stagger-in card-hover relative col-span-full mt-6 overflow-hidden rounded-xl border border-line bg-surface p-6" style={{ "--delay": "300ms" }}>
      <div className="card-accent-line" aria-hidden />
      <h3 className="mb-2 text-sm font-medium text-ink">JavaScript Concept: Event Loop (Tasks & Microtasks)</h3>
      <p className="mb-4 text-xs text-ink/50">
        This panel exercises explicit scheduling. It demonstrates how the JavaScript engine prioritizes 
        synchronous code, then microtasks (<code>Promise.then</code>, <code>queueMicrotask</code>), and finally macrotasks (<code>setTimeout</code>).
      </p>
      
      <button 
        onClick={handleRunDemo}
        className="rounded-full bg-forest px-4 py-2 text-xs font-semibold text-paper hover:bg-forest-light transition-colors"
      >
        Run Event Loop Demo
      </button>

      {logs.length > 0 && (
        <div className="mt-4 flex flex-col gap-1 rounded bg-paper p-3 font-mono text-xs text-ink/70 border border-line">
          {logs.map((log, i) => (
            <div key={i} className="whitespace-pre-wrap">{log}</div>
          ))}
        </div>
      )}
    </div>
  );
}
