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
    const range = 'Country Revenue!A:D';
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${encodeURIComponent(range)}?key=${GOOGLE_SHEETS_API_KEY}`;

    console.log('Fetching country revenue data...');
    const response = await fetch(url);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Google Sheets API error:', errorText);
      throw new Error(`Failed to fetch data: ${response.status}`);
    }

    const data = await response.json();
    const rows = data.values || [];

    // Skip header row
    const countryData = rows.slice(1).map((row: string[]) => ({
      country: row[0] || '',
      revenue: parseAmount(row[1]),
      views: parseNumber(row[2]),
      rpm: parseAmount(row[3]),
    })).filter((item: any) => item.country && item.revenue > 0);

    // Sort by revenue descending and take top 25
    countryData.sort((a: any, b: any) => b.revenue - a.revenue);
    const top25 = countryData.slice(0, 25);

    console.log(`Processed ${top25.length} countries`);

    return new Response(
      JSON.stringify({ countryData: top25 }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: unknown) {
    console.error('Error fetching country revenue:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function parseAmount(value: string): number {
  if (!value) return 0;
  const cleaned = value.toString().replace(/[^0-9.,\-]/g, '');
  // Handle European format (1.234,56) vs US format (1,234.56)
  if (cleaned.includes(',') && cleaned.includes('.')) {
    if (cleaned.lastIndexOf(',') > cleaned.lastIndexOf('.')) {
      return parseFloat(cleaned.replace(/\./g, '').replace(',', '.')) || 0;
    }
    return parseFloat(cleaned.replace(/,/g, '')) || 0;
  }
  if (cleaned.includes(',') && !cleaned.includes('.')) {
    const parts = cleaned.split(',');
    if (parts[parts.length - 1].length === 2) {
      return parseFloat(cleaned.replace(',', '.')) || 0;
    }
    return parseFloat(cleaned.replace(/,/g, '')) || 0;
  }
  return parseFloat(cleaned) || 0;
}

function parseNumber(value: string): number {
  if (!value) return 0;
  const cleaned = value.toString().replace(/[^0-9.,\-]/g, '');
  const normalized = cleaned.replace(/\./g, '').replace(',', '.');
  return parseFloat(normalized) || 0;
}
