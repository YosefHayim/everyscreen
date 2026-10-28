import type { Page } from "playwright";
import { ACTION_TIMEOUT_MS } from "@/commands/command-steps";
import { waitForPaintedPage } from "@/live/screencast";
import {
  createRouteUrl,
  mergeRoutes,
  type PageLink,
  parseSitemapLocs,
  pickLinkRoutes,
  pickRoutes,
  pickStartRoute,
} from "@/sweep/sweep-logic";

const SITEMAP_PATH = "/sitemap.xml";
const LINK_SELECTOR = "a[href]";

export interface RouteSources {
  startUrl: string;
  maxRoutes: number;
  configuredRoutes: string[];
}

const readPageLinks = async (page: Page): Promise<PageLink[]> =>
  page.evaluate(
    (linkSelector) =>
      [...document.querySelectorAll<HTMLAnchorElement>(linkSelector)].map(
        (anchor) => ({
          href: anchor.href,
          rel: anchor.rel,
          isDownload: anchor.hasAttribute("download"),
        }),
      ),
    LINK_SELECTOR,
  );

// A page that fails to load has no links; the sweep step for that route reports the failure.
const readRouteLinks = async (
  page: Page,
  routeUrl: string,
  startUrl: string,
): Promise<string[]> => {
  try {
    await page.goto(routeUrl, { timeout: ACTION_TIMEOUT_MS });
    await waitForPaintedPage(page);
    const pageLinks = await readPageLinks(page);
    return pickLinkRoutes(pageLinks, startUrl);
  } catch (error) {
    console.error({ routeUrl, error });
    return [];
  }
};

const crawlRoutes = async (
  page: Page,
  startUrl: string,
  maxRoutes: number,
): Promise<string[]> => {
  const knownRoutes = [pickStartRoute(startUrl)];
  // The array iterator also visits routes pushed while the loop runs, which makes the crawl breadth-first.
  for (const route of knownRoutes) {
    const isRouteListFull = knownRoutes.length >= maxRoutes;
    if (isRouteListFull) break;
    const routeUrl = createRouteUrl(route, startUrl);
    const foundRoutes = await readRouteLinks(page, routeUrl, startUrl);
    const mergedRoutes = mergeRoutes([knownRoutes, foundRoutes], maxRoutes);
    knownRoutes.push(...mergedRoutes.slice(knownRoutes.length));
  }
  return knownRoutes;
};

const readSitemapRoutes = async (startUrl: string): Promise<string[]> => {
  const sitemapUrl = createRouteUrl(SITEMAP_PATH, startUrl);
  try {
    const sitemapReply = await fetch(sitemapUrl, {
      signal: AbortSignal.timeout(ACTION_TIMEOUT_MS),
    });
    const isSitemapMissing = !sitemapReply.ok;
    if (isSitemapMissing) return [];
    const sitemapXml = await sitemapReply.text();
    return pickRoutes(parseSitemapLocs(sitemapXml), startUrl);
  } catch (error) {
    console.error({ sitemapUrl, error });
    return [];
  }
};

export const listSweepRoutes = async (
  crawlPage: Page,
  routeSources: RouteSources,
): Promise<string[]> => {
  const { startUrl, maxRoutes, configuredRoutes } = routeSources;
  const crawledRoutes = await crawlRoutes(crawlPage, startUrl, maxRoutes);
  const sitemapRoutes = await readSitemapRoutes(startUrl);
  const yamlRoutes = pickRoutes(configuredRoutes, startUrl);
  return mergeRoutes([crawledRoutes, sitemapRoutes, yamlRoutes], maxRoutes);
};
