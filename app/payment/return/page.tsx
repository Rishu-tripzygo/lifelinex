import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Icon } from "@/components/icons";
import { formatInr } from "@/lib/lead";
import { syncPaymentOrder } from "@/lib/payments";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Your payment",
  robots: { index: false, follow: false },
};

export default async function PaymentReturnPage({
  searchParams,
}: {
  searchParams: Promise<{ order_id?: string | string[] }>;
}) {
  const { order_id: rawOrderId } = await searchParams;
  const orderId = typeof rawOrderId === "string" ? rawOrderId : undefined;
  const order = orderId ? await syncPaymentOrder(orderId) : null;
  const paid = order?.status === "PAID";
  const failed = order?.status === "FAILED" || order?.status === "EXPIRED";
  const pending = order && !paid && !failed;

  // Paid orders continue on the booking page, which checks access before showing anything.
  if (paid) redirect(`/booking/${encodeURIComponent(order.cashfreeOrderId)}`);

  return (
    <div className="status-page">
      <header className="nav is-scrolled">
        <div className="container">
          <Link className="nav__brand" href="/" aria-label="LifelineX home">
            <img src="/assets/logo-horizontal.svg" alt="LifelineX" width={125} height={24} />
          </Link>
        </div>
      </header>

      <main id="main">
        <div className="status">
          <div className="status-steps" aria-label="Booking progress">
            <span className="is-done"><Icon name="check" size={14} />Assessment</span>
            <i />
            <span className="is-now">Payment</span>
            <i />
            <span>Pick a time</span>
          </div>

          {!order && (
            <>
              <span className="status__mark status__mark--wait"><Icon name="alert" size={24} /></span>
              <h1>We couldn&apos;t find that payment</h1>
              <p className="small" style={{ fontSize: 15.5 }}>
                The link may be incomplete. Go back to the PCOS consultation page and start checkout again.
              </p>
              <div className="status__actions">
                <Link className="btn btn--primary" href="/pcos#book">
                  Back to booking <Icon name="arrow" />
                </Link>
              </div>
            </>
          )}

          {pending && (
            <>
              <span className="status__mark status__mark--wait"><Icon name="clock" size={24} /></span>
              <h1>We&apos;re confirming your payment</h1>
              <p className="small" style={{ fontSize: 15.5 }}>
                Cashfree hasn&apos;t marked this payment as complete yet. If you paid, check again in a moment. If you closed checkout, you can start again.
              </p>
              <div className="status__actions">
                <a className="btn btn--dark" href={`/payment/return?order_id=${encodeURIComponent(order.cashfreeOrderId)}`}>
                  <Icon name="refresh" /> Check again
                </a>
                <Link className="btn btn--ghost" href="/pcos#book">
                  Back to checkout
                </Link>
              </div>
            </>
          )}

          {order && failed && (
            <>
              <span className="status__mark status__mark--fail"><Icon name="x" size={24} /></span>
              <h1>Payment wasn&apos;t completed</h1>
              <p className="small" style={{ fontSize: 15.5 }}>
                No consultation was booked. You can try the {formatInr(order.amount)} payment again.
              </p>
              <div className="status__actions">
                <Link className="btn btn--primary" href="/pcos#book">
                  Try again <Icon name="arrow" />
                </Link>
              </div>
            </>
          )}

          {pending && (
            <Link href="/pcos" className="textlink" style={{ marginTop: 8, fontSize: 14 }}>
              Back to PCOS consultation
            </Link>
          )}
        </div>
      </main>
    </div>
  );
}
