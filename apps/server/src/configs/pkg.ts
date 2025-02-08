import { initUuid } from "@m170/utils/node";

/** 状态更新请全局更新 .value */
export { shallowRef, computed } from "@vue/reactivity";
export {
  initQueueTask,
  dayJsformat,
  getKeys,
  getNow,
  path,
  Jwt,
  fse,
} from "@m170/utils/node";
export {
  creatFastify,
  replyError,
  fastifyHooks,
  errorSymbol,
} from "@m170/fastify";
export type { GetAPIByDir } from "@m170/fastify";
export const { uuid, uuidMd5 } = initUuid();
