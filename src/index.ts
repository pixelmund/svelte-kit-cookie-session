export { default as initializeSession } from "./initialize";
export { daysToMaxage } from "./utils/cookie";
export { initializeSession as setupSessionClient, session } from "./runtime/browser";
export * from "./runtime/server";
