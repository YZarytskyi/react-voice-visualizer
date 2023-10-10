import { useState } from "react";

import { AnyFunction } from "../types/types";

const workerHandler = (fn: AnyFunction) => {
  onmessage = (event) => {
    postMessage(fn(event.data));
  };
};

export function useWebWorker<T, V>(fn: AnyFunction, initialValue: T) {
  const [result, setResult] = useState<T>(initialValue);

  const run = (value: V) => {
    const worker = new Worker(
      // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
      URL.createObjectURL(new Blob([`(${workerHandler})(${fn})`])),
    );
    worker.onmessage = (event) => {
      if (event.data) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
        setResult(event.data);
        worker.terminate();
      }
    };
    worker.onerror = (error) => {
      console.error(error.message);
      worker.terminate();
    };
    worker.postMessage(value);
  };

  return {
    result,
    setResult,
    run,
  };
}
