import React, { useState } from 'react';
import { useAuthState, useGlobalState } from './utils/GlobalState';
import { Alert, Button, Col, Form, FormGroup, Input, InputGroup, Label, Row } from 'reactstrap';
import { useForm } from "react-hook-form";
import { changeSettings, isOk } from "./utils/ApiFetch";
import { SendState, SettingsModel } from './utils/Models';

const ChangeSettings = () => {
  type Model = {
    username: string;
    password: string;
    confirmPassword: string;
    grade: string;
    letter: string;
    mo: string;
    tu: string;
    we: string;
    th: string;
    fr: string;
    sa: string;
    su: string;
  };

  const { register, handleSubmit, watch, errors } = useForm<Model>();
  const [sending, setSending] = useState(SendState.None);
  const [error, setError] = useState<string | null>("");

  const { login: loginState } = useGlobalState();
  const { user } = useAuthState();

  const onSubmit = async (model: Model) => {
    setSending(SendState.InProgress);
    const m: SettingsModel = {
      username: model.username ? model.username : undefined,
      password: model.password ? model.password : undefined,
      class: model.letter && model.grade ? [parseInt(model.grade), model.letter] : undefined,
      weights: [model.mo, model.tu, model.we, model.th, model.fr, model.sa, model.su].map(s => parseInt(s))
    }
    let result = await changeSettings(m);
    if (isOk(result)) {
      loginState(result);
      setError(null);
    } else {
      switch (result.err) {
        case "User Exists":
          setError("Kullanıcı adı alındı.");
          break;
        default:
          setError("Server hatası");
          break;
      }
    }
    setSending(SendState.Complete);
  };

  const weekdayDateMap = {
    Mon: new Date('2020-01-06'),
    Tue: new Date('2020-01-07'),
    Wed: new Date('2020-01-08'),
    Thu: new Date('2020-01-09'),
    Fri: new Date('2020-01-10'),
    Sat: new Date('2020-01-11'),
    Sun: new Date('2020-01-12'),
  };

  const getDayOfWeek = (shortName: keyof typeof weekdayDateMap, locale = 'tr', length = 'short') =>
    new Intl.DateTimeFormat(locale, { weekday: length }).format(weekdayDateMap[shortName]);

  const days: string[] = []

  for (const key in weekdayDateMap) {
    days.push(getDayOfWeek(key as keyof typeof weekdayDateMap, "tr"));
  }

  return (
    <Col lg>
      <h1 className="text-center">Hesap ayarları</h1>
      <Form onSubmit={handleSubmit(onSubmit)} className={(sending === SendState.InProgress ? "loading" : "")}>
        <FormGroup>
          <Label for="name">Kullanıcı adı değiştir</Label>
          <Input type="text" name="username" id="name" innerRef={register} />
        </FormGroup>
        <FormGroup>
          <Label for="password">Şifre değiştir</Label>
          <Input type="password" name="password" id="password" innerRef={register} />
        </FormGroup>
        <FormGroup>
          <Label for="confirm-password">Yeni şifreyi onayla</Label>
          <Input type="password" name="confirmPassword" id="confirm-password"
            innerRef={register({ validate: value => value === watch('password') })} />
        </FormGroup>
        {errors.confirmPassword ? ([
          (errors.confirmPassword.type === "validate" && (<Alert color="danger">Şifreler aynı değil.</Alert>)),
        ]) : null}
        <FormGroup>
          <InputGroup>
            <div style={{ width: "60%" }} className="input-group-prepend">
              <span style={{ width: "100%" }} className="input-group-text">Sınıf değiştir</span>
            </div>
            <Input type="number" name="grade" innerRef={register({ max: 13 })} />
            <Input type="select" defaultValue={user.className.charAt(user.className.length - 1)} name="letter" innerRef={register({ maxLength: 1 })}>
              {(() => {
                let arr: string[] = [];
                for (let letter = "A"; letter.charCodeAt(0) <= "L".charCodeAt(0); letter = String.fromCharCode(letter.charCodeAt(0) + 1)) {
                  arr.push(letter);
                }
                return arr.map(l => <option>{l}</option>)
              })()}
            </Input>
          </InputGroup>
        </FormGroup>
        {errors.grade ? ([
          (errors.grade.type === "max" && (<Alert color="danger">En yüksek 12. sınıf yazın.</Alert>)),
        ]) : null}
        {errors.letter ? ([
          (errors.letter.type === "maxLength" && (<Alert color="danger">1 harf yazın.</Alert>)),
        ]) : null}
        <FormGroup>
          <Label>Gün ağırlıkları</Label>
          <Row className="w-100 mx-0">
            {days.map(d =>
              <Col className="px-0 text-center">
                {d}
              </Col>
            )}
          </Row>
          <InputGroup>
            <Input type="number" name="mo" defaultValue={user.weights[0]} innerRef={register} />
            <Input type="number" name="tu" defaultValue={user.weights[1]} innerRef={register} />
            <Input type="number" name="we" defaultValue={user.weights[2]} innerRef={register} />
            <Input type="number" name="th" defaultValue={user.weights[3]} innerRef={register} />
            <Input type="number" name="fr" defaultValue={user.weights[4]} innerRef={register} />
            <Input type="number" name="sa" defaultValue={user.weights[5]} innerRef={register} />
            <Input type="number" name="su" defaultValue={user.weights[6]} innerRef={register} />
          </InputGroup>
        </FormGroup>
        {sending === SendState.Complete && (
          error ?
            (<Alert color="danger" className="mb-0 mt-2">{error}</Alert>) :
            (<Alert color="success" className="mb-0 mt-2">Değiştirildi!</Alert>)
        )}
        <Button type="submit" className="mt-2" color="primary">Değiştir</Button>
      </Form>
    </Col>
  );
}

export default ChangeSettings;
