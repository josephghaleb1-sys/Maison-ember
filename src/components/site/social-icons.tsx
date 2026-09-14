import type { SVGProps } from "react";
import type { WebsiteSocialLinks } from "@/lib/database.types";

/**
 * Small hand-drawn brand glyphs. lucide-react dropped its brand icons in v1,
 * and pulling a whole icon pack for five social links isn't worth the bytes —
 * these are a few hundred bytes each and inherit currentColor.
 */

type IconProps = SVGProps<SVGSVGElement>;

const base = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.6,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
};

export function InstagramIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <rect x="3" y="3" width="18" height="18" rx="5.2" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.2" cy="6.8" r="1.1" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function FacebookIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M15.5 8.2H14a1.3 1.3 0 0 0-1.3 1.3v2.1h2.6l-.4 2.8h-2.2V21" />
      <path d="M12.7 14.4H10.3v-2.8h2.4" />
      <rect x="3" y="3" width="18" height="18" rx="5.2" />
    </svg>
  );
}

export function TikTokIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M14.8 3v10.6a3.4 3.4 0 1 1-3.4-3.4" />
      <path d="M14.8 5.6A4.6 4.6 0 0 0 19.4 9" />
    </svg>
  );
}

export function XIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M4.5 4.5 19.5 19.5" />
      <path d="M19.5 4.5 4.5 19.5" />
    </svg>
  );
}

export function WhatsAppIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M20.5 11.7a8.5 8.5 0 0 1-12.4 7.5L3.5 20.5l1.4-4.4a8.5 8.5 0 1 1 15.6-4.4z" />
      <path d="M9 9.4c.2-.4.4-.4.7-.4h.5l.9 2-.7.7a6 6 0 0 0 2.6 2.6l.7-.7 2 .9v.5c0 .3 0 .5-.4.7-.5.3-1.3.3-2.1 0a8.6 8.6 0 0 1-4.5-4.5c-.3-.8-.3-1.5 0-2z" />
    </svg>
  );
}

export function GlobeIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M3.5 9h17M3.5 15h17" />
      <path d="M12 3a15 15 0 0 1 0 18 15 15 0 0 1 0-18z" />
    </svg>
  );
}

type SocialKey = keyof WebsiteSocialLinks;

export const SOCIAL_META: {
  key: SocialKey;
  label: string;
  Icon: (props: IconProps) => React.JSX.Element;
}[] = [
  { key: "instagram", label: "Instagram", Icon: InstagramIcon },
  { key: "facebook", label: "Facebook", Icon: FacebookIcon },
  { key: "tiktok", label: "TikTok", Icon: TikTokIcon },
  { key: "twitter", label: "X", Icon: XIcon },
  { key: "yelp", label: "Yelp", Icon: GlobeIcon },
];
