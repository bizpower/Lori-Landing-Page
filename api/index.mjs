// Entrypoint Vercel per il server SSR di TanStack Start.
//
// La build produce dist/server/server.js, che esporta un oggetto con
// fetch(Request) -> Response, l'interfaccia Web standard.
//
// Le funzioni Node di Vercel ricevono pero' (req, res) in stile Node, non una
// Request Web: passare req direttamente a fetch() fa fallire srvx con
// "TypeError: Invalid URL", perche' req.url e' un path relativo ("/") privo di
// host. Qui la richiesta Node viene convertita in Request e la Response
// riversata su res.
import { Readable } from "node:stream";
import server from "../dist/server/server.js";

function buildRequest(req) {
  const proto = req.headers["x-forwarded-proto"] || "https";
  const host = req.headers["x-forwarded-host"] || req.headers.host || "localhost";
  const url = new URL(req.url || "/", `${proto}://${host}`);

  const headers = new Headers();
  for (const [key, value] of Object.entries(req.headers)) {
    if (value === undefined) continue;
    if (Array.isArray(value)) value.forEach((v) => headers.append(key, v));
    else headers.set(key, value);
  }

  const method = req.method || "GET";
  const hasBody = method !== "GET" && method !== "HEAD";

  return new Request(url, {
    method,
    headers,
    body: hasBody ? Readable.toWeb(req) : undefined,
    // richiesto quando il body e' uno stream
    duplex: hasBody ? "half" : undefined,
  });
}

export default async function handler(req, res) {
  // Se il runtime fornisce gia' una Request Web, inoltrala senza conversione.
  if (typeof Request !== "undefined" && req instanceof Request) {
    return server.fetch(req);
  }

  const response = await server.fetch(buildRequest(req));

  res.statusCode = response.status;
  response.headers.forEach((value, key) => {
    // set-cookie puo' comparire piu' volte: va gestito a parte come lista.
    if (key.toLowerCase() === "set-cookie") return;
    res.setHeader(key, value);
  });
  const cookies = response.headers.getSetCookie?.();
  if (cookies?.length) res.setHeader("set-cookie", cookies);

  if (!response.body) {
    res.end();
    return;
  }

  // Streaming: l'SSR di TanStack Start invia l'HTML progressivamente.
  Readable.fromWeb(response.body).pipe(res);
}
