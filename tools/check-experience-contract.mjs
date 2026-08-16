import { readFile } from "node:fs/promises";

const failures = [];

const read = (path) => readFile(path, "utf8");

function requireText(content, needle, label) {
  if (!content.includes(needle)) failures.push(`${label}: missing ${JSON.stringify(needle)}`);
}

function forbidText(content, needle, label) {
  if (content.includes(needle)) failures.push(`${label}: forbidden ${JSON.stringify(needle)}`);
}

const [
  packageJsonRaw,
  wrangler,
  workerMain,
  index,
  testimonials,
  testimonialScroll,
  stories,
  storyCard,
  frameworkBadge,
  frameworks,
  hub,
  logos,
  logoScroll,
  complianceTrack,
  animations,
  saleArg,
  layout,
  header,
  headerMenu,
  mobileMenu,
  agents,
] = await Promise.all([
  read("package.json"),
  read("wrangler.jsonc"),
  read("worker/main.ts"),
  read("src/pages/index.astro"),
  read("src/components/block/ZebraByteTestimonials.astro"),
  read("src/components/block/TestimonialsScroll.svelte"),
  read("src/components/block/Stories.astro"),
  read("src/components/StoryCard.astro"),
  read("src/components/FrameworkBadge.svelte"),
  read("src/components/block/Frameworks.astro"),
  read("src/pages/hub.astro"),
  read("src/components/block/Logos.astro"),
  read("src/components/LogosScroll.svelte"),
  read("src/components/block/ComplianceTrack.astro"),
  read("src/styles/animation.css"),
  read("src/components/ui/SaleArg.astro"),
  read("src/layouts/Layout.astro"),
  read("src/components/Header.astro"),
  read("src/components/HeaderMenu.astro"),
  read("src/components/MobileMenu.astro"),
  read("AGENTS.md"),
]);

const packageJson = JSON.parse(packageJsonRaw);
requireText(packageJson.scripts?.build ?? "", "npm run check:experience", "build pipeline");

requireText(wrangler, '"main": "./worker/main.ts"', "Cloudflare Worker entrypoint");
requireText(wrangler, '"binding": "AI"', "Workers AI binding");
requireText(workerMain, 'from "./router"', "Worker router delegation");
requireText(workerMain, "router.fetch(request, env)", "Worker router delegation");

requireText(index, 'import Badges from "../components/Badges.svelte"', "homepage animated framework grid");
requireText(index, "<Badges", "homepage framework grid");
requireText(index, "client:load", "homepage framework grid hydration");
requireText(index, "<animated-hero", "homepage animated hero");
requireText(index, "AnimatedHero", "homepage animated hero registration");
forbidText(index, "BadgesStatic", "homepage framework grid");

requireText(testimonials, 'import Scroll from "./TestimonialsScroll.svelte"', "testimonial carousel");
requireText(testimonials, "<Scroll client:load>", "testimonial carousel hydration");
requireText(testimonialScroll, "AutoScroll", "testimonial auto-scroll");
requireText(testimonialScroll, "Intersection", "testimonial viewport lifecycle");
requireText(testimonialScroll, "speed: -1", "testimonial reverse desktop row");

requireText(stories, 'import Slider from "../ui/Slider.svelte"', "case-study carousel");
requireText(stories, "client:load", "case-study carousel hydration");
requireText(stories, "withOverflow", "case-study overflow behavior");
requireText(stories, "navigateOnClick", "case-study click navigation");
forbidText(stories, ".slice(0, 6)", "case-study collection completeness");

requireText(storyCard, 'FrameworkBadge from "../components/FrameworkBadge.svelte"', "story animated badge");
requireText(storyCard, "client:only", "story animated badge hydration");
forbidText(storyCard, "FrameworkBadgeStatic", "story animated badge");
requireText(frameworkBadge, 'from "lottie-web"', "framework Lottie badge");
requireText(frameworkBadge, "lottie.loadAnimation", "framework Lottie badge");
requireText(frameworkBadge, ".json`", "framework Lottie asset");

