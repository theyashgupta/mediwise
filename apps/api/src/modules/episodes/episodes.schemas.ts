import { episodeFieldsSchema } from "@mediwise/shared";
import { z } from "zod";

export const episodeParamsSchema = z.object({ id: z.uuid() });

/** Body of `POST /profiles/:id/episodes`. */
export const createEpisodeSchema = episodeFieldsSchema.partial({ note: true }).extend({
  reportIds: z.array(z.uuid()).min(1, "Select a report").max(100),
});

/** Body of `PATCH /episodes/:id`. A null `endedOn` opens the episode again, an empty note clears it. */
export const updateEpisodeSchema = episodeFieldsSchema
  .extend({ endedOn: z.iso.date("Enter a date").nullable() })
  .partial();

/** Body of `PUT /reports/:id/episode`. A null `episodeId` takes the report out of its episode. */
export const reportEpisodeSchema = z.object({ episodeId: z.uuid().nullable() });
