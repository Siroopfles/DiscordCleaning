import { RequestContext, ResponseContext, CacheStrategy } from '../../../interfaces/api';

export class DefaultCacheStrategy implements CacheStrategy {
  private readonly defaultTTL: number;
  private readonly cachableMethods: Set<string>;
  private readonly excludedPaths: Set<string>;
  private readonly pathTTLs: Map<RegExp, number>;

  constructor(
    defaultTTL: number = 300000, // 5 minuten
    options: {
      cachableMethods?: string[];
      excludedPaths?: string[];
      pathTTLs?: Array<{ path: RegExp; ttl: number }>;
    } = {}
  ) {
    this.defaultTTL = defaultTTL;
    this.cachableMethods = new Set(options.cachableMethods || ['GET']);
    this.excludedPaths = new Set(options.excludedPaths || []);
    this.pathTTLs = new Map(
      (options.pathTTLs || []).map(({ path, ttl }) => [path, ttl])
    );
  }

  shouldCache(context: ResponseContext): boolean {
    const { request, response } = context;

    // Alleen succesvolle responses cachen
    if (!response.success) {
      return false;
    }

    // Alleen geconfigureerde methods cachen
    if (!this.cachableMethods.has(request.method)) {
      return false;
    }

    // Check excluded paths
    if (this.excludedPaths.has(request.path)) {
      return false;
    }

    // Check currency endpoints (dynamic data)
    if (request.path.includes('/currency/')) {
      // Cache alleen leaderboard en statistics
      return request.path.endsWith('/leaderboard') ||
             request.path.endsWith('/statistics');
    }

    return true;
  }

  getCacheKey(context: RequestContext): string {
    const { method, path, body } = context;
    
    // Basis cache key is method + path
    let key = `${method}:${path}`;

    // Voor GET requests, include query parameters in cache key
    if (method === 'GET' && path.includes('?')) {
      key = `${method}:${path}`;
    }

    // Voor POST/PUT requests, include body hash in cache key
    if ((method === 'POST' || method === 'PUT') && body) {
      const bodyHash = this.hashString(JSON.stringify(body));
      key = `${key}:${bodyHash}`;
    }

    return key;
  }

  getTTL(context: ResponseContext): number {
    const { path } = context.request;

    // Check path-specifieke TTLs
    for (const [pathRegex, ttl] of this.pathTTLs) {
      if (pathRegex.test(path)) {
        return ttl;
      }
    }

    // Speciale TTLs voor specifieke endpoints
    if (path.endsWith('/leaderboard')) {
      return 60000; // 1 minuut voor leaderboard
    }

    if (path.endsWith('/statistics')) {
      return 300000; // 5 minuten voor statistics
    }

    if (path.includes('/categories')) {
      return 600000; // 10 minuten voor categories
    }

    return this.defaultTTL;
  }

  private hashString(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return hash.toString(36);
  }
}