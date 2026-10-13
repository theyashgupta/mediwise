import { CircleAlert } from "lucide-react";
import { useT } from "@/common/hooks/use-locale";
import { EmptyState } from "./empty-state";

export function OfflineState() {
  const t = useT();
  return (
    <div data-testid="shell-offline" className="mb-6">
      <EmptyState icon={CircleAlert} title={t.shell.offline.title} body={t.shell.offline.body} />
    </div>
  );
}
