### 缓存中间件

```
  const koaRedisCache = require('@webtanzhi/koa-redis-cache');
  koa.use(koaRedisCache({redisOption: { port: 6379, host: '127.0.0.1' }, paths: ['/', '/404], expireSeconds: 3000}))
```
