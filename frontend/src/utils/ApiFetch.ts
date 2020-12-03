import { useAuthState } from "./GlobalState";
import { AddModel, DeleteModel, Homework, LoginModel, ProgressModel, RegisterModel, SettingsModel, UpdateModel, User } from "./Models";

export const login = (model: LoginModel): Promise<User | Err> => apiCall('/auth/login', model);
export const register = (model: RegisterModel): Promise<User | Err> => apiCall('/auth/register', model);
export const changeSettings = (model: SettingsModel): Promise<User | Err> => apiCall('/api/update-user', model);

export const progressHomework = (model: ProgressModel): Promise<void | Err> => apiCallUpdate('/api/progress-homework', 'PUT', model);
export const updateHomework = (model: UpdateModel): Promise<void | Err> =>
    apiCallUpdate('/api/update-homework', 'PUT', {
        ...model,
        dueDate: naivifyDate(model.dueDate),
        extendedDueDate: naivifyDate(model.extendedDueDate),
    });

export const deleteHomework = (model: DeleteModel) => apiCallUpdate('/api/delete-homework', 'DELETE', model);

export const addHomework = async (model: AddModel): Promise<Homework | Err> => {
    let response = await fetch('/api/add-homework', {
        method: 'POST',
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(model)
    });

    if (response.ok) {
        return deserializeHw(await response.json());
    } else {
        return { err: await response.text() };
    }
}

export const getHomeworkList = async (): Promise<Homework[] | Err> => {
    let results = await fetch('/api/get-homework');
    if (results.ok) {
        return ((await results.json()) as any[]).map(hw => {
            return deserializeHw(hw);
        });
    } else {
        return { err: await results.text() };
    }
}

const deserializeHw = (hw: any): Homework => ({ ...hw, dueDate: deserializeDate(hw.dueDate), extendedDueDate: (hw.extendedDueDate ? deserializeDate(hw.extendedDueDate) : undefined) });
const deserializeDate = (s: string) => new Date(new Date(s).getTime() - 3 * 60 * 60 * 1000);
const naivifyDate = (d: Date | undefined) => d ? d.toISOString().substr(0, 10) : undefined;

export const getSubjectList = async (): Promise<string[] | Err> => {
    let results = await fetch('/api/get-subjects');
    if (results.ok) {
        return await results.json();
    } else {
        return { err: await results.text() };
    }
}

async function apiCall<T, R>(path: string, model: T): Promise<R | Err> {
    let response = await fetch(path, {
        method: 'POST',
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(model)
    });

    if (response.ok) {
        return (await response.json()) as R;
    } else {
        return { err: await response.text() };
    }
}

async function apiCallUpdate<T>(path: string, method: string, model: T): Promise<void | Err> {
    let response = await fetch(path, {
        method: method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(model)
    });

    if (!response.ok) {
        return { err: await response.text() };
    }
}

export type Err = { err: string }

export function isOk<T>(val: T | Err): val is T {
    return val === undefined || (val as { err: string }).err === undefined
}

export function isErr<T>(val: T | Err): val is Err {
    return !isOk(val)
}

export const useReloadHw = () => {
    const { setHomeworkList, setSubjectList } = useAuthState();

    return async () => {
        const _hwList = await getHomeworkList();
        setHomeworkList(new Map((isOk(_hwList) ? _hwList : []).map(hw => [hw.id, hw])));
        let _subjectList = await getSubjectList();
        setSubjectList(isOk(_subjectList) ? new Set(_subjectList) : new Set());
    }
};