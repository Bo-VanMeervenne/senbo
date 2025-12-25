import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Globe, ChevronRight, Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

interface CountryData {
  country: string;
  revenue: number;
  views: number;
  rpm: number;
}

// Country code to flag emoji mapping
const countryFlags: Record<string, string> = {
  'US': '🇺🇸', 'GB': '🇬🇧', 'CA': '🇨🇦', 'AU': '🇦🇺', 'DE': '🇩🇪',
  'FR': '🇫🇷', 'NL': '🇳🇱', 'BE': '🇧🇪', 'IT': '🇮🇹', 'ES': '🇪🇸',
  'BR': '🇧🇷', 'MX': '🇲🇽', 'IN': '🇮🇳', 'JP': '🇯🇵', 'KR': '🇰🇷',
  'CN': '🇨🇳', 'RU': '🇷🇺', 'PL': '🇵🇱', 'SE': '🇸🇪', 'NO': '🇳🇴',
  'DK': '🇩🇰', 'FI': '🇫🇮', 'AT': '🇦🇹', 'CH': '🇨🇭', 'IE': '🇮🇪',
  'NZ': '🇳🇿', 'SG': '🇸🇬', 'HK': '🇭🇰', 'TW': '🇹🇼', 'TH': '🇹🇭',
  'MY': '🇲🇾', 'PH': '🇵🇭', 'ID': '🇮🇩', 'VN': '🇻🇳', 'ZA': '🇿🇦',
  'NG': '🇳🇬', 'EG': '🇪🇬', 'SA': '🇸🇦', 'AE': '🇦🇪', 'IL': '🇮🇱',
  'TR': '🇹🇷', 'GR': '🇬🇷', 'PT': '🇵🇹', 'CZ': '🇨🇿', 'HU': '🇭🇺',
  'RO': '🇷🇴', 'UA': '🇺🇦', 'AR': '🇦🇷', 'CL': '🇨🇱', 'CO': '🇨🇴',
  'PE': '🇵🇪', 'PK': '🇵🇰', 'BD': '🇧🇩', 'LK': '🇱🇰', 'NP': '🇳🇵',
};

const formatViews = (views: number): string => {
  if (views >= 1000000) {
    return `${(views / 1000000).toFixed(1)}M`;
  }
  if (views >= 1000) {
    return `${(views / 1000).toFixed(1)}K`;
  }
  return views.toLocaleString();
};

interface CountryTableContentProps {
  data: CountryData[];
  showAll?: boolean;
}

const CountryTableContent = ({ data, showAll = false }: CountryTableContentProps) => {
  const displayData = showAll ? data : data.slice(0, 10);
  
  return (
    <Table>
      <TableHeader>
        <TableRow className="border-border/30">
          <TableHead className="text-muted-foreground w-10">#</TableHead>
          <TableHead className="text-muted-foreground">Country</TableHead>
          <TableHead className="text-muted-foreground text-right">Revenue</TableHead>
          <TableHead className="text-muted-foreground text-right">Views</TableHead>
          <TableHead className="text-muted-foreground text-right">RPM</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {displayData.map((item, index) => {
          const flag = countryFlags[item.country] || '🌍';
          
          return (
            <TableRow 
              key={item.country} 
              className="border-border/20 hover:bg-secondary/20 transition-colors"
            >
              <TableCell className="text-muted-foreground text-sm">
                {index + 1}
              </TableCell>
              <TableCell className="font-medium">
                <span className="mr-2">{flag}</span>
                {item.country}
              </TableCell>
              <TableCell className="text-right text-primary font-medium">
                ${item.revenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </TableCell>
              <TableCell className="text-right text-muted-foreground">
                {formatViews(item.views)}
              </TableCell>
              <TableCell className="text-right text-muted-foreground">
                ${item.rpm.toFixed(2)}
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
};

const CountryRevenueTable = () => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['country-revenue'],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('get-country-revenue');
      if (error) throw error;
      return data.countryData as CountryData[];
    },
  });

  if (isLoading) {
    return (
      <div className="w-full bg-card/50 backdrop-blur-sm border border-border/30 rounded-2xl p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-secondary/50 rounded w-1/3" />
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-10 bg-secondary/30 rounded" />
          ))}
        </div>
      </div>
    );
  }

  if (error || !data?.length) {
    return null;
  }

  const hasMore = data.length > 10;

  return (
    <div className="w-full bg-card/50 backdrop-blur-sm border border-border/30 rounded-2xl p-6">
      <div className="flex items-center gap-2 mb-6">
        <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
          <Globe className="w-5 h-5 text-primary" />
          Revenue by Country
        </h3>
        <Tooltip>
          <TooltipTrigger asChild>
            <Info className="w-3.5 h-3.5 text-muted-foreground/50 cursor-help" />
          </TooltipTrigger>
          <TooltipContent side="right" className="max-w-[200px] text-xs">
            Revenue data delayed 3-5 days. All-time aggregated data.
          </TooltipContent>
        </Tooltip>
      </div>
      
      <div className="overflow-x-auto">
        <CountryTableContent data={data} />
      </div>
      
      {hasMore && (
        <Dialog>
          <DialogTrigger asChild>
            <button className="mt-4 w-full flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors py-2 rounded-lg hover:bg-secondary/20">
              View all {data.length} countries <ChevronRight className="w-4 h-4" />
            </button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl bg-card border-border">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Globe className="w-5 h-5 text-primary" />
                Revenue by Country
              </DialogTitle>
            </DialogHeader>
            <ScrollArea className="max-h-[60vh]">
              <CountryTableContent data={data} showAll />
            </ScrollArea>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default CountryRevenueTable;
