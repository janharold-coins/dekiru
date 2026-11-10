/**
 * The Studio on the Dekiru connector: what's waiting on Claude (studio_queue), the images people attached
 * (studio_image), and closing a request answered without a proposal (studio_close_request). Same data as
 * `npm run studio`; only admins and people with Studio access can call them.
 */
import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/server";
import type { SignedInUser } from "./auth";
import { attachment, canUseStudio, claudeReply, closeRequest, studioQueue } from "./studio";

const text = (data: unknown) => ({ content: [{ type: "text" as const, text: typeof data === "string" ? data : JSON.stringify(data, null, 1) }] });
const fail = (message: string) => ({ content: [{ type: "text" as const, text: message }], isError: true });
const NO_ACCESS = "Only Studio reviewers (admins and people with Studio reviewer ticked) can work the Studio queue.";

export function registerStudioTools(server: McpServer, user: SignedInUser) {
  server.registerTool("studio_queue", {
    title: "What the Studio is waiting on",
    description: "First `check`: new tickets to answer with studio_reply before anything is built (compare each with `library`). "
      + "Then approved Studio requests to build (layouts, themes, rule changes, remixes) with their prompts, prompts on drafts and sent-back proposals, "
      + "and approved layouts still to move into the library. Building them means editing the Dekiru repo (src/studio/proposals.ts, "
      + "following src/studio/STUDIO.md), so do it from Claude Code in that repo. Images are listed by id: fetch them with studio_image.",
    inputSchema: z.object({}),
  }, async () => {
    if (!canUseStudio(user)) return fail(NO_ACCESS);
    return text(await studioQueue());
  });

  server.registerTool("studio_image", {
    title: "An image attached to a Studio prompt",
    description: "One image someone attached to a Studio request or prompt, by the id studio_queue lists.",
    inputSchema: z.object({ id: z.string().describe("Image id from studio_queue (prompts[].images).") }),
  }, async ({ id }) => {
    if (!canUseStudio(user)) return fail(NO_ACCESS);
    const file = await attachment(id);
    if (!file) return fail(`No image "${id}".`);
    return { content: [{ type: "image" as const, data: file.bytes.toString("base64"), mimeType: file.mime }] };
  });

  server.registerTool("studio_reply", {
    title: "Reply to a new Studio ticket",
    description: "Claude's answer to a ticket in studio_queue's `check` list, written for the requester (plain words, short). "
      + "recommend: existing templates/themes already cover it (refs: \"template:<id>\", \"theme:<id>\" or an approved proposal id; the requester picks That works or Still need it). "
      + "merge: a duplicate of another open ticket (into). build: nothing fits, a build is needed (a reviewer then approves it; a reviewer's own ticket is approved straight away).",
    inputSchema: z.object({
      id: z.string().describe("Ticket id from studio_queue.check."),
      outcome: z.enum(["recommend", "merge", "build"]),
      message: z.string().describe("The reply the requester reads."),
      refs: z.array(z.string()).optional().describe("recommend: what to use instead."),
      into: z.string().optional().describe("merge: the ticket it duplicates."),
    }),
  }, async ({ id, outcome, message, refs, into }) => {
    if (!canUseStudio(user)) return fail(NO_ACCESS);
    try { await claudeReply(id, outcome, message, { refs, into }); } catch (e) { return fail((e as Error).message); }
    return text({ replied: id, outcome });
  });

  server.registerTool("studio_close_request", {
    title: "Close a Studio request",
    description: "Close a request answered without a proposal, such as a rule change once src/studio/STUDIO.md is updated and logged under Changes.",
    inputSchema: z.object({ id: z.string().describe("Request id from studio_queue.") }),
  }, async ({ id }) => {
    if (!canUseStudio(user)) return fail(NO_ACCESS);
    try { await closeRequest(id); } catch (e) { return fail((e as Error).message); }
    return text({ closed: id });
  });
}
