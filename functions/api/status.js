const STATUS_SOURCE = "https://status.zebrabyte.ro/api/status";
const ALLOWED_STATUS = new Set(["operational", "degraded", "outage", "no_data"]);

const responseHeaders = {
  "Content-Type": "application/json; charset=utf-8",
  "Cache-Control": "no-store, max-age=0",
  "X-Content-Type-Options": "nosniff",
};

function statusResponse(overall) {
  return new Response(JSON.stringify({ overall }), {
    status: 200,
    headers: responseHeaders,
  });
}

export async function onRequestGet() {
  try {
    const upstream = await fetch(STATUS_SOURCE, {
      headers: { Accept: "application/json" },
      cf: { cacheTtl: 0, cacheEverything: false },
    });

    if (!upstream.ok) return statusResponse("no_data");

    const payload = await upstream.json();
    const overall = ALLOWED_STATUS.has(payload?.overall) ? payload.overall : "no_data";
    return statusResponse(overall);
  } catch {
    return statusResponse("no_data");
  }
}

export function onRequestHead() {
  return new Response(null, {
    status: 200,
    headers: responseHeaders,
  });
}
