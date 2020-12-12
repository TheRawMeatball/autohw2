import React from "react";
import { useState } from "react";
import { Button, Card, CardBody, CardHeader, CardSubtitle, Col, Input, InputGroup, Row } from "reactstrap";
import { progressHomework, updateHomework } from "../utils/ApiFetch";
import { useAuthState } from "../utils/GlobalState";
import { Homework } from "../utils/Models";

export function HomeworkCard(props: {
  openEditModal: () => void,
  homework: Homework,
}) {
  const { homework: hw, openEditModal } = props;
  const [amountSetState, setState] = useState(0);
  const [forSelf, setForSelf] = useState("false");

  const handleChange = (event: any) => { setState(parseInt(event.target.value)); };

  const { setHomeworkList } = useAuthState();

  const clamp = (min: number, max: number) => (value: number) =>
    value < min ? min : value > max ? max : value;

  const doHomework = async (amount: number) => {
    setHomeworkList(state => {
      if (typeof hw.amount === "undefined") { return state; }
      return new Map(state.set(hw.id, { ...hw, delta: clamp(0, hw.amount - hw.progress)(hw.delta + amount) }))
    });

    let amountI32 = isFinite(amount) ? amount : 2000000000;
    await progressHomework({ id: hw.id, amount: amountI32 });
  };

  const setHomeworkAmount = async (amount: number, forMe: boolean) => {
    setHomeworkList(state => {
      return new Map(state.set(hw.id, { ...hw, amount: amount }));
    });

    await updateHomework({ id: hw.id, amount: (forMe ? { me: amount } : { class: amount }) });
  };

  return (
    <Card className="mt-2">
      <CardHeader tag="h5" className={typeof hw.amount !== "number" ? "bg-primary" : ""}>
        <Row>
          <Col>
            {hw.detail} {hw.extendedDueDate && "(Tamamlama)"}
            <CardSubtitle tag="h6" className="mt-1">{typeof hw.amount === "number" ? (hw.amount + " test var") : "Test sayısı belirlenmedi"}</CardSubtitle>
          </Col>
          <div className="col-sm-auto text-right d-sm-block d-inline-flex">
            <span className="mr-auto">{(hw.extendedDueDate || hw.dueDate).toLocaleDateString()}</span>
            <CardSubtitle tag="h6" className="mt-1">{hw.subject}</CardSubtitle>
          </div>
        </Row>
      </CardHeader>
      <CardBody>
        {typeof hw.amount !== "number" && (
          <InputGroup>
            <Input type="number" value={amountSetState} onChange={handleChange} style={{ maxWidth: "75px" }} />
            <div className="input-group-append">
              <Button onClick={() => setHomeworkAmount(amountSetState, forSelf === "on")} style={{ border: "1px solid #222" }}>Test sayısını yaz</Button>
              {!hw.personal && (
                <div className="input-group-text">
                  <span className="mr-2 text-body">Kişisel</span>
                  <input type="checkbox" name="forSelf" id="for-self" onInput={(e: React.ChangeEvent<HTMLInputElement>) => setForSelf(e.target.value)} />
                </div>
              )}
            </div>
          </InputGroup>
        )}
        {typeof hw.amount === "number" && <h4 style={{ marginBottom: 0 }}>{'☑️ '.repeat(hw.progress)}{'✅ '.repeat(hw.delta)}{'✏️ '.repeat(Math.abs(hw.amount - hw.delta - hw.progress))}</h4>}
        {typeof hw.amount === "number" && (
          <div className="d-flex flex-wrap w-100">
            <Button className="mx-1 my-1 flex-grow-1" onClick={() => { doHomework(1) }}>Test bitir</Button>
            <Button className="mx-1 my-1 flex-grow-1" onClick={() => { doHomework(Infinity) }}>Hepsini bitir</Button>
            <Button className="mx-1 my-1 flex-grow-1" onClick={() => { doHomework(-1) }}>Geri al</Button>
            <Button className="mx-1 my-1 flex-grow-1" onClick={() => { openEditModal() }}>Düzenle</Button>
          </div>
        )}
      </CardBody>
    </Card>
  );
}