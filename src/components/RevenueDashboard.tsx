import senneImage from "@/assets/senne-jackson.jpg";
import bowieImage from "@/assets/bowie.jpg";

interface ProfileCardProps {
  name: string;
  image: string;
  revenue: number;
  isLoading?: boolean;
}

const ProfileCard = ({ name, image, revenue, isLoading }: ProfileCardProps) => {
  const formattedRevenue = new Intl.NumberFormat('nl-NL', {
    style: 'currency',
    currency: 'EUR',
  }).format(revenue);

  return (
    <div className="flex flex-col items-center p-8 bg-card rounded-lg">
      <div className="w-24 h-24 rounded-full overflow-hidden mb-4 ring-2 ring-border">
        <img 
          src={image} 
          alt={name}
          className="w-full h-full object-cover"
        />
      </div>
      <h2 className="text-foreground font-bold text-xl mb-2">{name}</h2>
      {isLoading ? (
        <div className="h-10 w-32 bg-secondary animate-pulse rounded" />
      ) : (
        <p className="text-primary font-bold text-3xl">{formattedRevenue}</p>
      )}
    </div>
  );
};

interface RevenueData {
  senne: number;
  bowie: number;
}

interface RevenueDashboardProps {
  data?: RevenueData;
  isLoading?: boolean;
}

const RevenueDashboard = ({ data, isLoading = false }: RevenueDashboardProps) => {
  const senneRevenue = data?.senne ?? 8137.75;
  const bowieRevenue = data?.bowie ?? 57.48;

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-[800px]">
        <p className="text-muted-foreground text-sm text-center mb-6">
          Revenue Split - Last Month
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ProfileCard
            name="Senne Jackson"
            image={senneImage}
            revenue={senneRevenue}
            isLoading={isLoading}
          />
          <ProfileCard
            name="Bowie"
            image={bowieImage}
            revenue={bowieRevenue}
            isLoading={isLoading}
          />
        </div>
        
        <p className="text-muted-foreground/60 text-xs text-center mt-6">
          Updates on the 20th of each month
        </p>
      </div>
    </div>
  );
};

export default RevenueDashboard;
