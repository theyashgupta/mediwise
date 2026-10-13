import { type ReactNode, useLayoutEffect, useRef } from "react";

type PagedExportProps = { children: ReactNode; footer: ReactNode; onPaged?: () => void };

export function PagedExport({ children, footer, onPaged }: PagedExportProps) {
  const source = useRef<HTMLDivElement>(null);
  const pages = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    let live = true;
    void Promise.all([import("../config/paginate"), document.fonts.ready]).then(
      ([{ paginate }]) => {
        if (!live || !source.current || !pages.current) return;
        paginate(source.current, pages.current);
        onPaged?.();
      },
    );
    return () => {
      live = false;
    };
  });

  return (
    <div data-paged aria-hidden className="text-[9pt] leading-snug">
      <div
        ref={source}
        inert
        className="pointer-events-none fixed top-0 -left-[10000px] w-[186mm] print:hidden"
      >
        <div data-flow className="space-y-4">
          {children}
        </div>
        <div
          data-page
          className="flex min-h-[250mm] flex-col gap-3 break-after-page last:break-after-auto"
        >
          <div data-page-body />
          {footer}
        </div>
      </div>
      <div
        ref={pages}
        data-testid="export-pages"
        className="pointer-events-none fixed top-0 -left-[10000px] w-[186mm] print:static"
      />
    </div>
  );
}
