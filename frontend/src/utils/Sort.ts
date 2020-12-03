type Comparable = number | string | Date | Comparable[] | undefined | null;

export function compare<T extends Comparable>(s1: T, s2: T): number {
    const predicate = [(typeof s1 === "undefined" || s1 === null), (typeof s2 == "undefined" || s2 === null)];
    if (predicate[0] === true && predicate[1] === true) { return 0; }
    else if (predicate[0] === false && predicate[1] === true) { return 1; }
    else if (predicate[0] === true && predicate[1] === false) { return -1; }

    if (typeof s1 === "number" && typeof s2 === "number") {
        return s2 - s1;
    }
    if (typeof s1 === "string" && typeof s2 === "string") {
        return s1.localeCompare(s2);
    }
    if (s1 instanceof Date && s2 instanceof Date) {
        return s2.valueOf() as number - (s1.valueOf() as number);
    }

    if (Array.isArray(s1) && Array.isArray(s2)) {
        let i = 0;
        while (true) {
            if (s1[i] && s2[i]) {
                const comp = compare(s1[i], s2[i]);
                if (comp !== 0) {
                    return comp;
                }
                i++;
            }
            return 0;
        }
    }
    throw Error("type error");
}

export const keySorter = <T extends Sortable<T, K>, K>(keys: SortKey<T, K>[]) =>
    (s1: T, s2: T) => {
        for (const key of keys) {
            let r;
            if (typeof key === "function") {
                r = (key as (s1: T, s2: T) => number)(s1, s2);
            } else {
                r = compare(s1[key], s2[key]);
            }
            if (r !== 0) { return r; }
        }
        return 0;
    };

export const groupBy = <T, K>(xs: T[], key: (x: T) => K) => {
    return xs.reduce((map, x) => {
        const oldVal = map.get(key(x));
        map.set(key(x), [...(oldVal ? oldVal : []), x]);
        return map;
    }, new Map<K, T[]>());
};

export const desc = <T extends Sortable<T, K>, K>(key: SortKey<T, K>) =>
    (s1: T, s2: T) => {
        if (typeof key === "function") {
            return -(key as (s1: T, s2: T) => number)(s1, s2);
        } else {
            return -compare(s1[key], s2[key]);
        }
    }

type Sortable<T, K extends keyof T> = {
    [P in K]?: Comparable
};

type SortKey<T extends Sortable<T, K>, K> = K | ((s1: T, s2: T) => number);