import { useEffect, useMemo, useState } from "react";
import { DAY_MS, useAuthState, useNow, useVGLists } from "./GlobalState";
import { Homework } from "./Models";
import { useDateGrouped } from "./DateHook";

type WM = {
    default: typeof import("../algorithm/pkg/index");
    run_algorithm(a: [number, number][]): [number, number][];
};

export const useAlgorithm = () => {
    const { user } = useAuthState();
    const now = useNow();
    const { unfinished, completion } = useVGLists();
    const daySorted = useDateGrouped([...unfinished, ...completion], false);

    const [wasmModule, setWasmModule] = useState<null | WM>(null);

    const loadWasm = async () => {
        try {
            const wasm = await import('../algorithm/pkg');
            setWasmModule(wasm);
            console.log('wasm set');
        } catch (err) {
            console.error(`Unexpected error in loadWasm. [Message: ${err.message}]`);
        }
    };

    useEffect(() => { loadWasm() }, []);

    return useMemo(() => {
        const list: [number, number][] = daySorted
            .map(([ts, hwl]): [number, Homework[]] => [dayDiff(new Date(ts), now), hwl])
            .map(([dd, hwl]) =>
                [
                    user.weights[(new Date(now.getTime() + dd * DAY_MS).getDay() + 5) % 7],
                    hwl.reduce((acc, hw) => acc + hw.weight * (hw.amount! - hw.progress), 0)
                ]
            );
        const result = wasmModule ? wasmModule.run_algorithm(list).map(([, x]) => x) : [];
        return result;
    }, [daySorted, user.weights, now, wasmModule]);
}

export const dayDiff = (d1: Date, d2: Date) => (d1.getTime() - d2.getTime()) / DAY_MS;