requireText(frameworks, 'Badges from "../Badges.svelte"', "framework section live badge grid");
requireText(frameworks, "client:visible", "framework section live badge hydration");
forbidText(frameworks, "BadgesStatic", "framework section live badge grid");
requireText(hub, 'FrameworkBadge from "../components/FrameworkBadge.svelte"', "Hub animated badges");
requireText(hub, "client:visible", "Hub animated badge hydration");
forbidText(hub, "FrameworkBadgeStatic", "Hub animated badges");

requireText(logos, 'LogosScroll from "../LogosScroll.svelte"', "customer logo carousel");
requireText(logos, "client:load", "customer logo carousel hydration");
requireText(logoScroll, "AutoScroll", "customer logo auto-scroll");
requireText(logoScroll, "prefers-reduced-motion: reduce", "customer logo reduced-motion support");

requireText(complianceTrack, "<compliance-track", "compliance journey progression");
requireText(complianceTrack, "IntersectionObserver", "compliance journey viewport trigger");
requireText(complianceTrack, 'setAttribute("data-active", "true")', "compliance journey active states");

requireText(animations, "@media (prefers-reduced-motion: reduce)", "global reduced-motion support");
forbidText(animations, "@media (max-width: 639px), (prefers-reduced-motion: reduce)", "mobile motion parity");

requireText(saleArg, "const poster =", "autopilot video poster");
requireText(saleArg, "poster={poster}", "autopilot video poster rendering");
requireText(saleArg, 'preload="none"', "autopilot video lazy loading");

requireText(layout, 'import { ClientRouter } from "astro:transitions"', "marketing view transitions");
requireText(layout, "<ClientRouter />", "marketing view transitions");
requireText(layout, 'class="text-primary bg-level-0 font-sans text-base"', "global body visual contract");
requireText(layout, 'href="#main-content"', "skip-to-content accessibility");
requireText(layout, 'id="main-content"', "main content focus target");
requireText(layout, "display=swap", "Geist typography fidelity");
requireText(layout, 'rel="preconnect" href="https://fonts.googleapis.com"', "font preconnect");
requireText(layout, 'rel="preconnect" href="https://fonts.gstatic.com"', "font preconnect");

requireText(header, "backdrop-blur-md", "header visual treatment");
requireText(header, '<MobileMenu id="mobile-menu" />', "mobile navigation drawer rendering");
requireText(header, 'customElementDefine("burger-menu"', "mobile navigation controller");
requireText(header, "lockPage()", "mobile navigation scroll lock");
requireText(header, "closeOnEscape", "mobile navigation Escape behavior");
requireText(header, 'CustomEvent("zbt:main-menu-open")', "mobile/account menu coordination");
requireText(mobileMenu, "details[data-mobile-section]", "mobile feature accordion");
requireText(mobileMenu, "astro:page-load", "mobile navigation lifecycle rebinding");

requireText(headerMenu, 'document.addEventListener("pointerdown", this.onDocumentPointerDown)', "desktop menu outside-click close");
requireText(headerMenu, 'link.addEventListener("click", this.close)', "desktop menu link close");
requireText(headerMenu, "suppressNextFocus", "desktop menu Escape focus guard");
requireText(headerMenu, 'event.key !== "Escape"', "desktop menu Escape behavior");
requireText(headerMenu, "transitionPanels", "desktop menu panel transition behavior");
requireText(headerMenu, "contentTravelDistance", "desktop menu directional motion");
requireText(headerMenu, "getAnimations()", "desktop menu transition cancellation");
requireText(headerMenu, "prefers-reduced-motion: reduce", "desktop menu reduced-motion behavior");
requireText(headerMenu, 'CustomEvent("zbt:main-menu-open")', "desktop/account menu coordination");
requireText(headerMenu, "data-menu-feature-image", "desktop menu deferred media");

requireText(agents, "ZebraByte Experience Contract", "agent engineering contract");
requireText(agents, "worker/main.ts", "agent Worker architecture guidance");
requireText(agents, "prefers-reduced-motion", "agent motion guidance");
requireText(agents, "Cloudflare Workers Build", "agent deployment guidance");

if (failures.length) {
  console.error(`[experience] ${failures.length} contract violation(s):`);
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("[experience] ZebraByte experience contract OK");
