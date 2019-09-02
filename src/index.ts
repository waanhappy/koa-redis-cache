import Ioredis, { Redis, RedisOptions } from 'ioredis';
import { KRCPathConfig, formatPathConfig } from './utils/format-path-config';
import { getMatchData } from './utils/get-match-data';
import { ReadStream } from 'fs';

export interface KRCOption {
  redisOption?: RedisOptions;
  client?: Redis;
  paths: (string | KRCPathConfig)[];
  expireSeconds: number;
}

export interface CacheData {
  body: string;
  type: string;
}

/**
 * 创建middleware
 * @param options 配置项
 */
export default function(options: KRCOption) {
  const { redisOption, client, expireSeconds, paths } = options;
  const redisCli = client || new Ioredis(redisOption);
  const pathConfigs = formatPathConfig(paths, expireSeconds);

  async function middleware(ctx: any, next: any) {
    const { path, query } = ctx;
    const { matched, cacheKey, expire } = getMatchData(pathConfigs, path, query);
    if (!matched) {
      await next();
      return;
    }

    try {
      // 获取缓存结果
      const cacheString = await redisCli.get(cacheKey);
      // 如果有缓存直接响应结果
      if (cacheString) {
        const dataObject = JSON.parse(cacheString);
        ctx.type = dataObject.type;
        ctx.body = dataObject.body;
        return;
      }
    } catch (e) {
      console.log(e);
    }

    try {
      await next();
      // 页面缓存
      if (!(ctx.body instanceof ReadStream)) {
        // 缓存
        redisCli.set(cacheKey, { body: ctx.body, type: ctx.type }, 'EX', expire);
      }
      return;
    } catch (e) {
      // 输出异常
      console.log(e);
    }
  }

  return middleware;
}
