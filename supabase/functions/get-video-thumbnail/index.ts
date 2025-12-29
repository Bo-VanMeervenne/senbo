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
    let title: string | null = null;
    let platform: string | null = null;

    // YouTube
    if (url.includes('youtube.com') || url.includes('youtu.be')) {
      platform = 'youtube';
      try {
        const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`;
        const response = await fetch(oembedUrl);
        if (response.ok) {
          const data = await response.json();
          title = data.title || null;
          thumbnail = data.thumbnail_url || null;
          console.log('YouTube oEmbed response:', data);
        }
      } catch (e) {
        console.error('YouTube oEmbed error:', e);
      }
      // Fallback for thumbnail
      if (!thumbnail) {
        const videoId = extractYouTubeId(url);
        if (videoId) {
          thumbnail = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
        }
      }
    }
    // Instagram - use Graph API scraping approach
    else if (url.includes('instagram.com') || url.includes('instagr.am')) {
      platform = 'instagram';
      try {
        // Try the public oEmbed endpoint first
        const oembedUrl = `https://www.instagram.com/api/v1/oembed/?url=${encodeURIComponent(url)}`;
        console.log('Trying Instagram oEmbed:', oembedUrl);
        
        const response = await fetch(oembedUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'application/json',
          }
        });
        
        console.log('Instagram oEmbed status:', response.status);
        
        if (response.ok) {
          const data = await response.json();
          console.log('Instagram oEmbed response:', JSON.stringify(data));
          thumbnail = data.thumbnail_url || null;
          title = data.title || null;
        } else {
          const errorText = await response.text();
          console.log('Instagram oEmbed error response:', errorText);
        }
      } catch (e) {
        console.error('Instagram fetch error:', e);
      }
      
      // If oEmbed failed, try fetching the page and extracting og:image
      if (!thumbnail) {
        try {
          console.log('Trying Instagram page scrape for og:image');
          const pageResponse = await fetch(url, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
              'Accept': 'text/html',
            }
          });
          
          if (pageResponse.ok) {
            const html = await pageResponse.text();
            
            // Extract og:image
            const ogImageMatch = html.match(/<meta\s+property="og:image"\s+content="([^"]+)"/i) ||
                                html.match(/<meta\s+content="([^"]+)"\s+property="og:image"/i);
            if (ogImageMatch) {
              thumbnail = ogImageMatch[1];
              console.log('Found og:image:', thumbnail);
            }
            
            // Extract og:title
            const ogTitleMatch = html.match(/<meta\s+property="og:title"\s+content="([^"]+)"/i) ||
                                html.match(/<meta\s+content="([^"]+)"\s+property="og:title"/i);
            if (ogTitleMatch && !title) {
              title = ogTitleMatch[1];
              console.log('Found og:title:', title);
            }
          }
        } catch (e) {
          console.error('Instagram page scrape error:', e);
        }
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
          title = data.title || null;
          console.log('TikTok oEmbed response:', data);
        } else {
          console.log('TikTok oEmbed failed:', response.status);
        }
      } catch (e) {
        console.error('TikTok fetch error:', e);
      }
    }

    console.log('Returning thumbnail:', thumbnail, 'title:', title, 'platform:', platform);

    return new Response(
      JSON.stringify({ thumbnail, title, platform }),
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
