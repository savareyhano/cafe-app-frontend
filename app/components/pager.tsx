import { Button } from "~/components/ui/button";
import { Icon } from "~/components/icon";
import type { Pagination } from "~/lib/types";

export function Pager({ pagination, onPage, noun }: { pagination: Pagination; onPage: (p: number) => void; noun: string }) {
  const { currentPage, totalPages, totalRecords, prevPage, nextPage } = pagination;
  if (totalRecords === 0) return null;
  return (
    <nav className="flex flex-wrap items-center justify-between gap-3" aria-label="Halaman">
      <p className="type-body-s text-ink-soft tabular-nums">
        {totalRecords} {noun}
        {totalPages > 1 && ` · halaman ${currentPage} dari ${totalPages}`}
      </p>
      {totalPages > 1 && (
        <div className="flex gap-2">
          <Button variant="outline" size="sm" disabled={!prevPage} onClick={() => prevPage && onPage(prevPage)}>
            <Icon name="back" />
            Sebelumnya
          </Button>
          <Button variant="outline" size="sm" disabled={!nextPage} onClick={() => nextPage && onPage(nextPage)}>
            Berikutnya
            <Icon name="next" />
          </Button>
        </div>
      )}
    </nav>
  );
}
