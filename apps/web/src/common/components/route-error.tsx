import { ErrorComponent, type ErrorComponentProps } from "@tanstack/react-router";
import { useT } from "@/common/hooks/use-locale";

const chunkError = /dynamically imported module|Importing a module script failed/;

export function RouteError({ error }: ErrorComponentProps) {
  const t = useT();
  if (!chunkError.test(String(error))) return <ErrorComponent error={error} />;
  return (
    <main role="alert" className="p-6">
      <p>{t.common.newVersion}</p>
      <button
        type="button"
        className="mt-4 rounded-md border px-4 py-2"
        onClick={() => location.reload()}
      >
        {t.shell.update.action}
      </button>
    </main>
  );
}
