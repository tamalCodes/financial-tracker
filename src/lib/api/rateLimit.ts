type Bucket = {
  count: number;
  start: number;
};

type RateLimitOptions = {
  limit: number;
  windowMs: number;
};

const buckets = new Map<string, Bucket>();

const getClientId = (request: Request) => {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0].trim();
  }
  return request.headers.get("x-real-ip") ?? "unknown";
};

export const rateLimit = (
  request: Request,
  keyPrefix: string,
  options: RateLimitOptions
) => {
  const clientId = getClientId(request);
  const key = `${keyPrefix}:${clientId}`;
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || now - bucket.start > options.windowMs) {
    buckets.set(key, { count: 1, start: now });
    return { ok: true, remaining: options.limit - 1, resetMs: options.windowMs };
  }

  if (bucket.count >= options.limit) {
    const resetMs = Math.max(0, options.windowMs - (now - bucket.start));
    return { ok: false, remaining: 0, resetMs };
  }

  bucket.count += 1;
  buckets.set(key, bucket);
  return {
    ok: true,
    remaining: Math.max(0, options.limit - bucket.count),
    resetMs: options.windowMs - (now - bucket.start),
  };
};
