import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SHEET_ID = '1alpI26husBws0nVHpf0_CcR4RS3FrrxhBxPLeuhK_3s';

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get month parameter from request body
    let month = 'last';
    try {
      const body = await req.json();
      month = body?.month || 'last';
    } catch {
      // No body or invalid JSON, use default
    }

    const sheetName = month === 'current' ? 'Summary (Current Month)' : 'Summary (Last Month)';
    const rangeDollars = `${sheetName}!J2:K2`;
    const rangeEuros = `${sheetName}!J3:K3`;

    const apiKey = Deno.env.get('GOOGLE_SHEETS_API_KEY');
    
    if (!apiKey) {
      console.error('GOOGLE_SHEETS_API_KEY is not configured');
      return new Response(
        JSON.stringify({ error: 'API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const urlDollars = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${encodeURIComponent(rangeDollars)}?key=${apiKey}`;
    const urlEuros = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${encodeURIComponent(rangeEuros)}?key=${apiKey}`;
    
    console.log('Fetching from Google Sheets...');
    
    const [responseDollars, responseEuros] = await Promise.all([
      fetch(urlDollars),
      fetch(urlEuros)
    ]);
    
    if (!responseDollars.ok || !responseEuros.ok) {
      const errorText = !responseDollars.ok ? await responseDollars.text() : await responseEuros.text();
      console.error('Google Sheets API error:', errorText);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch from Google Sheets', details: errorText }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const [dataDollars, dataEuros] = await Promise.all([
      responseDollars.json(),
      responseEuros.json()
    ]);
    
    console.log('Google Sheets response dollars:', JSON.stringify(dataDollars));
    console.log('Google Sheets response euros:', JSON.stringify(dataEuros));
    
    // Parse the values - handle European format (7.186,20) and other formats
    const parseAmount = (value: string): number => {
      // Remove currency symbols and whitespace
      let cleaned = value.toString().replace(/[€$£\s]/g, '');
      
      // Check if it's European format (comma as decimal, period as thousands)
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
    
    // J2:K2 = dollars (J2 = Bo, K2 = Senne)
    const dollarValues = dataDollars.values?.[0] || [];
    const bowieDollars = parseAmount(dollarValues[0] || '0');
    const senneDollars = parseAmount(dollarValues[1] || '0');
    
    // J3:K3 = euros (J3 = Bo, K3 = Senne)
    const euroValues = dataEuros.values?.[0] || [];
    const bowieEuros = parseAmount(euroValues[0] || '0');
    const senneEuros = parseAmount(euroValues[1] || '0');
    
    console.log(`Parsed values - Bowie: $${bowieDollars} / €${bowieEuros}, Senne: $${senneDollars} / €${senneEuros}`);

    return new Response(
      JSON.stringify({ 
        bowieDollars, 
        senneDollars, 
        bowieEuros, 
        senneEuros 
      }),
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
