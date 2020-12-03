import Fuse from "fuse.js";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { Input, InputProps } from "reactstrap";

type KeyedOmit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>;
type KnownKeys<T> = { [K in keyof T]: string extends K ? never : number extends K ? never : K } extends { [_ in keyof T]: infer U } ? U : never;
type Known<T> = Pick<T, KnownKeys<T>>;

type P<T> = {
  fuse: Fuse<T>,
  elementValue: (item: T) => string,
  display?: (item: T) => JSX.Element,
  value?: string,
  onChange?: (nv: string, results: T[]) => void,
  onFocus?: (e: React.FocusEvent) => void,
  onBlur?: (e: React.FocusEvent) => void,
}

type OExtend<T, E> = T & KeyedOmit<Known<E>, (keyof Known<E>) & (keyof T)>;
type Extender<B, E, K extends keyof OExtend<B, E>> = KeyedOmit<OExtend<B, E>, K>;

export function Typeahead<T>(props: Extender<P<T>, InputProps, "type" | "autoComplete">) {
  const { onChange, value, fuse, onFocus, onBlur, elementValue, display, ...rest } = props;
  const valueRef = useRef(value);
  const [focused, _setFocus] = useState(false);
  const focusedRef = useRef(focused);
  const setFocus = (e: React.FocusEvent, f: boolean) => {
    focusedRef.current = f;
    _setFocus(f);
    if (f) {
      if (onFocus) { onFocus(e); }
    }
    else {
      if (onBlur) { onBlur(e); }
    }
  }
  const [results, _setResults] = useState<T[]>([]);
  const resultsRef = useRef(results);
  const setResults = useCallback((r: T[]) => {
    resultsRef.current = r;
    _setResults(r);
  }, [_setResults, resultsRef]);
  const [selected, _setSelected] = useState(-1);
  const selectedRef = useRef(selected);
  const setSelected = (n: number) => {
    selectedRef.current = n;
    _setSelected(n);
  };

  const setValue = (nv: string) => {
    const r = Array.from(new Set(fuse?.search(nv).map(x => x.item))) || [];
    if (onChange) { onChange(nv, r); }
    setResults(r);
    valueRef.current = nv;
  }

  let memoizedSetValue = useCallback(setValue, [fuse, onChange, setResults]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!focusedRef.current) { return; }
      const r = resultsRef.current;
      const s = selectedRef.current;

      switch (e.key) {
        case "ArrowUp":
          setSelected(s - 1 === -2 ? r.length - 1 : s - 1);
          break;
        case "ArrowDown":
          setSelected(s + 1 === r.length ? -1 : s + 1);
          break;
        case "Enter":
          if (s === -1) { return; }
          memoizedSetValue(elementValue(r[s]) || valueRef.current || "");
          setSelected(-1);
          break;
        default:
          return;
      }
      e.preventDefault();
    };

    window.addEventListener('keydown', handler);

    return () => {
      window.removeEventListener('keydown', handler);
    };
  }, [memoizedSetValue, elementValue]);

  return (
    <>
      <Input
        type="text"
        autoComplete="off"
        value={value}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setValue(e.target.value)}
        onFocus={e => setFocus(e, true)}
        onBlur={e => setFocus(e, false)}
        {...rest}
      />
      {results.length > 0 && focused && (
        <div className="typeahead" onMouseDown={(e) => e.preventDefault()}>
          {results.map((r, i) => {
            return (
              <div
                className={selected === i ? "selected" : ""}
                onClick={() => { setValue(elementValue(r)); }}
              >
                {(display || elementValue)(r)}
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}