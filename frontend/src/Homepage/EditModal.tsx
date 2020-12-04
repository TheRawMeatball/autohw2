import React, { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { Alert, Button, Form, FormGroup, Input, InputGroup, Label, Modal, ModalBody, ModalFooter, ModalHeader } from "reactstrap";
import SubjectSearch from "../SubjectSearch";
import { deleteHomework, isOk, updateHomework } from "../utils/ApiFetch";
import { usePastCheck } from "../utils/DateHook";
import { useAuthState } from "../utils/GlobalState";
import { Homework, SendState } from "../utils/Models";

export function EditModal(props: {
  editedHomework: Homework | null,
  isOpen: boolean,
  toggle: () => void,
}) {
  const { editedHomework: hw, isOpen, toggle: _toggle } = props;
  const [error, setError] = useState<string | null>("");
  const { register, handleSubmit, control } = useForm<Model>();
  const [sending, setSending] = useState(SendState.None);
  const [deleteModal, setDeleteModal] = useState(false);

  const { setHomeworkList } = useAuthState();

  const toggle = () => {
    _toggle();
    setDeleteModal(false);
    setSending(SendState.None);
  }

  type Model = {
    detail: string;
    subject: string;
    forSelf: boolean;
    amount: string;
    weight: string;
    dueDate: string;
    extendedDueDate: string;
  };

  const past = usePastCheck();

  if (!hw) { return (<></>); }

  const onSubmit = async (model: Model) => {
    setSending(SendState.InProgress);
    const normalizedDate = (s: string) => new Date(new Date(s).getTime() - 3 * 60 * 60 * 1000);
    let updateModel = {
      id: hw.id,
      ...(model.amount && {
        amount: model.forSelf ?
          { me: parseInt(model.amount) } :
          { class: parseInt(model.amount) }
      }),
      ...(model.weight && { weight: parseInt(model.weight) }),
      ...(model.extendedDueDate && { extendedDueDate: normalizedDate(model.extendedDueDate) }),
      ...(model.dueDate && { dueDate: normalizedDate(model.dueDate) }),
      ...(model.subject && { subject: model.subject }),
      ...(model.detail && { detail: model.detail })
    };
    let result = await updateHomework(updateModel);
    if (isOk(result)) {
      setHomeworkList(state => new Map(state.set(hw.id, {
        ...hw,
        ...updateModel,
        amount: (model.amount ? parseInt(model.amount) : hw.amount)
      })));
      setError(null);
    } else {
      switch (result.err) {
        default:
          setError("Server hatası");
          break;
      }
    }
    setSending(SendState.Complete);
  };

  const onDelete = (forSelf: boolean) => async () => {
    const result = await deleteHomework({ id: hw.id, forSelf: forSelf });
    if (isOk(result)) {
      setHomeworkList(state => {
        const m = new Map(state.entries())
        m.delete(hw.id);
        return m;
      });
      setError(null);
      toggle();
    } else {
      switch (result.err) {
        default:
          setError("Server hatası");
          break;
      }
    }
  }

  const toggleDeleteModal = () => setDeleteModal(s => !s);

  return (<>
    <Modal isOpen={isOpen} toggle={toggle}>
      <ModalHeader toggle={toggle}>{hw.detail} ödevini düzenle</ModalHeader>
      <Form onSubmit={handleSubmit(onSubmit)} className={(sending === SendState.InProgress ? "loading" : "")}>
        <ModalBody>
          <FormGroup>
            <Label for="detail">Detay</Label>
            <Input type="text" name="detail" id="detail" innerRef={register} />
          </FormGroup>

          <FormGroup>
            <Label for="subject">Ders</Label>
            <Controller
              control={control}
              name="subject"
              render={({ onChange, value }) => (
                <SubjectSearch value={value} onChange={onChange} />
              )}
            />
          </FormGroup>

          <FormGroup>
            <Label for="due-date">Son tarih</Label>
            <Input type="date" name="dueDate" id="due-date" innerRef={register} />
          </FormGroup>

          {past(hw.dueDate) && (
            <FormGroup>
              <Label for="extended-due-date">Tamamlama tarihi</Label>
              <Input type="date" name="extendedDueDate" id="extended-due-date" innerRef={register} />
            </FormGroup>
          )}

          <FormGroup>
            <Label for="amount">Miktar</Label>
            <InputGroup>
              <Input type="number" name="amount" id="amount" className={hw.personal ? "rounded" : " "} innerRef={register} />
              <div className="input-group-append">
                {!hw.personal && <div className="input-group-text">
                  <span className="mr-2">Kişisel değiştir</span>
                  <input type="checkbox" name="forSelf" id="for-self" ref={register} />
                </div>}
              </div>
            </InputGroup>
          </FormGroup>

          <FormGroup>
            <Label for="weight">Ağırlık</Label>
            <Input type="number" name="weight" id="weight" innerRef={register} />
          </FormGroup>

          {sending === SendState.Complete && (
            error ?
              (<Alert color="danger" className="mb-0 mt-2">{error}</Alert>) :
              (<Alert color="success" className="mb-0 mt-2">Ödev değiştirildi!</Alert>)
          )}
        </ModalBody>
        <ModalFooter>
          <Button type="submit" className="mr-2 " color="primary">Değiştir</Button>
          <Button className="mr-2" color="danger" onClick={toggleDeleteModal}>Sil</Button>
          <Button color="secondary" onClick={toggle}>İptal</Button>
        </ModalFooter>
      </Form>
    </Modal>
    <Modal isOpen={deleteModal} toggle={toggleDeleteModal}>
      <ModalHeader toggle={toggleDeleteModal}>Emin misiniz?</ModalHeader>
      <ModalBody>
        {hw.detail} ödevini silmek istediğinize emin misiniz?
      </ModalBody>
      <ModalFooter>
        {!hw.personal ? (<>
          <Button className="mr-2" color="danger" onClick={onDelete(true)}>Benim için sil</Button>
          <Button className="mr-2" color="danger" onClick={onDelete(false)}>Sınıf için sil</Button>
        </>) : (<>
          <Button className="mr-2" color="danger" onClick={onDelete(false)}>Sil</Button>
        </>)
        }
        <Button color="secondary" onClick={toggleDeleteModal}>İptal</Button>
      </ModalFooter>
    </Modal>
  </>);
}