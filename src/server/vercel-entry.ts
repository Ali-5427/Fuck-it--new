import { createServerApp } from '../../server.js';

const app = createServerApp();

export default function handler(req: any, res: any) {
  return app(req, res);
}
