import "server-only";
import type { PlacedOrder } from "@/lib/database.types";
import { formatPrice } from "@/lib/utils";

/**
 * Transactional email, sent through Resend's HTTPS API.
 *
 * Deliberately dependency-free (one `fetch`) and deliberately optional: with
 * no RESEND_API_KEY configured the app runs exactly as before and simply logs
 * that the notification was skipped. An order must never fail because an email
 * provider is down — sending happens after the response, and every failure is
 * swallowed with a log.
 *
 * RESEND_API_KEY and ORDER_EMAIL_FROM are server-only (no NEXT_PUBLIC_ prefix),
 * so they never reach the browser.
 */

// Overridable so the send path can be pointed at a local capture server in
// tests, or at a compatible self-hosted relay.
const RESEND_ENDPOINT = process.env.RESEND_API_URL || "https://api.resend.com/emails";

export interface SendEmailInput {
  to: string;
  subject: string;
  html: string;
  text: string;
  replyTo?: string;
}

export type SendEmailResult =
  | { sent: true; id: string }
  | { sent: false; reason: string };

export async function sendEmail(input: SendEmailInput): Promise<SendEmailResult> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return { sent: false, reason: "RESEND_API_KEY is not set" };
  if (!input.to) return { sent: false, reason: "no recipient configured" };

  // Resend's shared sender works without a verified domain, which makes the
  // first run possible before any DNS is set up.
  const from = process.env.ORDER_EMAIL_FROM || "Orders <onboarding@resend.dev>";

  try {
    const response = await fetch(RESEND_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [input.to],
        subject: input.subject,
        html: input.html,
        text: input.text,
        ...(input.replyTo ? { reply_to: input.replyTo } : {}),
      }),
    });

    if (!response.ok) {
      const detail = await response.text();
      return { sent: false, reason: `${response.status} ${detail.slice(0, 200)}` };
    }

    const data = (await response.json()) as { id?: string };
    return { sent: true, id: data.id ?? "" };
  } catch (error) {
    return { sent: false, reason: error instanceof Error ? error.message : "network error" };
  }
}

const PAYMENT_LABELS: Record<string, string> = {
  cod: "Cash on delivery",
  whish: "Whish transfer",
};

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * The new-order email the owner gets: everything needed to decide, and one
 * button that opens the order in the dashboard to confirm or cancel it.
 */
