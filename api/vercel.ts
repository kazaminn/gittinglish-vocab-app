import { handle } from "@hono/node-server/vercel";
import app from "../server/src/app.js";

export default handle(app);
