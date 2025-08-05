
import { useState, useCallback } from 'react';

interface ApiState<T> {
  data: T | null;
  isLoading: boolean;
  error: Error | null;
}

type ApiFunction<P extends unknown[], R> = (...args: P) => Promise<R>;

interface UseApiReturn<T, P extends unknown[], R> extends ApiState<T> {
  exec: (...args: P) => Promise<R | undefined>;
  setData: React.Dispatch<React.SetStateAction<T | null>>;
}

function useApi<T, P extends unknown[], R>(
  apiFunc: ApiFunction<P, R>,
  initialData: T | null = null
): UseApiReturn<T, P, R> {
  const [state, setState] = useState<ApiState<T>>({
    data: initialData,
    isLoading: false,
    error: null,
  });

  const exec = useCallback(async (...args: P): Promise<R | undefined> => {
    setState(prevState => ({ ...prevState, isLoading: true, error: null }));
    try {
      const result = await apiFunc(...args);
      // If apiFunc returns data that should update state.data, it must be castable to T or handled by caller.
      // For simplicity, we assume R can be T if it's for fetching data.
      // Or the caller can use setData directly.
      // For now, let's assume if R is not void, it might be T.
      if (typeof result !== 'undefined') {
         setState(prevState => ({ ...prevState, data: result as unknown as T, isLoading: false }));
      } else {
         setState(prevState => ({ ...prevState, isLoading: false }));
      }
      return result;
    } catch (err) {
      console.error("API Error:", err);
      setState(prevState => ({ ...prevState, error: err as Error, isLoading: false }));
      return undefined;
    }
  }, [apiFunc]);

  const setData = useCallback((newData: React.SetStateAction<T | null>) => {
    setState(prevState => ({...prevState, data: typeof newData === 'function' ? (newData as (prevState: T | null) => T | null)(prevState.data) : newData}));
  }, []);

  return { ...state, exec, setData };
}

export default useApi;
