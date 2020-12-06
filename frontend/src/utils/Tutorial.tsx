import React, { useEffect, useState } from "react";
import { Button, Col, Modal, ModalBody, ModalFooter, ModalHeader, Popover, PopoverBody, PopoverHeader, Row } from "reactstrap";
import { usePersistedState } from "./usePersistedState";

export function Tutorial(props: { items: [string, string][], lsKey: string }) {
	const [activePanel, setActivePanel] = usePersistedState(props.lsKey, -2);
	const incrementPanel = (d: number) => setActivePanel(s => s + d);

	const [modal, setModal] = useState(activePanel === -2);
	const [loaded, setLoaded] = useState(false);
	
	useEffect(() => setLoaded(true), []);

	return (<>
		<Modal isOpen={modal} toggle={() => setModal(s => !s)}>
			<ModalHeader>Tanıtım</ModalHeader>
			<ModalBody>Henüz sistemi kullanmadıysanız bir tanıtım ister misiniz?</ModalBody>
			<ModalFooter>
				<Button color="primary" onClick={() => {
					setActivePanel(0);
					setModal(false);
				}}>
					Evet
				</Button>
				<Button color="secondary" onClick={() => {
					setActivePanel(-1);
					setModal(false);
				}}>
					Hayır
				</Button>
				<Button color="secondary" onClick={() => {
					setModal(false);
				}}>
					Sonra
				</Button>
			</ModalFooter>
		</Modal>
		{props.items.map(([id, description], i) => (
			<Popover target={id} isOpen={activePanel === i && loaded}>
				<PopoverHeader>{description}</PopoverHeader>
				<PopoverBody>
					<Row>
						<Col className="d-inline-flex">
							{activePanel > 0 ? <Button className="mr-2" onClick={() => incrementPanel(-1)}>Geri</Button> : null}
							<Button className="ml-auto" onClick={() => incrementPanel(1)}>
								{activePanel === props.items.length - 1 ? "Bitir" : "Devam"}
							</Button>
						</Col>
					</Row>
				</PopoverBody>
			</Popover>
		))}
	</>);
}