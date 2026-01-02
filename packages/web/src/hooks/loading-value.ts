import { useCallback, useMemo, useState } from "react";

export type LoadingValue<T> = {
  readonly error: Error | null;
  readonly loading: boolean;
  readonly value: T | null;
  setValue: (value: T | null) => void;
  setError: (err: Error | null) => void;
};

type State<T> = Omit<LoadingValue<T>, "setValue" | "setError">;

export const useLoadingValue = <T>(): LoadingValue<T> => {
  const [state, setState] = useState<State<T>>({
    loading: true,
    value: null,
    error: null,
  });

  const setValue = useCallback((value: T | null) => {
    setState({ value, error: null, loading: false });
  }, []);

  const setError = useCallback((error: Error | null) => {
    setState({ error, value: null, loading: false });
  }, []);

  return useMemo(
    () => ({
      error: state.error,
      value: state.value,
      loading: state.loading,
      setValue,
      setError,
    }),
    [setError, setValue, state.error, state.loading, state.value],
  );
};
