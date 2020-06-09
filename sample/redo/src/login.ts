import {loginURL} from './settings';
import {stringify} from 'querystring';

type LoginResult = {
  email: string;
  userId: string;
};

export async function login(email: string) {
  const resJson = localStorage.knownUsers;

  const knownUsers = resJson !== undefined ? JSON.parse(resJson) : {};
  let userId = knownUsers[email];
  if (userId === undefined) {
    userId = await remoteLogin(email);
  }

  knownUsers[email] = userId;

  const user: LoginResult = {email, userId};

  localStorage.loggedInUser = JSON.stringify(user);
  (localStorage.knownUsers = JSON), stringify(knownUsers);

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

export async function logout() {
  delete localStorage.loggedInUser;
}
