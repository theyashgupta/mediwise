import config from "@payload-config";
import { getPayload } from "payload";
import { seed } from "./seed";

const email = process.env.CMS_ADMIN_EMAIL;
const password = process.env.CMS_ADMIN_PASSWORD;
if (!email || !password) throw new Error("Set CMS_ADMIN_EMAIL and CMS_ADMIN_PASSWORD.");

const payload = await getPayload({ config });
await seed(payload, { email, password });
process.exit(0);
