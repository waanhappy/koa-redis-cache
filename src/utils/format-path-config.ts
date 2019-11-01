import pathToRegexp from 'path-to-regexp';

export interface QueryObject {
  [key: string]: string | number;
}
export interface KRCQueryConfig {
  key: string;
  matcher: (queryObject: QueryObject) => boolean;
}

export interface KRCPathConfig {
  path: string;
  expireSeconds?: number;
  query?: (string | KRCQueryConfig)[];
}

export interface FormatedPathConfig {
  pathReg: RegExp;
  expire: number;
  path: string;
  query?: {
    key: string;
    matcher?: (queryObject: QueryObject) => boolean;
  }[];
}

// 格式化path配置参数
export function formatPathConfig(paths: (string | KRCPathConfig)[], expireSeconds: number) {
  return paths.map((pathConfig) => {
    const pathMatcher = {} as FormatedPathConfig;
    if (typeof pathConfig === 'string') {
      pathMatcher.pathReg = pathToRegexp(pathConfig);
      pathMatcher.expire = expireSeconds;
      pathMatcher.path = pathConfig;
    } else {
      if (!pathConfig.path) {
        throw new Error('option.cache.paths 请配置path');
      }

      // 路径
      pathMatcher.path = pathConfig.path;

      // 路径匹配
      pathMatcher.pathReg = pathToRegexp(pathConfig.path);

      // 有效期
      pathMatcher.expire = pathConfig.expireSeconds || expireSeconds;

      // 参数匹配
      pathMatcher.query = (pathConfig.query || []).map((key) => {
        if (typeof key === 'string') {
          return {
            key,
            matcher() {
              return true;
            },
          };
        }
        return {
          key: key.key,
          matcher: key.matcher,
        };
      });
    }
    return pathMatcher;
  });
}
