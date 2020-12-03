import React, { useState } from "react";
import { Link } from 'react-router-dom';
import {
  Collapse,
  Navbar,
  NavbarToggler,
  NavbarBrand,
  Nav,
  NavLink,
  NavItem,
  NavbarText,
  Button
} from 'reactstrap';
import { useGlobalState } from './utils/GlobalState';
import { User } from "./utils/Models";

interface State {
  isOpen: boolean;
}

export function Navigation(props: {
  user?: User
}) {
  const [isOpen, setState] = useState({ isOpen: false });

  const toggle = () => {
    setState(state => {
      return {
        isOpen: !state.isOpen
      };
    });
  }

  return (
    <div>
      <Navbar color="dark" dark expand="md" className="mb-2">
        <NavbarBrand tag={Link} to="/">AutoHW</NavbarBrand>
        <NavbarToggler onClick={toggle} />
        <LoggedInItems user={props.user} state={isOpen} />
      </Navbar>
    </div>
  );
}

interface Props {
  state: State,
  user?: User,
}

function LoggedInItems(props: Props) {
  const { logout: finalLogout } = useGlobalState();

  const logout = async () => {
    fetch('/auth/logout', { method: 'POST' });
    finalLogout();
  };

  return (
    <Collapse isOpen={props.state.isOpen} navbar>
      <Nav navbar>
        <NavItem>
          <NavLink tag={Link} to="/add-homework">Ödev Ekle</NavLink>
        </NavItem>
        <NavItem>
          <NavLink tag={Link} to="/change-settings">Genel Ayarlar</NavLink>
        </NavItem>
      </Nav>
      {props.user && (
        <>
          <NavbarText className="ml-auto">{props.user.username}</NavbarText>
          <NavbarText className="ml-2">{props.user.className}</NavbarText>
          <Button className="ml-2" onClick={() => logout()}>Çıkış yap</Button>
        </>
      )}
    </Collapse>
  )
}
