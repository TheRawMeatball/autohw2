
export type RegisterModel = {
    username: string;
    password: string;
    grade: number;
    letter: string;
};

export type LoginModel = {
    username: string;
    password: string;
};

export type User = {
    username: string;
    className: string;
    weights: number[];
};

export type Homework = {
    id: string;
    detail: string;
    subject: string;
    amount?: number;
    progress: number;
    delta: number;
    weight: number;
    dueDate: Date;
    personal: number;
    extendedDueDate?: Date;
};

export type UpdateModel = {
    id: string;
    detail?: string;
    subject?: string;
    amount?: { me: number } | { class: number };
    weight?: number;
    dueDate?: Date;
    extendedDueDate?: Date;
};

export type ProgressModel = {
    id: string;
    amount: number;
};

export type AddModel = {
    forSelf: boolean;
    detail: string;
    subject: string;
    amount?: number;
    dueDate: Date;
};

export type DeleteModel = {
    id: string,
    forSelf: boolean;
};

export type SettingsModel = {
    password?: string,
    username?: string,
    class?: [number, string],
    weights?: number[],
}

export enum SendState {
    None,
    InProgress,
    Complete
};

export enum VisibilityGroup {
    Finished = "finished",
    FinishedEarly = "finishedEarly",
    Unfinished = "unfinished",
    Completion = "completion",
    Expired = "expired",
}

export type VisibilityGroupsList = { [P in VisibilityGroup]: Homework[] };