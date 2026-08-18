import { useState } from "react";

/**
 * HOISTING DEMONSTRATION COMPONENT
 *
 * This component intentionally demonstrates JavaScript hoisting for evaluation purposes.
 * It shows how function declarations are hoisted entirely, while `var` declarations
 * are hoisted but initialized to `undefined`.
 */
export default function HoistingDemo() {
  const [result, setResult] = useState("");

  // We call this function BEFORE it is declared in the code below.
  // This works because the JavaScript engine hoists function declarations
  // to the top of their scope before execution.
  const handleRunDemo = () => {
    const demoOutput = runHoistingLogic();
    setResult(demoOutput);
  };

  // 1. FUNCTION HOISTING: Declared after it is referenced above.
  function runHoistingLogic() {
    let output = "";

    // 2. VAR HOISTING: The declaration of `message` is hoisted to the top of the function,
    // but the assignment ("I am hoisted!") stays here. 
    // Therefore, accessing it before assignment yields `undefined`, not a ReferenceError.
    /* eslint-disable no-use-before-define, vars-on-top */
    output += `Before assignment, 'message' is: ${String(message)}\n`;

    var message = "I am hoisted!";
    
    output += `After assignment, 'message' is: ${message}`;
    /* eslint-enable no-use-before-define, vars-on-top */

    return output;
  }

  return (
    <div className="stagger-in card-hover relative col-span-full mt-6 overflow-hidden rounded-xl border border-line bg-surface p-6" style={{ "--delay": "250ms" }}>
      <div className="card-accent-line" aria-hidden />
      <h3 className="mb-2 text-sm font-medium text-ink">JavaScript Concept: Hoisting Demonstration</h3>
      <p className="mb-4 text-xs text-ink/50">
        This panel deliberately exercises function and <code>var</code> hoisting. The underlying logic calls a function before it is declared, and reads a <code>var</code> before it is assigned.
      </p>
      
      <button 
        onClick={handleRunDemo}
        className="rounded-full bg-forest px-4 py-2 text-xs font-semibold text-paper hover:bg-forest-light transition-colors"
      >
        Run Hoisting Demo
      </button>

      {result && (
        <pre className="mt-4 rounded bg-paper p-3 font-mono text-xs text-ink/70 whitespace-pre-wrap border border-line">
          {result}
        </pre>
      )}
    </div>
  );
}
