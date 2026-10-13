import { problemError } from "@/common/utils/problem-error";
import { api } from "@/lib/api";
import type { LinkKind } from "../types";

export async function linkReports({
  reportId,
  otherId,
  kind,
}: {
  reportId: string;
  otherId: string;
  kind: LinkKind;
}) {
  const res = await api.reports[":id"].links.$post({
    param: { id: reportId },
    json: { reportId: otherId, kind },
  });
  if (!res.ok) throw await problemError(res);
  return res.json();
}

export async function updateLink({
  reportId,
  linkId,
  state,
}: {
  reportId: string;
  linkId: string;
  state: "confirmed" | "dismissed";
}) {
  const res = await api.reports[":id"].links[":linkId"].$patch({
    param: { id: reportId, linkId },
    json: { state },
  });
  if (!res.ok) throw await problemError(res);
  return res.json();
}
