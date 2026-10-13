import { Hono } from "hono";
import { validate } from "../../common/validate.js";
import type { AuthEnv } from "../../middleware/auth.js";
import {
  createEpisodeSchema,
  episodeParamsSchema,
  reportEpisodeSchema,
  updateEpisodeSchema,
} from "./episodes.schemas.js";
import {
  createEpisode,
  deleteEpisode,
  dismissProposal,
  getEpisode,
  listEpisodes,
  setReportEpisode,
  updateEpisode,
} from "./episodes.service.js";

export const profileEpisodesRoutes = new Hono<AuthEnv>()
  .get("/:id/episodes", validate("param", episodeParamsSchema), async (c) =>
    c.json(await listEpisodes(c.var.userId, c.req.valid("param").id)),
  )
  .post(
    "/:id/episodes",
    validate("param", episodeParamsSchema),
    validate("json", createEpisodeSchema),
    async (c) =>
      c.json(await createEpisode(c.var.userId, c.req.valid("param").id, c.req.valid("json")), 201),
  )
  .post("/:id/episodes/dismiss", validate("param", episodeParamsSchema), async (c) =>
    c.json(await dismissProposal(c.var.userId, c.req.valid("param").id)),
  );

export const episodesRoutes = new Hono<AuthEnv>()
  .get("/:id", validate("param", episodeParamsSchema), async (c) =>
    c.json(await getEpisode(c.var.userId, c.req.valid("param").id)),
  )
  .patch(
    "/:id",
    validate("param", episodeParamsSchema),
    validate("json", updateEpisodeSchema),
    async (c) =>
      c.json(await updateEpisode(c.var.userId, c.req.valid("param").id, c.req.valid("json"))),
  )
  .delete("/:id", validate("param", episodeParamsSchema), async (c) => {
    await deleteEpisode(c.var.userId, c.req.valid("param").id);
    return c.body(null, 204);
  });

export const reportEpisodeRoutes = new Hono<AuthEnv>().put(
  "/:id/episode",
  validate("param", episodeParamsSchema),
  validate("json", reportEpisodeSchema),
  async (c) =>
    c.json(
      await setReportEpisode(c.var.userId, c.req.valid("param").id, c.req.valid("json").episodeId),
    ),
);
