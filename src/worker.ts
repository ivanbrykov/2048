/// <reference types="@cloudflare/workers-types" />

interface Env {
  // This is a placeholder. Your environment variables will go here.
  DUMMY_VAR?: string;
}

export default {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async fetch(_request: Request, _env: Env) {
    return new Response("Hello World!");
  },
};
