const originalFetch = globalThis.fetch;

if (typeof originalFetch !== "function") {
  throw new Error("Global fetch is required for the ZebraByte blog sync.");
}

function optimizedSanityImageRequest(input) {
  const rawUrl =
    input instanceof Request
      ? input.url
      : input instanceof URL
        ? input.toString()
        : typeof input === "string"
          ? input
          : null;

  if (!rawUrl) return input;

  let url;
  try {
    url = new URL(rawUrl);
  } catch {
    return input;
  }

  if (url.hostname !== "cdn.sanity.io" || !url.pathname.includes("/images/")) {
    return input;
  }

  // The public article layout never needs the original multi-megapixel asset.
  // Ask Sanity's image pipeline to resize and encode before the file enters the
  // repository/build output. This keeps the migrated archive visually intact
  // while avoiding multi-megabyte hero images on article pages.
  url.searchParams.set("w", "1600");
  url.searchParams.set("fit", "max");
  url.searchParams.set("q", "82");
  url.searchParams.set("fm", "webp");

  if (input instanceof Request) {
    return new Request(url, input);
  }
  return url.toString();
}

globalThis.fetch = (input, init) => originalFetch(optimizedSanityImageRequest(input), init);

try {
  await import("./sync-zebrabyte-blog-v2.mjs");
} finally {
  globalThis.fetch = originalFetch;
}
