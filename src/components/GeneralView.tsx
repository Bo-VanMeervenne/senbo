import DailyRevenueChart from "@/components/DailyRevenueChart";
import TrafficSourceChart from "@/components/TrafficSourceChart";
import CountryRevenueTable from "@/components/CountryRevenueTable";
import DeviceViewsChart from "@/components/DeviceViewsChart";
import SubscriberStatsCards from "@/components/SubscriberStatsCards";
import LiveSubscriberCount from "@/components/LiveSubscriberCount";

const getDaysUntilPayday = () => {
  const today = new Date();
  const currentDay = today.getDate();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();

  let payday: Date;
  if (currentDay >= 22) {
    payday = new Date(currentYear, currentMonth + 1, 22);
  } else {
    payday = new Date(currentYear, currentMonth, 22);
  }

  const diffTime = payday.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
};

const GeneralView = () => {
  const daysUntilPayday = getDaysUntilPayday();

  return (
    <div className="min-h-[calc(100vh-128px)] flex flex-col items-center px-6 py-12">
      {/* Welcome Header with Subscriber Count and Payday */}
      <div className="w-full max-w-4xl mb-10 animate-fade-in">
        <LiveSubscriberCount daysUntilPayday={daysUntilPayday} />
      </div>

      <div className="w-full max-w-4xl space-y-6">
        <DailyRevenueChart />

        <CountryRevenueTable />

        <TrafficSourceChart />

        <SubscriberStatsCards />

        <DeviceViewsChart />
      </div>
    </div>
  );
};

export default GeneralView;
