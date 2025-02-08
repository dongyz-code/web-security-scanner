import { LOGIN_RESPONSE } from '../_';

export type LoginController = {
  '/login': Login;
};

type Login = {
  method: 'POST';
  req:
    | {
        username: string;
        password: string;
      }
    | {
        code: string;
      };
  resp: LOGIN_RESPONSE;
};
