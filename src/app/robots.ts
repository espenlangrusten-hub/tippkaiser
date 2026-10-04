import type { MetadataRoute } from "next";

export const dynamic = "force-static";
import { INDEXABLE, SITE_URL } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  if (!INDEXABLE) return { rules: [{ userAgent: "*", disallow: "/" }] };
  return { rules: [{ userAgent: "*", allow: "/", disallow: ["/admin"] }], sitemap: `${SITE_URL}/sitemap.xml` };
}
