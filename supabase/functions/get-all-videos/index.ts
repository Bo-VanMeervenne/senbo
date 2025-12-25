import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SHEET_ID = '1alpI26husBws0nVHpf0_CcR4RS3FrrxhBxPLeuhK_3s';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    let month = 'last';
    try {
      const body = await req.json();
      month = body?.month || 'last';
    } catch {
      // No body or invalid JSON, use default
    }

    const apiKey = Deno.env.get('GOOGLE_SHEETS_API_KEY');
    
    if (!apiKey) {
      console.error('GOOGLE_SHEETS_API_KEY is not configured');
      return new Response(
        JSON.stringify({ error: 'API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch from video sheets and Summary sheet
    const senboSheetName = month === 'current' ? 'Senne & Bo Videos (Current Month)' : 'Senne & Bo Videos (Last Month)';
    const senneSheetName = month === 'current' ? 'Senne Only Videos (Current Month)' : 'Senne Only Videos (Last Month)';
    const summarySheetName = month === 'current' ? 'Summary (Current Month)' : 'Summary (Last Month)';
    
    // Fetch ALL rows - no limit (use A2:O for all rows in column range)
    const senboRange = encodeURIComponent(`${senboSheetName}!A2:O`);
    const senneRange = encodeURIComponent(`${senneSheetName}!A2:N`);
    // Summary: C2 = Total Views for SenBo, H2 = Bo revenue (SenBo), I2 = Senne revenue
    const summaryRange = encodeURIComponent(`${summarySheetName}!C2:I2`);
    
    const senboUrl = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${senboRange}?key=${apiKey}`;
    const senneUrl = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${senneRange}?key=${apiKey}`;
    const summaryUrl = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${summaryRange}?key=${apiKey}`;
    
    console.log(`Fetching combined videos for ${month} month`);
    
    // Fetch all in parallel
    const [senboResponse, senneResponse, summaryResponse] = await Promise.all([
      fetch(senboUrl),
      fetch(senneUrl),
      fetch(summaryUrl)
    ]);
    
    if (!senboResponse.ok || !senneResponse.ok) {
      const errorText = !senboResponse.ok ? await senboResponse.text() : await senneResponse.text();
      console.error('Google Sheets API error:', errorText);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch from Google Sheets', details: errorText }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const [senboData, senneData, summaryData] = await Promise.all([
      senboResponse.json(),
      senneResponse.json(),
      summaryResponse.ok ? summaryResponse.json() : { values: [] }
    ]);
    
    const parseAmount = (value: string): number => {
      if (!value) return 0;
      let cleaned = value.toString().replace(/[€$£\s]/g, '');
      
      if (cleaned.includes(',') && cleaned.includes('.')) {
        const lastComma = cleaned.lastIndexOf(',');
        const lastPeriod = cleaned.lastIndexOf('.');
        if (lastComma > lastPeriod) {
          cleaned = cleaned.replace(/\./g, '').replace(',', '.');
        } else {
          cleaned = cleaned.replace(/,/g, '');
        }
      } else if (cleaned.includes(',')) {
        const parts = cleaned.split(',');
        if (parts[1] && parts[1].length === 2) {
          cleaned = cleaned.replace(',', '.');
        } else {
          cleaned = cleaned.replace(/,/g, '');
        }
      }
      
      return parseFloat(cleaned) || 0;
    };

    const parseViews = (value: string): number => {
      if (!value) return 0;
      const cleaned = value.toString().replace(/[,.\s]/g, '');
      return parseInt(cleaned) || 0;
    };

    const extractVideoId = (url: string, providedId?: string): string | null => {
      if (providedId) return providedId;
      if (!url) return null;
      const shortsMatch = url.match(/shorts\/([a-zA-Z0-9_-]+)/);
      if (shortsMatch) return shortsMatch[1];
      const regularMatch = url.match(/(?:v=|\/embed\/|\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/);
      if (regularMatch) return regularMatch[1];
      return null;
    };

    // Parse Senne & Bo videos (revenue is in column F index 5)
    const senboVideos = (senboData.values || [])
      .filter((row: string[]) => row[0] && row[1])
      .map((row: string[]) => ({
        title: row[0] || '',
        url: row[1] || '',
        videoId: extractVideoId(row[1] || ''),
        views: parseViews(row[2] || '0'),
        revenue: parseAmount(row[5] || '0'),
        publishDate: row[8] || '',
        minutesWatched: parseViews(row[9] || '0'),
        avgDuration: row[10] || '',
        likes: parseViews(row[11] || '0'),
        shares: parseViews(row[12] || '0'),
        subsGained: parseViews(row[13] || '0'),
        thumbnailUrl: row[14] || '',
        source: 'senbo' as const,
      }));

    // Parse Senne Only videos (Revenue After Tax is column F index 5)
    const senneVideos = (senneData.values || [])
      .filter((row: string[]) => row[0] && row[1])
      .map((row: string[]) => ({
        title: row[0] || '',
        url: row[1] || '',
        videoId: extractVideoId(row[1] || '', row[6]),
        views: parseViews(row[2] || '0'),
        revenue: parseAmount(row[5] || '0'), // Revenue After Tax (column F)
        publishDate: row[7] || '',
        minutesWatched: parseViews(row[8] || '0'),
        avgDuration: row[9] || '',
        likes: parseViews(row[10] || '0'),
        shares: parseViews(row[11] || '0'),
        subsGained: parseViews(row[12] || '0'),
        thumbnailUrl: row[13] || '',
        source: 'senne' as const,
      }));

    // Combine videos using composite key (source + videoId) to prevent cross-source deduplication
    const videoMap = new Map();
    
    // Add Senne & Bo videos
    senboVideos.forEach((video: any) => {
      const key = `senbo_${video.videoId || video.url}`;
      videoMap.set(key, video);
    });
    
    // Add Senne Only videos - always add, they're from a different channel
    senneVideos.forEach((video: any) => {
      const key = `senne_${video.videoId || video.url}`;
      videoMap.set(key, video);
    });

    const combinedVideos = Array.from(videoMap.values());

    // Parse Summary data for totals
    // Summary range starts at C: [C2, D2, E2, F2, G2, H2, I2]
    // C2 = Total SenBo views
    // H2 = SenBo revenue (Bo)
    // I2 = Senne revenue
    let senboSummaryRevenue = 0;
    let senboSummaryViews = 0;
    let senneSummaryRevenue: number | null = null;
    
    if (summaryData.values && summaryData.values[0]) {
      const summaryRow = summaryData.values[0];
      senboSummaryViews = parseViews(summaryRow[0] || '0');
      senboSummaryRevenue = parseAmount(summaryRow[5] || '0');
      senneSummaryRevenue = parseAmount(summaryRow[6] || '0');
      console.log(`Summary: SenBo Views=${senboSummaryViews}, SenBo Revenue=$${senboSummaryRevenue}, Senne Revenue=$${senneSummaryRevenue}`);
    }

    // Calculate Senne totals
    // Prefer Summary (matches the Revenue Split / earnings), fall back to summing video rows if missing
    const senneTotalRevenue = (senneSummaryRevenue ?? senneVideos.reduce((sum: number, v: any) => sum + v.revenue, 0));
    const senneTotalViews = senneVideos.reduce((sum: number, v: any) => sum + v.views, 0);

    console.log(`Parsed ${senboVideos.length} Senne & Bo + ${senneVideos.length} Senne Only = ${combinedVideos.length} total videos`);
    console.log(`Totals: SenBo=$${senboSummaryRevenue.toFixed(2)}, Senne=$${senneTotalRevenue.toFixed(2)}, Combined=$${(senboSummaryRevenue + senneTotalRevenue).toFixed(2)}`);

    return new Response(
      JSON.stringify({ 
        videos: combinedVideos,
        totals: {
          senbo: { revenue: senboSummaryRevenue, views: senboSummaryViews },
          senne: { revenue: senneTotalRevenue, views: senneTotalViews },
          combined: { 
            revenue: senboSummaryRevenue + senneTotalRevenue, 
            views: senboSummaryViews + senneTotalViews 
          }
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in get-all-videos function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
