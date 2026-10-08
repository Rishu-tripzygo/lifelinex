import type { PaymentStatus, Prisma } from "@prisma/client";
import Link from "next/link";
import { createBookingForOrderAction } from "@/app/admin/actions";
import { AdminForm } from "@/components/admin/admin-form";
import { Badge, Empty, Filters, one, PAGE_SIZE, PageHead, Pager, pageFrom } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/admin/auth";
import { digitsOnly, formatInr } from "@/lib/lead";
import { prisma } from "@/lib/prisma";
import { formatDateTime, IST_OFFSET_MS } from "@/lib/time";

export const metadata = { title: "Payments" };

const VIEWS: [string, string][] = [
  ["paid", "Paid"],
  ["unbooked", "Paid, not booked"],
  ["unpaid", "Not completed"],
  ["all", "All"],
];

export default async function OrdersPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  await requireAdmin();
  const sp = await searchParams;
  const view = VIEWS.some(([v]) => v === one(sp.view)) ? one(sp.view)! : "paid";
  const q = one(sp.q)?.trim() ?? "";
  const page = pageFrom(sp.page);

  const where: Prisma.PaymentOrderWhereInput = {};
  if (view === "paid") where.status = "PAID";
  if (view === "unbooked") Object.assign(where, { status: "PAID" as PaymentStatus, booking: null });
  if (view === "unpaid") where.status = { in: ["CREATED", "FAILED", "EXPIRED"] };
  if (q) {
    const digits = digitsOnly(q);
    where.OR = [
      { customerName: { contains: q, mode: "insensitive" } },
      ...(digits.length >= 4 ? [{ customerPhone: { contains: digits.slice(-10) } }] : []),
      { cashfreeOrderId: { contains: q } },
    ];
  }

  const rows = await prisma.paymentOrder.findMany({
    where,
    orderBy: { createdAt: "desc" },
    skip: (page - 1) * PAGE_SIZE,
    take: PAGE_SIZE + 1,
    include: { booking: { select: { id: true, startsAt: true, status: true } } },
  });
  const orders = rows.slice(0, PAGE_SIZE);
  const soon = new Date(Date.now() + IST_OFFSET_MS + 24 * 3_600_000).toISOString().slice(0, 11) + "10:00";

  return (
    <>
      <PageHead title="Payments" sub="Consultation payments from Cashfree." />
      <div className="atoolbar">
        <Filters base="/admin/orders" param="view" value={view} options={VIEWS} keep={{ q }} />
        <form className="asearch" role="search">
          <input type="hidden" name="view" value={view} />
          <input name="q" defaultValue={q} placeholder="Search name, phone or order" aria-label="Search payments" />
        </form>
      </div>

      {orders.length === 0 ? (
        <Empty>No payments here{q ? ` matching “${q}”` : ""}.</Empty>
      ) : (
        <div className="atable-wrap">
          <table className="atable">
            <thead>
              <tr>
                <th>Created</th>
                <th>Customer</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Booking</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id}>
                  <td className="nowrap">
                    {formatDateTime(o.createdAt)}
                    <span className="sub mono">{o.cashfreeOrderId}</span>
                  </td>
                  <td>
                    {o.customerName}
                    <span className="sub">+91 {o.customerPhone}</span>
                  </td>
                  <td>{formatInr(o.amount)}</td>
                  <td><Badge status={o.status} /></td>
                  <td>
                    {o.booking ? (
                      <Link href={`/admin/bookings/${o.booking.id}`}>{formatDateTime(o.booking.startsAt)}</Link>
                    ) : o.status === "PAID" ? (
                      <details className="inline-book">
                        <summary>Book for patient</summary>
                        <AdminForm action={createBookingForOrderAction} submitLabel="Book">
                          <input type="hidden" name="orderId" value={o.id} />
                          <label className="afield">
                            <span>Date and time (IST)</span>
                            <input type="datetime-local" name="startsAt" defaultValue={soon} required />
                          </label>
                          <label className="acheck"><input type="checkbox" name="override" /> Override hours/capacity</label>
                        </AdminForm>
                      </details>
                    ) : (
                      <span className="muted">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Pager base="/admin/orders" page={page} hasMore={rows.length > PAGE_SIZE} keep={{ view, q }} />
    </>
  );
}
