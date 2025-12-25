import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const GOOGLE_SHEETS_API_KEY = Deno.env.get('GOOGLE_SHEETS_API_KEY');
    if (!GOOGLE_SHEETS_API_KEY) {
      throw new Error('Google Sheets API key not configured');
    }

    const sheetId = '1alpI26husBws0nVHpf0_CcR4RS3FrrxhBxPLeuhK_3s';
    const range = 'Traffic Source!A:C';
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${encodeURIComponent(range)}?key=${GOOGLE_SHEETS_API_KEY}`;

    console.log('Fetching traffic source data...');
    const response = await fetch(url);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Google Sheets API error:', errorText);
      throw new Error(`Failed to fetch data: ${response.status}`);
    }

    const data = await response.json();
    const rows = data.values || [];

    // Skip header row
    const trafficData = rows.slice(1).map((row: string[]) => ({
      source: row[0] || '',
      views: parseNumber(row[1]),
      minutesWatched: parseNumber(row[2]),
    })).filter((item: any) => item.source && item.views > 0);

    // Sort by views descending
    trafficData.sort((a: any, b: any) => b.views - a.views);

    console.log(`Processed ${trafficData.length} traffic sources`);

    return new Response(
      JSON.stringify({ trafficData }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: unknown) {
    console.error('Error fetching traffic source:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function parseNumber(value: string): number {
  if (!value) return 0;
  const cleaned = value.toString().replace(/[^0-9.,\-]/g, '');
  const normalized = cleaned.replace(/\./g, '').replace(',', '.');
  return parseFloat(normalized) || 0;
}
