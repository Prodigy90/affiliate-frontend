"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

export const PAGE_SIZE_OPTIONS = [20, 50, 100, 200] as const;
export type PageSize = (typeof PAGE_SIZE_OPTIONS)[number];

export type PaginationBarProps = {
  /** 1-indexed current page. */
  page: number;
  pageSize: PageSize;
  /** Total row count, or `undefined` when the backend doesn't return it. */
  total?: number;
  /** Number of rows on the current page (used for the "Showing X" line). */
  rowsOnPage: number;
  /** Singular label of the entity being paginated, e.g. "affiliate". */
  entityLabel: string;
  /** Plural label of the entity being paginated, e.g. "affiliates". */
  entityLabelPlural?: string;
  onPageChange: (next: number) => void;
  onPageSizeChange: (next: PageSize) => void;
  className?: string;
};

/**
 * PaginationBar renders the standard admin paginator: a "Showing X of Y"
 * line, a per-page size selector, and prev/next/page-number buttons.
 *
 * When `total` is undefined the bar falls back to a lightweight prev/next
 * layout (we can't infer total pages without it).
 */
export function PaginationBar({
  page,
  pageSize,
  total,
  rowsOnPage,
  entityLabel,
  entityLabelPlural,
  onPageChange,
  onPageSizeChange,
  className,
}: PaginationBarProps) {
  const plural = entityLabelPlural ?? `${entityLabel}s`;
  const totalPages =
    total !== undefined && total > 0 ? Math.max(1, Math.ceil(total / pageSize)) : undefined;

  const startIndex = (page - 1) * pageSize;
  const endIndex = startIndex + rowsOnPage;

  const showingLine = (() => {
    if (rowsOnPage === 0) {
      return `No ${plural} on this page`;
    }
    if (total === undefined) {
      return `Showing ${rowsOnPage} ${rowsOnPage === 1 ? entityLabel : plural}`;
    }
    return (
      <>
        Showing{" "}
        <span className="font-medium text-slate-200">{startIndex + 1}</span>
        {"–"}
        <span className="font-medium text-slate-200">{endIndex}</span>
        {" of "}
        <span className="font-medium text-slate-200">
          {total.toLocaleString()}
        </span>{" "}
        {total === 1 ? entityLabel : plural}
      </>
    );
  })();

  return (
    <div
      className={
        "flex flex-col gap-3 pt-3 sm:flex-row sm:items-center sm:justify-between " +
        (className ?? "")
      }
    >
      <p className="text-[11px] text-slate-400">{showingLine}</p>

      <div className="flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-2 text-[11px] text-slate-400">
          <span>Per page</span>
          <select
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value) as PageSize)}
            className="h-7 rounded-md border border-slate-700 bg-slate-800/80 px-2 text-[11px] text-slate-100 outline-none focus:border-teal-500/60 focus:ring-1 focus:ring-teal-500/40"
            aria-label="Rows per page"
          >
            {PAGE_SIZE_OPTIONS.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </label>

        <div className="inline-flex items-center gap-0.5 rounded-lg border border-slate-800/70 bg-slate-950/60 p-0.5">
          <PageButton
            disabled={page <= 1}
            onClick={() => onPageChange(Math.max(1, page - 1))}
            ariaLabel="Previous page"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </PageButton>

          {totalPages === undefined ? (
            <span className="px-2 text-[11px] text-slate-400">Page {page}</span>
          ) : (
            <PageNumbers
              page={page}
              totalPages={totalPages}
              onPageChange={onPageChange}
            />
          )}

          <PageButton
            disabled={totalPages !== undefined && page >= totalPages}
            onClick={() =>
              onPageChange(
                totalPages !== undefined
                  ? Math.min(totalPages, page + 1)
                  : page + 1,
              )
            }
            ariaLabel="Next page"
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </PageButton>
        </div>
      </div>
    </div>
  );
}

function PageButton({
  children,
  disabled,
  onClick,
  active,
  ariaLabel,
}: {
  children: React.ReactNode;
  disabled?: boolean;
  onClick: () => void;
  active?: boolean;
  ariaLabel?: string;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      aria-label={ariaLabel}
      aria-current={active ? "page" : undefined}
      className={
        "inline-flex h-7 min-w-[28px] items-center justify-center rounded-md px-2 text-[11px] font-medium transition-colors " +
        (active
          ? "bg-teal-500/15 font-semibold text-teal-300"
          : "text-slate-400 hover:text-slate-200 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:text-slate-400")
      }
    >
      {children}
    </button>
  );
}

function PageNumbers({
  page,
  totalPages,
  onPageChange,
}: {
  page: number;
  totalPages: number;
  onPageChange: (next: number) => void;
}) {
  const pages = computePageWindow(page, totalPages);
  return (
    <>
      {pages.map((p, i) =>
        p === "ellipsis" ? (
          <span
            key={`ellipsis-${i}`}
            className="px-1 text-[11px] text-slate-500"
            aria-hidden="true"
          >
            …
          </span>
        ) : (
          <PageButton
            key={p}
            onClick={() => onPageChange(p)}
            active={p === page}
            ariaLabel={`Page ${p}`}
          >
            {p}
          </PageButton>
        ),
      )}
    </>
  );
}

function computePageWindow(
  current: number,
  total: number,
): (number | "ellipsis")[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }
  const out: (number | "ellipsis")[] = [1];
  if (current > 3) out.push("ellipsis");
  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);
  for (let i = start; i <= end; i++) out.push(i);
  if (current < total - 2) out.push("ellipsis");
  out.push(total);
  return out;
}
