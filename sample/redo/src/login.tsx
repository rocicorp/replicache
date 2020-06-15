import React, {useRef, useEffect, useCallback} from 'react';

import {loginURL} from './settings';

export type LoginResult = {
  email: string;
  userId: string;
};

function loggedInUser(): LoginResult | undefined {
  const resJSON = localStorage.loggedInUser;
  if (resJSON === undefined) {
    return undefined;
  }
  return JSON.parse(resJSON);
}

async function login(email: string) {
  const resJSON = localStorage.knownUsers;

  const knownUsers = resJSON !== undefined ? JSON.parse(resJSON) : {};
  let userId = knownUsers[email];
  if (userId === undefined) {
    userId = await remoteLogin(email);
  }

  knownUsers[email] = userId;

  const user: LoginResult = {email, userId};

  localStorage.loggedInUser = JSON.stringify(user);
  localStorage.knownUsers = JSON.stringify(knownUsers);

  return user;
}

async function remoteLogin(email: string) {
  const resp = await fetch(loginURL, {
    method: 'POST',
    body: JSON.stringify({email}),
  });
  if (resp.status === 200) {
    const val = await resp.json();
    return val.id.toString();
  } else {
    throw new Error(`Failed to login. Status code: ${resp.status}.`);
  }
}

export function logout() {
  delete localStorage.loggedInUser;
}

type LoginScreenProps = {
  onChange: (loginResult: LoginResult) => void;
};

export function LoginScreen(props: LoginScreenProps) {
  const {onChange} = props;
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const loginResult = loggedInUser();
    if (loginResult !== undefined) {
      onChange(loginResult);
    }
  }, [onChange, ref]);

  const submitCallback = useCallback(
    async e => {
      e.preventDefault();
      const loginResult = await login(ref.current!.value);
      onChange(loginResult);
    },
    [onChange],
  );

  return (
    <form onSubmit={submitCallback}>
      <input placeholder="Email" ref={ref} />
      <button type="submit">Login</button>
    </form>
  );
}
