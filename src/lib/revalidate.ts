import "server-only";
import { revalidatePath } from "next/cache";

/**
 * Invalidates the public website after a dashboard edit.
 *
 * The catalog lives at a dynamic segment (/menu, /shop, /services — see
 * src/app/(site)/[segment]/page.tsx), so it's revalidated by route *pattern*
 * rather than by literal path. That way one helper works for every industry
 * and no action has to know which segment the current business uses.
 */
export function revalidateCatalog() {
  revalidatePath("/", "page");
  revalidatePath("/[segment]", "page");
}

/** Chrome-level changes (name, logo, colors, contact details, SEO) affect the
 * shared site layout, so everything below it has to be invalidated. */
export function revalidateSiteChrome() {
  revalidatePath("/", "layout");
}

export function revalidateGallery() {
  revalidatePath("/gallery");
  revalidatePath("/", "page");
}
