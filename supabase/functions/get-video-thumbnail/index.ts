const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { url } = await req.json();
    
    if (!url) {
      return new Response(
        JSON.stringify({ error: 'URL is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Fetching thumbnail for:', url);

    let thumbnail: string | null = null;
    let platform: string | null = null;

    // YouTube
    if (url.includes('youtube.com') || url.includes('youtu.be')) {
      platform = 'youtube';
      const videoId = extractYouTubeId(url);
      if (videoId) {
        thumbnail = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
      }
    }
    // Instagram
    else if (url.includes('instagram.com') || url.includes('instagr.am')) {
      platform = 'instagram';
      try {
        const oembedUrl = `https://www.instagram.com/api/v1/oembed/?url=${encodeURIComponent(url)}`;
        const response = await fetch(oembedUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          }
        });
        if (response.ok) {
          const data = await response.json();
          thumbnail = data.thumbnail_url || null;
          console.log('Instagram oEmbed response:', data);
        } else {
          console.log('Instagram oEmbed failed:', response.status);
        }
      } catch (e) {
        console.error('Instagram fetch error:', e);
      }
    }
    // TikTok
    else if (url.includes('tiktok.com') || url.includes('vm.tiktok')) {
      platform = 'tiktok';
      try {
        const oembedUrl = `https://www.tiktok.com/oembed?url=${encodeURIComponent(url)}`;
        const response = await fetch(oembedUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          }
        });
        if (response.ok) {
          const data = await response.json();
          thumbnail = data.thumbnail_url || null;
          console.log('TikTok oEmbed response:', data);
        } else {
          console.log('TikTok oEmbed failed:', response.status);
        }
      } catch (e) {
        console.error('TikTok fetch error:', e);
      }
    }

    console.log('Returning thumbnail:', thumbnail, 'platform:', platform);

    return new Response(
      JSON.stringify({ thumbnail, platform }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to fetch thumbnail' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function extractYouTubeId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/(?:watch\?v=|embed\/|v\/|shorts\/)|youtu\.be\/)([^&\n?#]+)/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}
