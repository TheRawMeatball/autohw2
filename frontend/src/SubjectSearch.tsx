import Fuse from "fuse.js";
import React, { useMemo } from "react";
import { Typeahead } from "./Typeahead";
import { useAuthState } from "./utils/GlobalState";

export default function SubjectSearch({value, onChange}: { value: string, onChange: (s: string) => void }) {
    const { subjectList } = useAuthState();
    const fuse = useMemo(() => new Fuse(Array.from(subjectList)), [subjectList]);

    return (
        <Typeahead fuse={fuse} elementValue={s => s} value={value} onChange={onChange} />
    )
}