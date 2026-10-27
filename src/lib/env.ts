import "server-only";
import { parseEnvironment } from "./env-schema";

export function getServerEnvironment() {
  return parseEnvironment({ APP_URL: process.env.APP_URL });
}
