export class ImportError extends Error {
  code: string;
  status: number;
  details?: unknown;
  
  constructor(code: string, message: string, status = 400, details?: unknown) {
    super(message);
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

export const jsonOk = (body: unknown, init: ResponseInit = {}) =>
  new Response(JSON.stringify(body), { 
    status: 200, 
    headers: { 'content-type': 'application/json' }, 
    ...init 
  });

export const jsonErr = (code: string, message: string, correlationId: string, status = 400, details?: unknown) =>
  new Response(JSON.stringify({ 
    ok: false, 
    code, 
    message, 
    correlationId, 
    details 
  }), {
    status,
    headers: { 'content-type': 'application/json' }
  });