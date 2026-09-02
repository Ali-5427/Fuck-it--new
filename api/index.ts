import { createServerApp } from '../server';

const app = createServerApp();

export default function handler(req: any, res: any) {
  return app(req, res);
}
