import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SHEET_ID = '1alpI26husBws0nVHpf0_CcR4RS3FrrxhBxPLeuhK_3s';
const RANGE = 'Summary!H3:I3';

serve(async (req) => {
  // Handle CORS preflight requests
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

    const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${RANGE}?key=${apiKey}`;
    
    console.log('Fetching from Google Sheets...');
    
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
    console.log('Google Sheets response:', JSON.stringify(data));
    
    // H3 = Bowie's amount, I3 = Senne's amount
    const values = data.values?.[0] || [];
    const bowieRaw = values[0] || '0';
    const senneRaw = values[1] || '0';
    
    // Parse the values - handle European format (7.186,20) and other formats
    const parseAmount = (value: string): number => {
      // Remove currency symbols and whitespace
      let cleaned = value.toString().replace(/[€$£\s]/g, '');
      
      // Check if it's European format (comma as decimal, period as thousands)
      // European: 7.186,20 -> 7186.20
      // US: 7,186.20 -> 7186.20
      if (cleaned.includes(',') && cleaned.includes('.')) {
        // Has both - check which comes last (that's the decimal separator)
        const lastComma = cleaned.lastIndexOf(',');
        const lastPeriod = cleaned.lastIndexOf('.');
        if (lastComma > lastPeriod) {
          // European format: 7.186,20
          cleaned = cleaned.replace(/\./g, '').replace(',', '.');
        } else {
          // US format: 7,186.20
          cleaned = cleaned.replace(/,/g, '');
        }
      } else if (cleaned.includes(',')) {
        // Only comma - could be decimal (7,20) or thousands (7,186)
        // If 2 digits after comma, treat as decimal
        const parts = cleaned.split(',');
        if (parts[1] && parts[1].length === 2) {
          cleaned = cleaned.replace(',', '.');
        } else {
          cleaned = cleaned.replace(/,/g, '');
        }
      }
      
      return parseFloat(cleaned) || 0;
    };
    
    const bowie = parseAmount(bowieRaw);
    const senne = parseAmount(senneRaw);
    
    console.log(`Parsed values - Bowie: ${bowie}, Senne: ${senne}`);

    return new Response(
      JSON.stringify({ bowie, senne }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in get-revenue function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
