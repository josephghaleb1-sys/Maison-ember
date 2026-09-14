import { WhatsAppIcon } from "@/components/site/social-icons";

/**
 * Persistent WhatsApp button. Rendered only when the business has saved a
 * WhatsApp/phone number — a lot of small businesses take orders by message,
 * and most of their traffic arrives from a phone.
 */
export function FloatingContact({ href }: { href: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer noopener"
      aria-label="Chat on WhatsApp"
      className="fixed bottom-5 right-5 z-40 flex size-13 items-center justify-center rounded-full border border-accent/40 bg-ink-900/90 text-accent shadow-[0_8px_30px_rgba(0,0,0,0.45)] backdrop-blur transition-[transform,background-color,color] duration-300 hover:scale-105 hover:bg-accent hover:text-on-accent motion-reduce:hover:scale-100 sm:bottom-7 sm:right-7"
    >
      <WhatsAppIcon className="size-6" />
    </a>
  );
}
