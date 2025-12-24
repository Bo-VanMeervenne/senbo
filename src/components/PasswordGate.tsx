import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Lock } from "lucide-react";

interface PasswordGateProps {
  onSuccess: () => void;
}

const PasswordGate = ({ onSuccess }: PasswordGateProps) => {
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password.toLowerCase() === "journey") {
      localStorage.setItem("dashboard-auth", "true");
      onSuccess();
    } else {
      setError(true);
      setTimeout(() => setError(false), 1500);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 mb-4">
            <Lock className="w-5 h-5 text-primary" />
          </div>
          <h1 className="text-xl font-medium text-foreground">Enter Access Code</h1>
          <p className="text-sm text-muted-foreground mt-2">This dashboard is password protected</p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            type="password"
            placeholder="Enter code..."
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={`text-center transition-all duration-200 ${
              error ? "border-destructive ring-destructive/20 ring-2" : ""
            }`}
            autoFocus
          />
          <Button type="submit" className="w-full">
            Unlock
          </Button>
        </form>
        
        {error && (
          <p className="text-center text-sm text-destructive mt-4 animate-pulse">
            Incorrect code
          </p>
        )}
      </div>
    </div>
  );
};

export default PasswordGate;
