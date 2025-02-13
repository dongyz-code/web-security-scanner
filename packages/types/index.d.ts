import { LoginController } from './login/index';
import { MainController } from './main/index';

export * from './_';

export type API = {
  prefix: '/api';
  routes: {
    '/main': MainController;
    '/login': LoginController;
  };
};

import type { UnionToIntersection, Simplify } from '../server/node_modules/type-fest/index.d.ts';

export type APIDetail = Simplify<
  UnionToIntersection<
    {
      [key in keyof API['routes']]: UnionToIntersection<
        {
          [key2 in keyof API['routes'][key]]: {
            [key3 in `${key}${key2}`]: API['routes'][key][key2];
          };
        }[keyof API['routes'][key]]
      >;
    }[keyof API['routes']]
  >
>;
