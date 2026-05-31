import type { ReactNode } from "react";

export type StackedField = {
	label: string;
	value: ReactNode;
};

export type StackedCardProps = {
	/** Primary line (e.g. a name or product). Truncates on overflow. */
	title: ReactNode;
	/** Optional secondary line under the title (e.g. an email or id). */
	subtitle?: ReactNode;
	/** Optional trailing action in the header (e.g. a single "View" link). */
	action?: ReactNode;
	/** Label/value pairs rendered as a two-column definition grid. */
	fields?: StackedField[];
	/** Optional full-width footer for wider actions (e.g. multiple buttons). */
	footer?: ReactNode;
};

/**
 * StackedCard renders a single table row as a self-contained card for the
 * mobile (<sm) layout, where wide tables would otherwise scroll sideways.
 * Render it inside a <StackedCardList> and pair it with a `hidden sm:block`
 * table for the >=sm layout.
 */
export function StackedCard({ title, subtitle, action, fields, footer }: StackedCardProps) {
	return (
		<li className="rounded-lg border border-slate-800/70 bg-slate-950/40 p-3">
			<div className="flex items-start justify-between gap-3">
				<div className="min-w-0">
					<div className="truncate text-sm font-medium text-slate-100">{title}</div>
					{subtitle != null && (
						<div className="truncate text-[11px] text-slate-400">{subtitle}</div>
					)}
				</div>
				{action != null && <div className="shrink-0">{action}</div>}
			</div>
			{fields && fields.length > 0 && (
				<dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2">
					{fields.map((f, i) => (
						<div key={i} className="min-w-0">
							<dt className="text-[11px] text-slate-500">{f.label}</dt>
							<dd className="mt-0.5 text-xs text-slate-200">{f.value}</dd>
						</div>
					))}
				</dl>
			)}
			{footer != null && <div className="mt-3">{footer}</div>}
		</li>
	);
}

/**
 * StackedCardList is the mobile-only (<sm) container for StackedCard rows. The
 * companion desktop table should be wrapped in `hidden sm:block`.
 */
export function StackedCardList({ children }: { children: ReactNode }) {
	return <ul className="space-y-2 sm:hidden">{children}</ul>;
}
