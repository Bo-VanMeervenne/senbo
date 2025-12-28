import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const isAllowedImageUrl = (raw: string) => {
  try {
    const u = new URL(raw);
    if (u.protocol !== "https:") return false;

    // Allow known Instagram image CDNs only (prevents SSRF)
    const host = u.hostname.toLowerCase();
    const allowedHosts = [
      "cdninstagram.com",
      "fbcdn.net",
      "instagram.com",
      "cdn.fbsbx.com",
    ];

    return allowedHosts.some((d) => host === d || host.endsWith(`.${d}`));
  } catch {
    return false;
  }
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const imageUrl = url.searchParams.get("url") ?? "";

    if (!imageUrl || !isAllowedImageUrl(imageUrl)) {
      return new Response(JSON.stringify({ error: "Invalid image url" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("Proxying IG thumbnail:", imageUrl);

    const upstream = await fetch(imageUrl, {
      headers: {
        // Some CDNs behave better with a UA
        "User-Agent": "Mozilla/5.0 (compatible; LovableThumbnailProxy/1.0)",
        Accept: "image/avif,image/webp,image/apng,image/*,*/*;q=0.8",
      },
    });

    if (!upstream.ok) {
      const text = await upstream.text();
      console.error("Upstream image fetch failed:", upstream.status, text);
      return new Response(JSON.stringify({ error: "Upstream fetch failed" }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const contentType = upstream.headers.get("content-type") || "image/jpeg";

    // Stream bytes through, add CORS + caching
    return new Response(upstream.body, {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=86400",
      },
    });
  } catch (error) {
    console.error("Error in ig-thumbnail-proxy:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
