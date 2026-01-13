import { redirect } from "next/navigation";

// Default /admin route: immediately redirect to the primary admin dashboard
// (/admin/payouts) so that typing /admin in the browser "just works".
export default function AdminIndexPage() {
  redirect("/admin/payouts");
}

