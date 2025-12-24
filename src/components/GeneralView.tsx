import DailyRevenueChart from "@/components/DailyRevenueChart";

const GeneralView = () => {
  return (
    <div className="min-h-[calc(100vh-128px)] flex flex-col items-center px-6 py-12">
      <p className="text-muted-foreground text-xs uppercase tracking-[0.2em] mb-8">
        Overall Performance
      </p>
      
      <div className="w-full max-w-4xl">
        <DailyRevenueChart />
      </div>
    </div>
  );
};

export default GeneralView;
