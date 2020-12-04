import React, { useMemo, useState } from 'react';
import { Button, Card, CardBody, CardHeader, CardText, Col, Collapse, Row } from 'reactstrap';
import { DAY_MS, useAuthState, useGlobalState } from './utils/GlobalState';
import { Homework } from "./utils/Models";
import { HomeworkCard } from './Homepage/HomeworkCard';
import Fuse from 'fuse.js';
import { Typeahead } from './Typeahead';
import { dayDiff, useAlgorithm } from './utils/Algorithm';
import { SortKeyType, SortType, useDateGrouped, usePastCheck, useSorted } from './utils/DateHook';
import { useReloadHw } from './utils/ApiFetch';

export default function Homepage() {
  const { lists } = useAuthState();

  const [seeFinished, setSeeFinished] = useState(false);
  const [seeFinishedEarly, setSeeFinishedEarly] = useState(true);
  const [seeUnfinishedNew, setSeeUnfinishedNew] = useState(true);
  const [seeUnfinishedCompletion, setSeeUnfinishedCompletion] = useState(true);
  const [seeExpired, setSeeExpired] = useState(false);

  const [reversedOrder, setReversedOrder] = useState(false);

  const hwList = useMemo(() => [
    ...(seeUnfinishedNew ? lists.unfinished : []),
    ...(seeUnfinishedCompletion ? lists.completion : []),
    ...(seeFinished ? lists.finished : []),
    ...(seeFinishedEarly ? lists.finishedEarly : []),
    ...(seeExpired ? lists.expired : []),
  ], [
    lists,
    seeFinishedEarly,
    seeUnfinishedCompletion,
    seeUnfinishedNew,
    seeExpired,
    seeFinished
  ]);

  const [sortingType, _setGrouping] = useState<SortKeyType>("dueDate")
  const setSorting = (key: SortKeyType) => {
    _setGrouping(key);
    setSearchbar("");
    setSearchResult([]);
  }
  const [searchbar, setSearchbar] = useState("");
  const [searchResult, setSearchResult] = useState<Homework[]>([]);

  const amountReducer = (hwl: Homework[]) => hwl.reduce((acc, hw) => acc + (hw.amount || 0), 0);

  const program = useAlgorithm();

  const cleanDated = useDateGrouped([...lists.completion, ...lists.unfinished, ...lists.finishedEarly], false);

  const dateSorted = useDateGrouped(hwList, reversedOrder);
  const subjectSorted = useSorted("subject", hwList, reversedOrder);
  const amountSorted = useSorted("amount", hwList, reversedOrder);

  const sorteds = {
    dueDate: dateSorted,
    subject: subjectSorted,
    amount: amountSorted,
  }

  const groups = sorteds[sortingType];

  const fuse = useMemo(() => new Fuse(hwList, { keys: ["detail", "subject"] }), [hwList])

  const tomorrowHw = cleanDated[0] ? cleanDated[0][1].reduce((acc, hw) => acc + (hw.amount || 0), 0) : 0;

  const [seeSettings, setSeeSettings] = useState(false);
  const [seeAlgorithmResults, setSeeAlgorithmResults] = useState(false);

  const dateString = useDateString(seeAlgorithmResults);

  const reloadHw = useReloadHw();

  return (
    <Row>
      <Col lg>
        <Card className="mt-2">
          <CardHeader tag="h3" className="text-center">
            Ödevler
          </CardHeader>
          <CardBody>
            <CardText>
              {"Yarına "}
              {tomorrowHw ? tomorrowHw + " test var, " : "test yok, "}
              {"üstüne "}
              {program[0] - tomorrowHw ? program[0] - tomorrowHw + " test yapılması öneriliyor." : "test yapılması önerilmiyor."}
            </CardText>
            <Typeahead
              fuse={fuse}
              elementValue={hw => hw.detail}
              value={searchbar}
              onChange={(v, r) => { setSearchbar(v); setSearchResult(r); }}
              display={hw => (
                <div className="d-flex">
                  <strong className="mr-auto">{hw.detail}</strong>
                  <small className="ml-auto">{hw.subject}</small>
                </div>
              )}
              placeholder="Ara"
            />
            <div className="mt-2 mb-2 flex-button-div">
              <Button onClick={reloadHw} className="flex-button">Yenile</Button>
              <StateToggleButton className="flex-button" state={seeSettings} setState={setSeeSettings}>Ayarlar</StateToggleButton>
            </div>
            <Collapse isOpen={seeSettings}>
              <h5 className="text-center">Gruplama</h5>
              <div className="mt-2 mb-1 flex-button-div">
                <StateToggleButton className="flex-button" state={seeUnfinishedNew} setState={setSeeUnfinishedNew}>Ödevler</StateToggleButton>
                <StateToggleButton className="flex-button" state={seeUnfinishedCompletion} setState={setSeeUnfinishedCompletion}>Tamamlamalar</StateToggleButton>
                <StateToggleButton className="flex-button" state={seeFinishedEarly} setState={setSeeFinishedEarly}>Erken bitenler</StateToggleButton>
                <StateToggleButton className="flex-button" state={seeExpired} setState={setSeeExpired}>Tarihi geçenler</StateToggleButton>
                <StateToggleButton className="flex-button" state={seeFinished} setState={setSeeFinished}>Bitenler</StateToggleButton>
              </div>
              <h5 className="text-center">Sıralama</h5>
              <div className="mt-2 mb-1 flex-button-div">
                <Button className="flex-button" color={((sortingType === "dueDate" && !searchResult.length) ? "primary" : "secondary")} onClick={() => setSorting("dueDate")}>Son tarih</Button>
                <Button className="flex-button" color={((sortingType === "subject" && !searchResult.length) ? "primary" : "secondary")} onClick={() => setSorting("subject")}>Ders</Button>
                <Button className="flex-button" color={((sortingType === "amount" && !searchResult.length) ? "primary" : "secondary")} onClick={() => setSorting("amount")}>Miktar</Button>
                <StateToggleButton className="flex-button" state={reversedOrder} setState={setReversedOrder}>Tersten</StateToggleButton>
              </div>
              <hr className="mx-1"/>
              <StateToggleButton className="w-100" state={seeAlgorithmResults} setState={setSeeAlgorithmResults}>Algoritma göster</StateToggleButton>
            </Collapse>
          </CardBody>
        </Card>
      </Col>
      <Col lg>
        {searchResult.length ?
          searchResult.map(hw => (
            (<HomeworkCard homework={hw} />)
          ))
          : (groups as [SortType<SortKeyType>, Homework[]][]).map(([groupHeader, hwl]) => (
            <div className="mt-2">
              <h4 className="text-center">
                {
                  typeof groupHeader !== "undefined" && groupHeader !== null ? (
                    typeof groupHeader === "string" ?
                      `${groupHeader} (${amountReducer(hwl)} test)`
                      : groupHeader > 10 ** 8 ?
                        `${dateString(new Date(groupHeader))} (${amountReducer(hwl)})`
                        : `${groupHeader} testlik ödevler`
                  ) : "Test sayısı bilinmeyenler"
                }
              </h4>
              {hwl.map(hw =>
                (<HomeworkCard homework={hw} />)
              )}
            </div>
          ))
        }
      </Col>
    </Row>
  );
}

function useDateString(seeAlgorithm: boolean) {
  const { now } = useGlobalState();
  const tomorrow = new Date(now.getTime() + DAY_MS);
  const program = useAlgorithm();
  const past = usePastCheck();
  return (date: Date) =>
    past(date) ? `${date.toDateString() === tomorrow.toDateString() ? "Yarın" : new Intl.DateTimeFormat("tr", { weekday: "long" }).format(date)}` +
      ` (${date.toLocaleDateString()})` +
      (seeAlgorithm ? ` (${program[dayDiff(date, now)] || 0})` : "")
      : `${date.toLocaleDateString()}`;
}

const StateToggleButton = ({ state, setState, children, className }:
  { state: boolean, setState: (f: (s: boolean) => boolean) => void, children: string, className?: string }) =>
  <Button className={className} color={state ? "primary" : "secondary"} onClick={() => setState(s => !s)}>{children}</Button>;