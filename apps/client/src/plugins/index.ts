import { Plugin } from 'vue';
import { useElementPlus } from './elementPlus';
import { usePinia } from './pinia';
import { router } from '@/router';

export const usePlugins: Plugin<void> = (app) => {
  app.use(useElementPlus);
  app.use(usePinia);
  app.use(router);
};
