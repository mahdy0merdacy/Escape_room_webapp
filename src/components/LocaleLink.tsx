"use client";

import Link, { type LinkProps } from "next/link";
import type { AnchorHTMLAttributes } from "react";
import { useLocale } from "./IntlProvider";
import { localePath } from "@/lib/i18n/locale-url";

type Props = LinkProps & AnchorHTMLAttributes<HTMLAnchorElement> & { children?: React.ReactNode };

/**
 * Drop-in replacement for next/link's <Link> that prefixes root-relative
 * hrefs ("/", "/rooms") with the current locale segment. External links
 * and hrefs that already carry a protocol pass through unchanged.
 */
export default function LocaleLink({ href, ...rest }: Props) {
  const { locale } = useLocale();
  const target =
    typeof href === "string" && href.startsWith("/") ? localePath(locale, href) : href;

  return <Link href={target} {...rest} />;
}
