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

    // Fetch Daily Revenue data
    const dailyRevenueRange = 'Daily Revenue!A:C';
    const dailyRevenueUrl = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${encodeURIComponent(dailyRevenueRange)}?key=${apiKey}`;
    
    // Fetch Current Month video data (columns G=Split 50%, I=Publish Date)
    const currentMonthRange = 'Senne & Bo Videos (Current Month)!G:I';
    const currentMonthUrl = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${encodeURIComponent(currentMonthRange)}?key=${apiKey}`;
    
    // Fetch Last Month video data
    const lastMonthRange = 'Senne & Bo Videos (Last Month)!G:I';
    const lastMonthUrl = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${encodeURIComponent(lastMonthRange)}?key=${apiKey}`;

    console.log('Fetching revenue split timeline data...');

    const [dailyResponse, currentMonthResponse, lastMonthResponse] = await Promise.all([
      fetch(dailyRevenueUrl),
      fetch(currentMonthUrl),
      fetch(lastMonthUrl)
    ]);

    if (!dailyResponse.ok || !currentMonthResponse.ok || !lastMonthResponse.ok) {
      console.error('Google Sheets API error');
      return new Response(
        JSON.stringify({ error: 'Failed to fetch from Google Sheets' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const [dailyData, currentMonthData, lastMonthData] = await Promise.all([
      dailyResponse.json(),
      currentMonthResponse.json(),
      lastMonthResponse.json()
    ]);

    // Parse amount helper
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

    const pad2 = (n: number) => String(n).padStart(2, '0');

    // Parse date helper - returns YYYY-MM-DD format (timezone-safe)
    const parseDate = (value: string): string | null => {
      if (!value) return null;

      // Remove time portion if present (e.g., "23/12/2025, 1:34" -> "23/12/2025")
      const dateStr = value.split(',')[0].trim();

      // If already ISO-like (YYYY-MM-DD), keep it (timezone-safe)
      if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;

      // Try DD/MM/YYYY (or DD-MM-YYYY, DD.MM.YYYY)
      const parts = dateStr.split(/[\/\-\.]/);
      if (parts.length === 3) {
        const [dayStr, monthStr, yearStr] = parts;
        const day = parseInt(dayStr, 10);
        const month = parseInt(monthStr, 10);
        const year = parseInt(yearStr, 10);
        if (!Number.isNaN(day) && !Number.isNaN(month) && !Number.isNaN(year)) {
          return `${year}-${pad2(month)}-${pad2(day)}`;
        }
      }

      // Fallback: attempt Date parse but format using local date parts to avoid off-by-one
      const d = new Date(dateStr);
      if (!Number.isNaN(d.getTime())) {
        return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
      }

      return null;
    };

    // Parse Daily Revenue - create a map of date -> total revenue
    const dailyRows = dailyData.values?.slice(1) || [];
    const dailyRevenueMap: Record<string, number> = {};
    
    for (const row of dailyRows) {
      const date = parseDate(row[0]);
      if (date) {
        dailyRevenueMap[date] = parseAmount(row[1]);
      }
    }

    // Parse video data - create a map of date -> Bo's split sum
    // Columns: G=Split (50%), H=something, I=Publish Date
    // But we're fetching G:I so: [0]=Split, [1]=H, [2]=Publish Date
    const boSplitMap: Record<string, number> = {};
    
    const processVideoRows = (rows: string[][]) => {
      for (const row of rows) {
        const split = parseAmount(row[0]); // Column G - Split (50%)
        const publishDate = parseDate(row[2]); // Column I - Publish Date
        
        if (publishDate && split > 0) {
          boSplitMap[publishDate] = (boSplitMap[publishDate] || 0) + split;
        }
      }
    };

    const currentMonthRows = currentMonthData.values?.slice(1) || [];
    const lastMonthRows = lastMonthData.values?.slice(1) || [];
    
    processVideoRows(currentMonthRows);
    processVideoRows(lastMonthRows);

    console.log('Daily revenue dates:', Object.keys(dailyRevenueMap).length);
    console.log('Bo split dates:', Object.keys(boSplitMap).length);
    console.log('Union dates:', new Set([...Object.keys(dailyRevenueMap), ...Object.keys(boSplitMap)]).size);

    // Build timeline data on the UNION of dates (daily revenue can lag 2-3 days)
    // This ensures Bo totals still include the latest video days even if Total Revenue is missing.
    const allDates = new Set<string>([
      ...Object.keys(dailyRevenueMap),
      ...Object.keys(boSplitMap),
    ]);

    const timelineData: { date: string; senneRevenue: number | null; boRevenue: number; totalRevenue: number | null }[] = [];

    for (const date of allDates) {
      const totalRevenue = Object.prototype.hasOwnProperty.call(dailyRevenueMap, date)
        ? dailyRevenueMap[date]
        : null;

      const boRevenue = boSplitMap[date] || 0;
      const senneRevenue = totalRevenue === null ? null : Math.max(0, totalRevenue - boRevenue);

      timelineData.push({
        date,
        totalRevenue,
        senneRevenue,
        boRevenue,
      });
    }

    // Sort by date
    timelineData.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    console.log(`Returning ${timelineData.length} timeline entries`);

    return new Response(
      JSON.stringify({ data: timelineData }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in get-revenue-split-timeline function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
