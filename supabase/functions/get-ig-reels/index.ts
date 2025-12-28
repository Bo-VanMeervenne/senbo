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
    const apiKey = Deno.env.get('GOOGLE_SHEETS_API_KEY');
    
    if (!apiKey) {
      console.error('GOOGLE_SHEETS_API_KEY is not configured');
      return new Response(
        JSON.stringify({ error: 'API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch from sheet with gid=1693539839
    // First get the sheet name from the spreadsheet metadata, or use direct range
    const sheetName = 'IG Reels';
    const range = encodeURIComponent(`${sheetName}!A2:I`);
    
    // Try fetching with sheet gid parameter for more reliability
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${range}?key=${apiKey}`;
    
    console.log('Fetching IG Reels from Google Sheets...');
    
    const response = await fetch(url);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Google Sheets API error:', response.status, errorText);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch from Google Sheets', details: errorText }),
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    console.log('Google Sheets IG Reels response:', JSON.stringify(data));

    const parseNumber = (value: string): number => {
      if (!value) return 0;
      const cleaned = value.toString().replace(/[,.\s]/g, '');
      return parseInt(cleaned) || 0;
    };

    // Actual columns: A=Creator, B=Title, C=Likes, D=Views, E=PublishDate, F=Thumbnail, G=URL, H=Comments, I=Duration
    const reels = (data.values || [])
      .filter((row: string[]) => row[0] && row[6]) // Must have creator and URL
      .map((row: string[]) => ({
        creator: row[0] || '',
        title: row[1] || '',
        likes: parseNumber(row[2] || '0'),
        views: parseNumber(row[3] || '0'),
        publishDate: row[4] || '',
        thumbnailUrl: row[5] || '',
        url: row[6] || '',
        comments: parseNumber(row[7] || '0'),
        duration: row[8] || '',
      }));

    console.log(`Parsed ${reels.length} IG Reels`);

    return new Response(
      JSON.stringify({ reels }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in get-ig-reels function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
