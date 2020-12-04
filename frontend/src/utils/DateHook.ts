import { useMemo } from "react";
import { dayDiff } from "./Algorithm";
import { DAY_MS, useGlobalState } from "./GlobalState";
import { Homework } from "./Models";
import { desc, groupBy, keySorter } from "./Sort";

export type SortKeyType = "dueDate" | "subject" | "amount";
export type SortType<T extends SortKeyType> = Homework[T] extends Date ? number : Homework[T];

export const useDateGrouped = (hwList: Homework[], reversed: boolean) => {
    const sorted = useSorted("dueDate", hwList, !reversed);
    const { now } = useGlobalState();
    return useMemo(() => {
        if (sorted.length > 0) {
            const lastDay = sorted[sorted.length - 1][0];
            const clone = [...sorted];
            for (let day = now.getTime() + DAY_MS; day < lastDay; day += DAY_MS) {
                if (!clone.find(([n]) => n === day)) {
                    clone.push([day, []]);
                }
            }
            return clone.sort((h1, h2) => {
                const sorter = keySorter<[number, Homework[]], 0>([
                    desc<[number, Homework[]], 0>(0)
                ]);

                return (!reversed ? sorter : desc(sorter))(h1, h2);
            });
        } else {
            return []
        }
    }, [reversed, now, sorted]);
};

export const useSorted = <T extends SortKeyType>(gt: T, hwList: Homework[], reversed: boolean) => useMemo(() =>
    Array.from(groupBy(hwList, (x): SortType<T> => gt === "dueDate" ?
        ((x.extendedDueDate || x.dueDate).getTime() as SortType<T>) :
        (x[gt] as SortType<T>)))
        .map(([k, v]) => {
            const sorter = keySorter([
                "detail",
                "dueDate",
                "subject",
                desc("amount"),
            ]);

            const sorted: [SortType<T>, Homework[]] = [k, v.sort(!reversed ? sorter : desc(sorter))];
            return sorted;
        })
        .sort((h1, h2) => {
            const sorter = keySorter<[SortType<T>, Homework[]], 0>([
                desc<[SortType<T>, Homework[]], 0>(0)
            ]);

            return (reversed ? sorter : desc(sorter))(h1, h2);
        }), [hwList, gt, reversed]
);

export const usePastCheck = () => {
    const { now } = useGlobalState();
    return (date: Date) => dayDiff(date, now) > 0
};