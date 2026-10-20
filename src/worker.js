import { DurableObject } from "cloudflare:workers";

export class Counter extends DurableObject {
  constructor(ctx, env) {
    super(ctx, env);
    ctx.storage.sql.exec("CREATE TABLE IF NOT EXISTS c (k TEXT PRIMARY KEY, v INTEGER)");
  }
  next() {
    const row = this.ctx.storage.sql
      .exec("INSERT INTO c (k, v) VALUES ('fan', 1) ON CONFLICT(k) DO UPDATE SET v = v + 1 RETURNING v")
      .one();
    return row.v;
  }
  peek() {
    const r = this.ctx.storage.sql.exec("SELECT v FROM c WHERE k = 'fan'").toArray();
    return r.length ? r[0].v : 0;
  }
}

const json = (o, s = 200) =>
  new Response(JSON.stringify(o), {
    status: s,
    headers: { "content-type": "application/json", "cache-control": "no-store" },
  });

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === "/api/ticket") {
      const stub = env.COUNTER.get(env.COUNTER.idFromName("global"));
      if (request.method === "POST") return json({ n: await stub.next() });
      if (request.method === "GET") return json({ total: await stub.peek() });
      return json({ error: "method" }, 405);
    }
    return env.ASSETS.fetch(request);
  },
};
