"use client";

/**
 * Minimal inline SVG line chart — no chart library dependency. Plots points
 * min-to-max within the given box, oldest first; the last point gets a
 * highlighted dot so "where you are now" reads at a glance. Ported from
 * wasbot-frontend's shared Sparkline (identical behavior).
 */
export function Sparkline({
	points,
	width = 200,
	height = 44,
	className,
	stroke = "#2dd4bf",
	dotFill = "#2dd4bf",
}: {
	points: number[];
	width?: number;
	height?: number;
	className?: string;
	/** Line color — pass a muted slate for de-emphasis micro-sparks inside stat tiles. */
	stroke?: string;
	/** End-dot color — stays in the accent even when the line is de-emphasized. */
	dotFill?: string;
}) {
	if (points.length < 2) {
		return (
			<div className={className} style={{ width, height }}>
				<p className="flex h-full items-center text-xs text-slate-600">
					Not enough history yet
				</p>
			</div>
		);
	}

	const max = Math.max(...points);
	const min = Math.min(...points);
	const range = max - min || 1;
	const pad = 4;
	const stepX = points.length > 1 ? (width - pad * 2) / (points.length - 1) : 0;

	const coords = points.map((p, i) => {
		const x = pad + i * stepX;
		const y = pad + (1 - (p - min) / range) * (height - pad * 2);
		return [x, y] as const;
	});

	const path = coords
		.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`)
		.join(" ");
	const [lastX, lastY] = coords[coords.length - 1];

	return (
		<svg
			width={width}
			height={height}
			viewBox={`0 0 ${width} ${height}`}
			className={className}
			role="img"
			aria-label={`Trend over the last ${points.length} points`}
		>
			<path
				d={path}
				fill="none"
				stroke={stroke}
				strokeWidth={2}
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
			<circle cx={lastX} cy={lastY} r={3} fill={dotFill} />
		</svg>
	);
}
