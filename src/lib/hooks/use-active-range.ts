"use client";

import { useMemo, useState } from "react";
import {
	RANGE_PRESETS,
	isExtendedRangeKey,
	resolveCustomRange,
	resolveExtendedRange,
	resolvePresetRange,
	type ActiveRange,
} from "@/lib/stats/series";

/**
 * Selection state behind StatsRangeControl — one resolved ActiveRange
 * scopes everything on the analytics page. Ported from wasbot-frontend so
 * the two products' range semantics can't drift apart.
 */
export function useActiveRange(): {
	rangeKey: string;
	customRange: { from: string; to: string } | null;
	range: ActiveRange;
	setRange: (rangeKey: string, customRange: { from: string; to: string } | null) => void;
} {
	const [rangeKey, setRangeKey] = useState<string>("30d");
	const [customRange, setCustomRange] = useState<{ from: string; to: string } | null>(null);

	const range = useMemo(() => {
		if (rangeKey === "custom" && customRange) {
			return resolveCustomRange(customRange.from, customRange.to);
		}
		if (isExtendedRangeKey(rangeKey)) {
			return resolveExtendedRange(rangeKey, new Date());
		}
		const preset = RANGE_PRESETS.find((p) => p.key === rangeKey) ?? RANGE_PRESETS[1];
		return resolvePresetRange(preset, new Date());
	}, [rangeKey, customRange]);

	const setRange = (key: string, custom: { from: string; to: string } | null) => {
		setRangeKey(key);
		setCustomRange(custom);
	};

	return { rangeKey, customRange, range, setRange };
}
