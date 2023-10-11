import { useLayoutEffect, useRef } from "react";

type UseLatestReturnType<T> = { readonly current: T };

function useLatest<T>(value: T): UseLatestReturnType<T> {
  const valueRef = useRef(value);

  useLayoutEffect(() => {
    valueRef.current = value;
  }, [value]);

  return valueRef;
}

export default useLatest;
