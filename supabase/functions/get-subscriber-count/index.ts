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
    console.log('All rows:', JSON.stringify(rows));
    
    if (rows.length < 2) {
      return new Response(
        JSON.stringify({ subscriberCount: 0, totalViews: 0, totalVideos: 0, lastUpdated: null }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Get the last row (most recent data)
    const lastRow = rows[rows.length - 1];
    
    console.log('Last row raw data:', JSON.stringify(lastRow));
    
    // Parse the data: Timestamp, Subscribers, Total Views, Total Videos
    const parseNumber = (value: string): number => {
      if (!value) return 0;
      console.log('Parsing value:', value);
      // Handle European format with dots as thousand separators (e.g., "2.220.000")
      // First remove spaces, then handle the format
      let cleaned = value.toString().trim();
      // If it contains dots but no comma, treat dots as thousand separators
      if (cleaned.includes('.') && !cleaned.includes(',')) {
        cleaned = cleaned.replace(/\./g, '');
      }
      // If it contains comma as decimal separator (European), convert it
      if (cleaned.includes(',')) {
        // Check if comma is decimal separator (e.g., "2.220.000,50")
        const parts = cleaned.split(',');
        if (parts.length === 2 && parts[1].length <= 2) {
          cleaned = parts[0].replace(/\./g, '') + '.' + parts[1];
        } else {
          cleaned = cleaned.replace(/,/g, '');
        }
      }
      cleaned = cleaned.replace(/[^0-9.-]/g, '');
      const result = parseInt(cleaned) || 0;
      console.log('Parsed result:', result);
      return result;
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
