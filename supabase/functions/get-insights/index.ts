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

    // Fetch from Summary sheets for insights
    // Current month summary for: total views (C2), subs gained (D2), revenue (H2+I2)
    const currentRange = 'Summary (Current Month)!C2:I2';
    const lastMonthRange = 'Summary (Last Month)!C2:I2';
    
    const urlCurrent = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${encodeURIComponent(currentRange)}?key=${apiKey}`;
    const urlLast = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${encodeURIComponent(lastMonthRange)}?key=${apiKey}`;
    
    console.log('Fetching insights data...');
    
    const [responseCurrent, responseLast] = await Promise.all([
      fetch(urlCurrent),
      fetch(urlLast)
    ]);
    
    if (!responseCurrent.ok || !responseLast.ok) {
      const errorText = !responseCurrent.ok ? await responseCurrent.text() : await responseLast.text();
      console.error('Google Sheets API error:', errorText);
      throw new Error('Failed to fetch from Google Sheets');
    }

    const [dataCurrent, dataLast] = await Promise.all([
      responseCurrent.json(),
      responseLast.json()
    ]);
    
    console.log('Current month data:', JSON.stringify(dataCurrent));
    console.log('Last month data:', JSON.stringify(dataLast));
    
    const parseNumber = (value: string): number => {
      if (!value) return 0;
      let cleaned = value.toString().replace(/[€$£\s]/g, '');
      // Handle European format
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
    
    // C2 = Views, D2 = Subs, E2 = Watch Time, F2 = ?, G2 = ?, H2 = Bo$, I2 = Senne$
    const currentValues = dataCurrent.values?.[0] || [];
    const lastValues = dataLast.values?.[0] || [];
    
    const currentViews = parseNumber(currentValues[0] || '0');
    const currentSubs = parseNumber(currentValues[1] || '0');
    const currentWatchTime = parseNumber(currentValues[2] || '0');
    const currentRevenueBo = parseNumber(currentValues[5] || '0');
    const currentRevenueSenne = parseNumber(currentValues[6] || '0');
    const currentTotalRevenue = currentRevenueBo + currentRevenueSenne;
    
    const lastViews = parseNumber(lastValues[0] || '0');
    const lastSubs = parseNumber(lastValues[1] || '0');
    const lastWatchTime = parseNumber(lastValues[2] || '0');
    const lastRevenueBo = parseNumber(lastValues[5] || '0');
    const lastRevenueSenne = parseNumber(lastValues[6] || '0');
    const lastTotalRevenue = lastRevenueBo + lastRevenueSenne;
    
    console.log(`Insights - Current: views=${currentViews}, subs=${currentSubs}, revenue=$${currentTotalRevenue}`);
    console.log(`Insights - Last: views=${lastViews}, subs=${lastSubs}, revenue=$${lastTotalRevenue}`);

    return new Response(
      JSON.stringify({ 
        currentMonth: {
          views: currentViews,
          subs: currentSubs,
          watchTime: currentWatchTime,
          revenue: currentTotalRevenue
        },
        lastMonth: {
          views: lastViews,
          subs: lastSubs,
          watchTime: lastWatchTime,
          revenue: lastTotalRevenue
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in get-insights function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
