import type { ReactNode } from "react";

/**
 * House section-header pattern: a dotted eyebrow row over an h2. Used for
 * sub-sections within a page (table/list/chart headers) — the page-level
 * hero (eyebrow + h1) is a separate, larger pattern.
 */
export function SectionHeader({
	label,
	title,
	action,
}: {
	label: string;
	title: string;
	/** Optional trailing action rendered inline with the eyebrow (e.g. a retry button). */
	action?: ReactNode;
}) {
	return (
		<div className="flex items-center justify-between gap-2">
			<div className="min-w-0 space-y-1.5">
				<div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
					<span className="h-1.5 w-1.5 shrink-0 rounded-full bg-teal-400" aria-hidden="true" />
					<span className="truncate">{label}</span>
				</div>
				<h2 className="text-base font-semibold tracking-tight text-slate-50">{title}</h2>
			</div>
			{action != null && <div className="shrink-0">{action}</div>}
		</div>
	);
}
