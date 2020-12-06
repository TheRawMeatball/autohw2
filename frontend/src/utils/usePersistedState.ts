import { useEffect, useState } from "react";

export function usePersistedState<T>(key: string, defaultValue: T): [T, React.Dispatch<React.SetStateAction<T>>] {
    const [state, setState] = useState(
      () => {
        const stored = localStorage.getItem(key);
        const parsed = JSON.parse(stored === null ? "null" : stored) as T;
        return typeof parsed === "undefined" || parsed === null ? defaultValue : parsed;
      }
    );
    useEffect(() => {
      localStorage.setItem(key, JSON.stringify(state));
    }, [key, state]);
    return [state, setState];
  }
  