import { createContext, useContext } from 'react';
import { Homework, User, VisibilityGroup } from './Models';

export const DAY_MS = 1000 * 60 * 60 * 24;

export type GlobalContext = {
    login: (user: User) => void,
    logout: () => Promise<void>,
}

export type AuthContext = {
    user: User,
    subjectList: Set<string>,
    homeworkList: Map<string, Homework>,
    setSubjectList: (a: React.SetStateAction<Set<string>>) => void
    setHomeworkList: (a: React.SetStateAction<Map<string, Homework>>) => void
}

export type VisibilityGroupsContext = { [P in VisibilityGroup]: Homework[] };

export const GlobalContextObject = createContext<GlobalContext>(null as unknown as GlobalContext);
export const AuthContextObject = createContext<AuthContext>(null as unknown as AuthContext);
export const VGContextObject = createContext<VisibilityGroupsContext>(null as unknown as VisibilityGroupsContext);
export const NowContextObject = createContext<Date>(null as unknown as Date);

export const useGlobalState = () => useContext(GlobalContextObject);
export const useAuthState = () => useContext(AuthContextObject);
export const useVGLists = () => useContext(VGContextObject);
export const useNow = () => useContext(NowContextObject)