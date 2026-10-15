import { getRouteApi } from "@tanstack/react-router";
import { AskThreadContainer } from "./ask-thread-container";

const route = getRouteApi("/_app/ask");

export function AskContainer() {
  const search = route.useSearch();
  const navigate = route.useNavigate();
  return (
    <AskThreadContainer
      variant="page"
      reportId={search.report}
      prefill={search.q}
      onProfileSwitch={() => {
        if (search.report) void navigate({ search: {}, replace: true });
      }}
    />
  );
}
