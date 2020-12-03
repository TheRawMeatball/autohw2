import React, { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Alert, Button, Col, Form, FormGroup, Input, Label } from 'reactstrap';
import { addHomework, isOk } from './utils/ApiFetch';
import { SendState } from './utils/Models';
import { useAuthState } from './utils/GlobalState';
import SubjectSearch from './SubjectSearch';

function AddHomework() {
  type Model = {
    detail: string;
    subject: string;
    dueDate: Date;
    amount: string;
    forSelf: boolean;
  };

  const { setHomeworkList } = useAuthState();

  const { register, handleSubmit, errors, control } = useForm<Model>();

  const [sending, setSending] = useState(SendState.None);
  const [error, setError] = useState("");

  const onSubmit = async (model: Model) => {
    setSending(SendState.InProgress);
    const result = await addHomework({ ...model, amount: parseInt(model.amount) });
    if (isOk(result)) {
      setError("");
      setHomeworkList(l => new Map([...l.values(), result].map(hw => [hw.id, hw])));
    } else {
      switch (result.err) {
        default:
          setError("Server hatası");
          break;
      }
    }
    setSending(SendState.Complete);
  };

  return (
    <Col>
      <h1 className="text-center">Ödev ekle</h1>
      <Form onSubmit={handleSubmit(onSubmit)} className={(sending === SendState.InProgress ? "loading" : "")}>
        <FormGroup>
          <Label for="detail">Detay</Label>
          <Input type="text" name="detail" id="detail" innerRef={register({ required: true })} />
        </FormGroup>
        {errors.detail ? ([
          (errors.detail.type === "required" && (<Alert color="danger">Detay yazın.</Alert>)),
        ]) : null}
        <FormGroup>
          <Label for="subject">Ders</Label>
          <Controller
            control={control}
            name="subject"
            render={({ onChange, value }) => (
              <SubjectSearch value={value} onChange={onChange} />
            )}
            rules={{
              required: true,
            }}
          />
        </FormGroup>
        {errors.subject ? ([
          (errors.subject.type === "required" && (<Alert color="danger">Ders yazın.</Alert>)),
        ]) : null}
        <FormGroup>
          <Label for="due-date">Son tarih</Label>
          <Input type="date" name="dueDate" id="due-date" innerRef={register({ required: true })} />
        </FormGroup>
        {errors.dueDate ? ([
          (errors.dueDate.type === "required" && (<Alert color="danger">Son tarih yazın.</Alert>)),
        ]) : null}
        <FormGroup>
          <Label for="amount">Miktar</Label>
          <Input type="number" name="amount" id="amount" innerRef={register({ min: 0 })} />
        </FormGroup>
        {errors.amount ? ([
          (errors.amount.type === "min" && (<Alert color="danger">Miktar negatif olamaz.</Alert>)),
        ]) : null}
        <div className="form-check">
          <Label for="for-self" className="form-check-label">
            <input type="checkbox" name="forSelf" id="for-self" className="form-check-input" ref={register} />
            Kişisel
          </Label>
        </div>
        {sending === SendState.Complete && (
          error ?
            (<Alert color="danger" className="mb-0 mt-2">{error}</Alert>) :
            (<Alert color="success" className="mb-0 mt-2">Ödev eklendi!</Alert>)
        )}
        <Button className="mt-2" color="primary" type="submit">Ekle</Button>
      </Form>
    </Col>
  );
}

export default AddHomework;
