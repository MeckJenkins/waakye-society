const siteUrl = Deno.env.get('SITE_URL');

export const getCorsHeaders = (request: Request): HeadersInit | null => {
  const origin = request.headers.get('origin');
  if (origin && origin !== siteUrl) {
    return null;
  }

  return {
    'Access-Control-Allow-Origin': origin ?? siteUrl ?? '',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Vary': 'Origin',
  };
};

export const jsonResponse = (
  body: Record<string, unknown>,
  status: number,
  headers: HeadersInit = {},
) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      ...headers,
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
    },
  });

export const handleOptions = (headers: HeadersInit | null) =>
  headers
    ? new Response('ok', { headers })
    : new Response('Origin not allowed', { status: 403 });

export const readJson = async (request: Request): Promise<unknown> => {
  const contentLength = Number(request.headers.get('content-length') ?? 0);
  if (contentLength > 32_000) {
    throw new Error('Request is too large.');
  }
  return await request.json();
};

export const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);
