import { readFile } from "node:fs/promises";
import path from "node:path";
import { authConfigured, authRequired, currentUser } from "@/lib/auth";
import { canUseStudio } from "@/lib/studio";

/**
 * The UI work's images (Figma screen captures, component sheets, icons, chrome), kept out of public/ so nothing is
 * reachable without signing in. Same rule as the /ui pages: signed in, with Studio access. Anyone else gets a 404,
 * so the files' existence isn't confirmed either.
 */
const ROOT = path.join(process.cwd(), "private/ui");
const TYPES: Record<string, string> = { ".png": "image/png", ".svg": "image/svg+xml", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".webp": "image/webp" };
const notFound = () => new Response("Not found", { status: 404 });

export async function GET(_req: Request, { params }: RouteContext<"/ui-assets/[...path]">) {
  if (authConfigured()) {
    const user = await currentUser();
    if (!user || !canUseStudio(user)) return notFound();
  } else if (authRequired()) return notFound();

  const file = path.join(ROOT, ...(await params).path);
  const type = TYPES[path.extname(file).toLowerCase()];
  if (!type || !file.startsWith(ROOT + path.sep)) return notFound();
  try {
    return new Response(await readFile(file), {
      headers: { "Content-Type": type, "Cache-Control": "private, max-age=3600", "X-Content-Type-Options": "nosniff" },
    });
  } catch {
    return notFound();
  }
}
