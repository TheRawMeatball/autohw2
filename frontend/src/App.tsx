import React, { useEffect, useMemo, useState } from 'react';
import './css/custom.scss';
import {
  BrowserRouter as Router,
  Switch,
  Route,
} from "react-router-dom";
import { Navigation } from './Navigation';
import Homepage from './Homepage';
import AddHomework from './AddHomework';
import LoginAndRegister from './AuthenticationView';
import { GlobalContextObject, GlobalContext, AuthContextObject, DAY_MS } from './utils/GlobalState';
import { Homework, User, VisibilityGroup as VG, VisibilityGroupsList } from "./utils/Models";
import { Container, Row } from 'reactstrap';
import { getHomeworkList, getSubjectList, isOk } from './utils/ApiFetch';
import ChangeSettings from './ChangeSettings';
import { groupBy } from './utils/Sort';

function date() {
  return new Date(new Date(new Date().getTime() - 8 * 60 * 60 * 1000).toDateString());
}

export default function App() {
  const [hwList, setHwList] = useState<Map<string, Homework>>(new Map());
  const [subjectList, setSubjectList] = useState<Set<string>>(new Set());
  const [now, setNow] = useState(date());
  const [user, __setUser] = useState<User | undefined>(loadUser());
  const setUser = (user: User) => {
    __setUser(user);
    _setUser(user);
  }

  useEffect(() => {
    if (!user) { return; }
    (async () => {
      const _hwList = await getHomeworkList();
      setHwList(new Map((isOk(_hwList) ? _hwList : []).map(hw => [hw.id, hw])));
      let _subjectList = await getSubjectList();
      setSubjectList(isOk(_subjectList) ? new Set(_subjectList) : new Set());
    })();
  }, [setHwList, setSubjectList, user]);

  useEffect(() => {
    const id = setInterval(() => {
      if (now.getTime() !== date().getTime()) {
        setNow(date());
      }
    }, 60000);

    return () => clearInterval(id);
  }, [now, setNow]);

  const [globalContext] = useState<GlobalContext>({
    login: user => {
      setUser(user);
    },
    logout: async () => {
      __setUser(undefined);
      localStorage.removeItem("user");
    },
    now: now,
  });

  const vgl = useMemo(() => {
    const obj = Object.fromEntries(groupBy(Array.from(hwList.values()), hw => {
      if (hw.dueDate.getTime() > now.getTime()) {
        if (typeof hw.amount !== "undefined" && hw.amount === hw.progress) {
          return VG.FinishedEarly;
        } else {
          return VG.Unfinished;
        }
      } else if (typeof hw.amount !== "undefined" && hw.amount === hw.progress) {
        return VG.Finished;
      } else if (hw.extendedDueDate && hw.extendedDueDate.getTime() > now.getTime()) {
        return VG.Completion;
      } else {
        return VG.Expired;
      }
    })) as VisibilityGroupsList;
    obj.finishedEarly = obj.finishedEarly || [];
    obj.unfinished = obj.unfinished || [];
    obj.finished = obj.finished || [];
    obj.completion = obj.completion || [];
    obj.expired = obj.expired || [];
    return obj;
  }, [now, hwList]);

  return (
    <GlobalContextObject.Provider value={globalContext}>
      <Router>
        <Container fluid className="mb-2">
          <Row>
            <main className="main-content col-lg-12 col-md-12 col-sm-12 p-0">
              <Navigation user={user} />
              <div className="main-content-container container-fluid px-4">
                <Container>
                  {user ? (
                    <AuthContextObject.Provider value={{
                      user: user,
                      subjectList: subjectList,
                      homeworkList: hwList,
                      lists: vgl,
                      setSubjectList: setSubjectList,
                      setHomeworkList: setHwList,
                    }}>
                      <LoggedInBody />
                    </AuthContextObject.Provider>
                  ) : <LoginAndRegister />}
                </Container>
              </div>
            </main>
          </Row>
        </Container>
      </Router>
    </GlobalContextObject.Provider>
  );
}

function LoggedInBody() {
  return (
    <Switch>
      <Route exact path="/add-homework">
        <AddHomework />
      </Route>
      <Route exact path="/change-settings">
        <ChangeSettings />
      </Route>
      <Route exact path="/">
        <Homepage />
      </Route>
      <Route path="/">
        <h1>NOT FOUND!</h1>
      </Route>
    </Switch>
  )
}

function loadUser(): User | undefined {
  let user = JSON.parse(localStorage.getItem("user") || "false") as (User & { expiry: number }) | null;
  if (!user) {
    return
  }

  if (user.expiry > (new Date()).getTime()) {
    return user;
  } else {
    localStorage.removeItem("user");
    return;
  }
}

function _setUser(user: User) {
  const u = { expiry: ((new Date()).getTime() + DAY_MS * 7), ...user };
  localStorage.setItem("user", JSON.stringify(u));
}