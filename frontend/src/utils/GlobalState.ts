import { createContext, useContext } from 'react';
import { Homework, User, VisibilityGroupsList } from './Models';

export const DAY_MS = 1000 * 60 * 60 * 24;

export type GlobalContext = {
    login: (user: User) => void,
    logout: () => Promise<void>,
    now: Date,
}

export type AuthContext = {
    user: User,
    subjectList: Set<string>,
    homeworkList: Map<string, Homework>,
    lists: VisibilityGroupsList,
    setSubjectList: (a: React.SetStateAction<Set<string>>) => void
    setHomeworkList: (a: React.SetStateAction<Map<string, Homework>>) => void
}

export const GlobalContextObject = createContext<GlobalContext>(null as unknown as GlobalContext);

export const AuthContextObject = createContext<AuthContext>(null as unknown as AuthContext);

export const useGlobalState = () => useContext(GlobalContextObject);
export const useAuthState = () => useContext(AuthContextObject);