import { FormatedPathConfig, QueryObject } from './format-path-config';
import { stringify } from 'querystring';

export interface MatchedObject {
  expire: number;
  path: string;
  matched: boolean;
  cacheKey?: string;
}

// 根据当前路径信息获取缓存匹配结果
export function getMatchData(pathConfigs: FormatedPathConfig[], keyPrefix: string, path: string, query: QueryObject) {
  const matchedQueryObject = {} as any;
  const matchObject = { matched: false } as MatchedObject;
  const matched = pathConfigs.some((item) => {
    const isMatch = item.pathReg.test(path);
    if (!isMatch) {
      return false;
    }
    matchObject.expire = item.expire;
    matchObject.path = item.path;

    (item.query || []).forEach(({ key, matcher }) => {
      if (matcher(query)) {
        if (query[key]) {
          matchedQueryObject[key] = query[key];
        }
      }
    });

    return true;
  });
  if (matched) {
    matchObject.cacheKey = `${keyPrefix}:${path}?${stringify(matchedQueryObject)}`;
    matchObject.matched = true;
  }
  return matchObject;
}
