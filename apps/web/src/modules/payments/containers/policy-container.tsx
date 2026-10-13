import { PolicyPage } from "../components/policy-page";
import type { PolicyPage as Page } from "../config/policies";

type PolicyContainerProps = {
  page: Page;
};

export function PolicyContainer({ page }: PolicyContainerProps) {
  return <PolicyPage page={page} />;
}