export function buildOrderEmail(order: PlacedOrder, dashboardUrl: string) {
  const currency = order.currency || "USD";
  const address = [order.address_line, order.address_details, order.city, order.delivery_zone_name]
    .filter(Boolean)
    .join(", ");
  const payment = PAYMENT_LABELS[order.payment_method] ?? order.payment_method;

  const lines = order.items
    .map((item) => `${item.quantity} × ${item.name} — ${formatPrice(item.line_total, currency)}`)
    .join("\n");

  const text = [
    `New order #${order.order_number} — ${formatPrice(order.total, currency)}`,
    "",
    `Customer: ${order.customer_name}`,
    `Phone: ${order.customer_phone}`,
    order.customer_email ? `Email: ${order.customer_email}` : "",
    `Address: ${address}`,
    order.notes ? `Note: ${order.notes}` : "",
    "",
    lines,
    "",
    `Subtotal: ${formatPrice(order.subtotal, currency)}`,
    `Delivery: ${order.delivery_fee ? formatPrice(order.delivery_fee, currency) : "Free"}`,
    `Total: ${formatPrice(order.total, currency)}`,
    `Payment: ${payment}${order.payment_reference ? ` (ref ${order.payment_reference})` : ""}`,
    "",
    `Confirm or cancel it here: ${dashboardUrl}`,
  ]
    .filter((line) => line !== "")
    .join("\n");

  const itemRows = order.items
    .map(
      (item) => `
        <tr>
          <td style="padding:8px 0;border-bottom:1px solid #eee;color:#111">
            ${escapeHtml(item.name)} <span style="color:#888">× ${item.quantity}</span>
          </td>
          <td style="padding:8px 0;border-bottom:1px solid #eee;text-align:right;color:#111">
            ${formatPrice(item.line_total, currency)}
          </td>
        </tr>`,
    )
    .join("");

  const html = `<!doctype html>
<html><body style="margin:0;background:#f6f3ef;padding:24px;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif">
  <table role="presentation" style="max-width:560px;margin:0 auto;background:#fff;border-radius:14px;padding:28px">
    <tr><td>
      <p style="margin:0;font-size:12px;letter-spacing:.16em;text-transform:uppercase;color:#8a6f2f">
        ${escapeHtml(order.business_name)}
      </p>
      <h1 style="margin:8px 0 2px;font-size:22px;color:#111">New order #${order.order_number}</h1>
      <p style="margin:0 0 20px;font-size:26px;font-weight:600;color:#111">
        ${formatPrice(order.total, currency)}
        <span style="font-size:13px;font-weight:400;color:#666">· ${escapeHtml(payment)}</span>
      </p>

      <a href="${escapeHtml(dashboardUrl)}"
         style="display:inline-block;background:#111;color:#fff;text-decoration:none;padding:13px 26px;border-radius:999px;font-size:13px;letter-spacing:.08em;text-transform:uppercase">
        Confirm or cancel this order
      </a>

      <table role="presentation" style="width:100%;margin-top:24px;border-collapse:collapse;font-size:14px">
        ${itemRows}
        <tr>
          <td style="padding:10px 0 0;color:#666">Subtotal</td>
          <td style="padding:10px 0 0;text-align:right;color:#111">${formatPrice(order.subtotal, currency)}</td>
        </tr>
        <tr>
          <td style="padding:4px 0;color:#666">Delivery${order.delivery_zone_name ? ` · ${escapeHtml(order.delivery_zone_name)}` : ""}</td>
          <td style="padding:4px 0;text-align:right;color:#111">${order.delivery_fee ? formatPrice(order.delivery_fee, currency) : "Free"}</td>
        </tr>
        <tr>
          <td style="padding:10px 0 0;border-top:1px solid #eee;font-weight:600;color:#111">Total</td>
          <td style="padding:10px 0 0;border-top:1px solid #eee;text-align:right;font-weight:600;color:#111">${formatPrice(order.total, currency)}</td>
        </tr>
      </table>

      <h2 style="margin:26px 0 8px;font-size:13px;letter-spacing:.14em;text-transform:uppercase;color:#8a6f2f">Customer</h2>
      <p style="margin:0;font-size:14px;line-height:1.7;color:#333">
        <strong style="color:#111">${escapeHtml(order.customer_name)}</strong><br>
        <a href="tel:${escapeHtml(order.customer_phone)}" style="color:#111">${escapeHtml(order.customer_phone)}</a><br>
        ${order.customer_email ? `<a href="mailto:${escapeHtml(order.customer_email)}" style="color:#111">${escapeHtml(order.customer_email)}</a><br>` : ""}
        ${escapeHtml(address)}
      </p>
      ${
        order.notes
          ? `<p style="margin:14px 0 0;padding:12px;background:#f6f3ef;border-radius:8px;font-size:14px;color:#333"><strong>Note:</strong> ${escapeHtml(order.notes)}</p>`
          : ""
      }
      ${
        order.payment_reference
          ? `<p style="margin:14px 0 0;font-size:14px;color:#333"><strong>Whish reference:</strong> ${escapeHtml(order.payment_reference)}</p>`
          : ""
      }
    </td></tr>
  </table>
  <p style="max-width:560px;margin:14px auto 0;font-size:12px;color:#999;text-align:center">
    Sent automatically when a customer checks out on your website.
  </p>
</body></html>`;

  return {
    subject: `New order #${order.order_number} · ${formatPrice(order.total, currency)} · ${order.customer_name}`,
    html,
    text,
  };
}
