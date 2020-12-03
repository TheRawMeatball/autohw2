import React, { useState } from 'react';
import { useGlobalState } from './utils/GlobalState';
import { Alert, Button, Col, Form, FormGroup, Input, InputGroup, Label, Row } from 'reactstrap';
import { useForm } from "react-hook-form";
import { isOk, login, register as registerWeb } from "./utils/ApiFetch";

const LoginAndRegister = () => {
  return (
    <Row>
      <Login />
      <Register />
    </Row>
  );
}

const Login = () => {
  type Model = {
    username: string;
    password: string;
  };

  const { register, handleSubmit, errors } = useForm<Model>();

  const [loggingIn, setLoading] = useState(false);
  const [error, setError] = useState<string | null>("");

  const { login: loginState } = useGlobalState();

  const onSubmit = async (model: Model) => {
    setLoading(true);
    let result = await login(model);
    if (isOk(result)) {
      loginState(result);
      setError(null);
    } else {
      switch (result.err) {
        case "Unauthorized":
          setError("Yanlış şifre veya kullanıcı adı");
          break;
        default:
          setError("Server hatası");
          break;
      }
    }
    setLoading(false);
  };
  return (
    <Col lg>
      <h1 className="text-center">Giriş yap</h1>
      <Form onSubmit={handleSubmit(onSubmit)} className={(loggingIn ? "loading" : "")}>
        <FormGroup>
          <Label for="login-name">Kullanıcı adı</Label>
          <Input type="text" name="username" id="login-name" innerRef={register({ required: true })} />
        </FormGroup>
        {errors.username ? ([
          (errors.username.type === "required" && (<Alert color="danger">Kullanıcı adı yazın.</Alert>)),
        ]) : null}
        <FormGroup>
          <Label for="login-password">Şifre</Label>
          <Input type="password" name="password" id="login-password" innerRef={register({ required: true })} />
        </FormGroup>
        {errors.password ? ([
          (errors.password.type === "required" && (<Alert color="danger">Şifre yazın.</Alert>)),
        ]) : null}
        {error && (<Alert color="danger">{error}</Alert>)}
        <Button type="submit">Giriş yap</Button>
      </Form>
    </Col>
  );
};

const Register = () => {
  type Model = {
    username: string;
    password: string;
    confirmPassword: string;
    grade: string;
    letter: string;
  };

  const { register, handleSubmit, watch, errors } = useForm<Model>();
  const [registering, setLoading] = useState(false);
  const [error, setError] = useState<string | null>("");

  const { login: loginState } = useGlobalState();

  const onSubmit = async (model: Model) => {
    setLoading(true);
    const m = { ...model, grade: parseInt(model.grade) }
    let result = await registerWeb(m);
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
    setLoading(false);
  };

  return (
    <Col lg>
      <h1 className="text-center">Hesap aç</h1>
      <Form onSubmit={handleSubmit(onSubmit)} className={(registering ? "loading" : "")}>
        <FormGroup>
          <Label for="register-name">Kullanıcı adı</Label>
          <Input type="text" name="username" id="register-name" innerRef={register({ required: true })} />
        </FormGroup>
        {errors.username ? ([
          (errors.username.type === "required" && (<Alert color="danger">Kullanıcı adı yazın.</Alert>)),
        ]) : null}
        <FormGroup>
          <Label for="register-password">Şifre</Label>
          <Input type="password" name="password" id="register-password" innerRef={register({ required: true })} />
        </FormGroup>
        {errors.password ? ([
          (errors.password.type === "required" && (<Alert color="danger">Şifreyi yazın.</Alert>)),
        ]) : null}
        <FormGroup>
          <Label for="confirm-password">Şifreyi onayla</Label>
          <Input type="password" name="confirmPassword" id="confirm-password"
            innerRef={register({ required: true, validate: value => value === watch('password') })} />
        </FormGroup>
        {errors.confirmPassword ? ([
          (errors.confirmPassword.type === "validate" && (<Alert color="danger">Şifreler aynı değil.</Alert>)),
          (errors.confirmPassword.type === "required" && (<Alert color="danger">Şifreyi tekrar yazın.</Alert>)),
        ]) : null}
        <FormGroup>
          <InputGroup>
            <div style={{ width: "60%" }} className="input-group-prepend">
              <span style={{ width: "100%" }} className="input-group-text">Sınıf</span>
            </div>
            <Input type="number" name="grade" innerRef={register({ required: true, max: 13 })} />
            <Input type="text" name="letter" innerRef={register({ required: true, maxLength: 1 })} />
          </InputGroup>
        </FormGroup>
        {errors.grade ? ([
          (errors.grade.type === "max" && (<Alert color="danger">En yüksek 12. sınıf yazın.</Alert>)),
          (errors.grade.type === "required" && (<Alert color="danger">Sınıfınızı yazın</Alert>)),
        ]) : null}
        {errors.letter ? ([
          (errors.letter.type === "maxLength" && (<Alert color="danger">1 harf yazın.</Alert>)),
          (errors.letter.type === "required" && (<Alert color="danger">Şubenizi yazın.</Alert>)),
        ]) : null}
        {error && (<Alert color="danger">{error}</Alert>)}
        <Button type="submit" class="btn btn-primary">Hesap aç</Button>
      </Form>
    </Col>
  );
};

export default LoginAndRegister;
