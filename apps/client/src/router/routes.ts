import { RouteItem, getRoute } from './utils';

const _routes: RouteItem[] = [
  {
    path: '/',
    name: 'BasicLayout',
    redirect: '/home',
    children: [
      {
        path: 'home',
        name: 'Home',
        component: () => import('@/pages/home/index.vue'),
        meta: {
          isAuth: false,
        },
      },
    ],
  },
];

export const routes = getRoute(_routes);
