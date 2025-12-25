import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get('GOOGLE_SHEETS_API_KEY');
    const sheetId = '1alpI26husBws0nVHpf0_CcR4RS3FrrxhBxPLeuhK_3s';
    const sheetName = 'Subscriber Tracker';
    
    console.log('Fetching subscriber count from sheet:', sheetName);
    
    // Fetch data from the Subscriber Tracker sheet
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${encodeURIComponent(sheetName)}!A:D?key=${apiKey}`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Google Sheets API error:', errorText);
      throw new Error(`Failed to fetch data: ${response.status}`);
    }
    
    const data = await response.json();
    const rows = data.values || [];
    
    console.log('Total rows fetched:', rows.length);
    
    if (rows.length < 2) {
      return new Response(
        JSON.stringify({ subscriberCount: 0, totalViews: 0, totalVideos: 0, lastUpdated: null }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Get the last row (most recent data)
    const lastRow = rows[rows.length - 1];
    
    // Parse the data: Timestamp, Subscribers, Total Views, Total Videos
    const parseNumber = (value: string): number => {
      if (!value) return 0;
      const cleaned = value.toString().replace(/[^0-9.-]/g, '');
      return parseInt(cleaned) || 0;
    };
    
    const result = {
      lastUpdated: lastRow[0] || null,
      subscriberCount: parseNumber(lastRow[1]),
      totalViews: parseNumber(lastRow[2]),
      totalVideos: parseNumber(lastRow[3]),
    };
    
    console.log('Subscriber data:', result);
    
    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: unknown) {
    console.error('Error fetching subscriber count:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
