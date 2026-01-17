import { format } from "date-fns";

/**
 * Format a monetary amount for display.
 * @param amount - The amount in the smallest currency unit (e.g., kobo for NGN, cents for USD)
 * @param currency - The currency code (e.g., "NGN", "USD")
 * @returns Formatted currency string (e.g., "₦4,000.00")
 */
export function formatCurrency(amount: number, currency?: string) {
	const code = currency || "USD";
	// Guard against invalid input
	if (typeof amount !== "number" || isNaN(amount)) {
		return `${code} 0.00`;
	}
	// Convert from smallest unit (kobo/cents) to main unit (naira/dollars)
	const mainUnitAmount = amount / 100;
	try {
		return new Intl.NumberFormat(undefined, {
			style: "currency",
			currency: code,
			maximumFractionDigits: 2,
		}).format(mainUnitAmount);
	} catch {
		// Fallback if an invalid currency code is passed.
		return `${code} ${mainUnitAmount.toLocaleString()}`;
	}
}

export function formatInteger(value: number) {
	return new Intl.NumberFormat(undefined, {
		maximumFractionDigits: 0,
	}).format(value);
}

/**
 * Format a date string to a human-readable format.
 * Returns the original value if parsing fails.
 */
export function formatDate(value: string, formatStr: string = "d MMM yyyy, HH:mm"): string {
	try {
		return format(new Date(value), formatStr);
	} catch {
		return value;
	}
}

/**
 * Shorten a UUID or long ID for display.
 * Example: "abc12345-6789-..." becomes "abc123...6789"
 */
export function shortenId(id: string, prefixLen: number = 6, suffixLen: number = 4): string {
	if (id.length <= prefixLen + suffixLen + 1) return id;
	return `${id.slice(0, prefixLen)}\u2026${id.slice(-suffixLen)}`;
}
