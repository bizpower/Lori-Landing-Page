// Entrypoint Vercel per il server SSR di TanStack Start.
//
// La build produce dist/server/server.js, che esporta di default un oggetto
// con un metodo fetch(Request) -> Response: la stessa interfaccia Web che
// Vercel accetta nelle sue funzioni. Qui lo si espone come handler.
//
// Senza questo file Vercel tratterebbe il progetto come sito statico e
// servirebbe dist/ senza mai eseguire il server: nessuna pagina verrebbe
// renderizzata e le server function non risponderebbero.
import server from "../dist/server/server.js";

export default async function handler(request) {
  return server.fetch(request);
}
