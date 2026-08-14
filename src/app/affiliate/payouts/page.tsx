import { redirect } from "next/navigation";

// Commissions and payouts merged into /affiliate/earnings — keep old deep
// links (bookmarks, emails) working.
export default function PayoutsRedirect() {
	redirect("/affiliate/earnings");
}
