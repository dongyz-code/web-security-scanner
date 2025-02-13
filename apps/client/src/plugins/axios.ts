import { getAxios } from '@m170/utils/browser';
import { AxiosError } from 'axios';
import { ElMessage } from 'element-plus';

import type { API } from '@/types';
import type { AxiosResponse } from 'axios';

export const API_BASE = import.meta.env.DEV ? `http://${location.hostname}:7777` : '';
// HACK: 远程调试测试环境
// export const API_BASE = '/';

export const prefix = '/api';

type RespError =
  | {
      code: string;
      msg: string;
    }
  | undefined;

type ERROR = AxiosError<{
  error: {
    code: string;
    msg: string;
  };
}>;

function respErrorHandle(error?: NonNullable<ERROR['response']>['data']['error']) {
  if (error?.code === '401') {
    ElMessage.error('身份认证失败');
    return;
  }
  console.error(error);
}

function errorOrRespHandle(payload: AxiosResponse | ERROR) {
  if (payload instanceof AxiosError) {
    const { response } = payload;
    respErrorHandle(response?.data?.error);
    return Promise.reject(payload);
  } else {
    const error = payload?.data?.error as RespError | undefined;
    if (error) {
      respErrorHandle(error);
      return Promise.reject(error);
    }
    return payload;
  }
}

export const { api } = getAxios<API>({
  /** 默认都是POST，需要使用GET的单独标记 */
  prefix: prefix,
  origin: API_BASE,
  config: {},
  callback(instance) {
    instance.interceptors.request.use(
      async function (config) {
        config.headers = Object.assign(config.headers ?? {}, {
          signature: 'signature',
        });

        return config;
      },
      function (error: ERROR) {
        return errorOrRespHandle(error);
      }
    );
    instance.interceptors.response.use(
      function (response) {
        return errorOrRespHandle(response);
      },
      function (error: ERROR) {
        return errorOrRespHandle(error);
      }
    );
  },
});
