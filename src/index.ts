import { createClient, promisifyClient } from '@webtanzhi/redis';
import { ClientOpts, RedisClient } from 'redis';
import { KRCPathConfig, formatPathConfig } from './utils/format-path-config';
import { getMatchData } from './utils/get-match-data';
import { ReadStream } from 'fs';

export interface KRCOption {
  redisOption?: ClientOpts;
  client?: RedisClient;
  paths: (string | KRCPathConfig)[];
  expireSeconds: number;
  keyPrefix?: string;
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
  const { redisOption, client, expireSeconds, paths, keyPrefix = 'redis-cache' } = options;
  const redisCli = client ? promisifyClient(client) : createClient(redisOption);
  const pathConfigs = formatPathConfig(paths, expireSeconds);

  async function middleware(ctx: any, next: any) {
    const { path, query } = ctx;
    const { matched, cacheKey, expire } = getMatchData(pathConfigs, keyPrefix, path, query);
    if (!matched) {
      await next();
      return;
    }

    try {
      // 获取缓存结果
      const cacheString = await redisCli.asyncGet(cacheKey);
      // 如果有缓存直接响应结果
      if (cacheString) {
        const dataObject = JSON.parse(cacheString);
        ctx.type = dataObject.type;
        ctx.body = dataObject.body;
        return;
      }
    } catch (e) {
      console.error(e.message);
      console.error(e.stack);
    }

    await next();

    try {
      const body = ctx.body;
      // 页面缓存
      if (!(body instanceof ReadStream)) {
        // 缓存
        redisCli.asyncSet(cacheKey, JSON.stringify({ body, type: ctx.type }), 'EX', expire);
      }
    } catch (e) {
      // 输出异常
      console.error(e.message);
      console.error(e.stack);
    }
  }

  return middleware;
}
