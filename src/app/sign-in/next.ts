/** Only same-site paths are allowed as the post-sign-in destination. */
export const safeNext = (n?: unknown) =>
  typeof n === "string" && n.startsWith("/") && !n.startsWith("//") ? n : "/";
