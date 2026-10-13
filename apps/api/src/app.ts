import { Hono } from "hono";
import { bodyLimit } from "hono/body-limit";
import { contextStorage } from "hono/context-storage";
import { cors } from "hono/cors";
import { requestId } from "hono/request-id";
import { secureHeaders } from "hono/secure-headers";
import { handleError, problem } from "./common/problem.js";
import { env } from "./config/env.js";
import { auth } from "./middleware/auth.js";
import { requestLogger } from "./middleware/logger.js";
import { reportCreateLimit } from "./middleware/rate-limit.js";
import { adminRoutes } from "./modules/admin/index.js";
import { profileQuestionsRoutes, questionsRoutes } from "./modules/assistant/index.js";
import { dashboardRoutes } from "./modules/dashboard/index.js";
import {
  episodesRoutes,
  profileEpisodesRoutes,
  reportEpisodeRoutes,
} from "./modules/episodes/index.js";
import { healthRoutes } from "./modules/health/index.js";
import { linksRoutes } from "./modules/links/index.js";
import { meRoutes } from "./modules/me/index.js";
import { paymentsRoutes, paymentsWebhookRoutes } from "./modules/payments/index.js";
import { profilesRoutes } from "./modules/profiles/index.js";
import { reportsRoutes } from "./modules/reports/index.js";
import { sharedExportRoutes, sharesRoutes } from "./modules/shares/index.js";
import { spendRoutes } from "./modules/spend/index.js";
import { compareRoutes, trendsRoutes } from "./modules/trends/index.js";
import { yearReviewRoutes } from "./modules/year-review/index.js";

/**
 * The API with every module mounted.
 *
 * @remarks
 * `auth` is registered after `/health`, the payments webhook and the share links, so only routes mounted below it are protected.
 */
export const app = new Hono()
  .use(contextStorage())
  .use(requestId())
  .use(requestLogger)
  .use(secureHeaders())
  .use(cors({ origin: env.CORS_ORIGINS }))
  .use(
    bodyLimit({
      maxSize: 100 * 1024,
      onError: (c) => problem(c, 413, "Content Too Large", "The request is larger than 100 KB."),
    }),
  )
  .route("/health", healthRoutes)
  .route("/payments", paymentsWebhookRoutes)
  .route("/share", sharedExportRoutes)
  .use(auth)
  .use("/reports", reportCreateLimit)
  .route("/dashboard", dashboardRoutes)
  .route("/me", meRoutes)
  .route("/profiles", profilesRoutes)
  .route("/profiles", yearReviewRoutes)
  .route("/profiles", profileEpisodesRoutes)
  .route("/profiles", profileQuestionsRoutes)
  .route("/questions", questionsRoutes)
  .route("/episodes", episodesRoutes)
  .route("/reports", reportsRoutes)
  .route("/reports", sharesRoutes)
  .route("/reports", linksRoutes)
  .route("/reports", reportEpisodeRoutes)
  .route("/trends", trendsRoutes)
  .route("/compare", compareRoutes)
  .route("/payments", paymentsRoutes)
  .route("/admin", spendRoutes)
  .route("/admin", adminRoutes);

app.onError(handleError);
app.notFound((c) => problem(c, 404, "Not Found"));

export type AppType = typeof app;
