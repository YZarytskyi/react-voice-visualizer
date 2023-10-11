import { useState } from "react";

import { AnyFunction, UseWebWorkerParams } from "../types/types";

const workerHandler = (fn: AnyFunction) => {
  onmessage = (event) => {
    postMessage(fn(event.data));
  };
};

export function useWebWorker<T, V>({
  fn,
  initialValue,
  onMessageReceived,
}: UseWebWorkerParams<T>) {
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
        if (onMessageReceived) onMessageReceived();
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
