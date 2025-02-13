import { Plugin } from 'vue';
import ElementPlus from 'element-plus';
import 'element-plus/dist/index.css';

export const useElementPlus: Plugin<void> = (app) => {
  app.use(ElementPlus);
};
