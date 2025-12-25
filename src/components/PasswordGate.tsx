import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Input } from "@/components/ui/input";

interface PasswordGateProps {
  onSuccess: () => void;
}

const PasswordGate = ({ onSuccess }: PasswordGateProps) => {
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);
  const [isUnlocking, setIsUnlocking] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password.toLowerCase() === "journey") {
      setIsUnlocking(true);
      // Wait for door animation to complete before showing dashboard
      setTimeout(() => {
        localStorage.setItem("dashboard-auth", "true");
        onSuccess();
      }, 1500);
    } else {
      setError(true);
      setTimeout(() => setError(false), 1500);
    }
  };

  return (
    <div className="fixed inset-0 min-h-screen min-h-dvh bg-background overflow-hidden">
      {/* Background glow effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[150px]" />
        <div className="absolute top-1/4 left-1/4 w-[300px] h-[300px] bg-primary/3 rounded-full blur-[100px] animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-primary/3 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      {/* Animated doors */}
      <AnimatePresence>
        {!isUnlocking ? (
          <>
            {/* Left Door */}
            <motion.div
              initial={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ duration: 1.2, ease: [0.76, 0, 0.24, 1] }}
              className="absolute inset-y-0 left-0 w-1/2 bg-gradient-to-r from-background via-background to-card border-r border-primary/10 z-20"
            >
              {/* Door texture/pattern */}
              <div className="absolute inset-0 opacity-5">
                {[...Array(20)].map((_, i) => (
                  <div
                    key={i}
                    className="absolute h-px bg-gradient-to-r from-transparent via-primary to-transparent"
                    style={{ top: `${(i + 1) * 5}%`, width: '100%' }}
                  />
                ))}
              </div>
              {/* Door edge highlight */}
              <div className="absolute right-0 inset-y-0 w-px bg-gradient-to-b from-transparent via-primary/30 to-transparent" />
              <div className="absolute right-1 inset-y-0 w-px bg-gradient-to-b from-transparent via-primary/10 to-transparent" />
            </motion.div>

            {/* Right Door */}
            <motion.div
              initial={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ duration: 1.2, ease: [0.76, 0, 0.24, 1] }}
              className="absolute inset-y-0 right-0 w-1/2 bg-gradient-to-l from-background via-background to-card border-l border-primary/10 z-20"
            >
              {/* Door texture/pattern */}
              <div className="absolute inset-0 opacity-5">
                {[...Array(20)].map((_, i) => (
                  <div
                    key={i}
                    className="absolute h-px bg-gradient-to-l from-transparent via-primary to-transparent"
                    style={{ top: `${(i + 1) * 5}%`, width: '100%' }}
                  />
                ))}
              </div>
              {/* Door edge highlight */}
              <div className="absolute left-0 inset-y-0 w-px bg-gradient-to-b from-transparent via-primary/30 to-transparent" />
              <div className="absolute left-1 inset-y-0 w-px bg-gradient-to-b from-transparent via-primary/10 to-transparent" />
            </motion.div>
          </>
        ) : null}
      </AnimatePresence>

      {/* Center content - Lock/Form */}
      <AnimatePresence>
        {!isUnlocking && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.1 }}
            transition={{ duration: 0.4 }}
            className="absolute inset-0 flex items-center justify-center z-30 p-4"
          >
            <div className="w-full max-w-sm">
              {/* Lock Icon */}
              <motion.div 
                className="flex justify-center mb-8"
                animate={error ? { x: [-10, 10, -10, 10, 0] } : {}}
                transition={{ duration: 0.4 }}
              >
                <div className="relative">
                  {/* Outer glow ring */}
                  <motion.div
                    className="absolute -inset-4 rounded-full bg-primary/20 blur-xl"
                    animate={{ 
                      scale: [1, 1.2, 1],
                      opacity: [0.3, 0.5, 0.3]
                    }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                  
                  {/* Lock body */}
                  <div className={`relative w-16 h-14 rounded-lg border-2 transition-colors duration-300 ${
                    error ? 'border-destructive bg-destructive/10' : 'border-primary/50 bg-primary/5'
                  }`}>
                    {/* Lock shackle */}
                    <div className={`absolute -top-5 left-1/2 -translate-x-1/2 w-8 h-6 border-2 border-b-0 rounded-t-full transition-colors duration-300 ${
                      error ? 'border-destructive' : 'border-primary/50'
                    }`} />
                    
                    {/* Keyhole */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                      <motion.div 
                        className={`w-2 h-2 rounded-full transition-colors duration-300 ${
                          error ? 'bg-destructive' : 'bg-primary'
                        }`}
                        animate={{ 
                          boxShadow: error 
                            ? ['0 0 10px hsl(var(--destructive))', '0 0 20px hsl(var(--destructive))', '0 0 10px hsl(var(--destructive))']
                            : ['0 0 10px hsl(var(--primary))', '0 0 20px hsl(var(--primary))', '0 0 10px hsl(var(--primary))']
                        }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                      />
                      <div className={`w-1 h-3 mx-auto mt-0.5 rounded-b transition-colors duration-300 ${
                        error ? 'bg-destructive' : 'bg-primary'
                      }`} />
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Title */}
              <div className="text-center mb-8">
                <h1 className="font-display text-3xl tracking-wider text-foreground mb-2">
                  RESTRICTED ACCESS
                </h1>
                <p className="text-sm text-muted-foreground tracking-wide">
                  Enter the code to proceed
                </p>
              </div>
              
              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="relative">
                  <Input
                    type="password"
                    placeholder="• • • • • • •"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={`text-center text-lg tracking-[0.5em] h-14 bg-card/50 border-2 transition-all duration-300 placeholder:tracking-[0.3em] ${
                      error 
                        ? "border-destructive ring-destructive/20 ring-4" 
                        : "border-border/50 focus:border-primary/50 focus:ring-primary/10 focus:ring-4"
                    }`}
                    autoFocus
                  />
                  
                  {/* Input glow effect */}
                  <div className="absolute inset-0 -z-10 bg-primary/5 blur-xl rounded-lg opacity-0 transition-opacity duration-300 group-focus-within:opacity-100" />
                </div>
                
                <motion.button 
                  type="submit"
                  className="w-full h-12 bg-primary/10 border border-primary/30 rounded-lg text-primary font-display text-lg tracking-wider hover:bg-primary/20 hover:border-primary/50 transition-all duration-300 relative overflow-hidden group"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <span className="relative z-10">UNLOCK</span>
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700"
                  />
                </motion.button>
              </form>
              
              {/* Error message */}
              <AnimatePresence>
                {error && (
                  <motion.p
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="text-center text-sm text-destructive mt-6 font-medium"
                  >
                    Access Denied
                  </motion.p>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Reveal light burst on unlock */}
      <AnimatePresence>
        {isUnlocking && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 1, 0] }}
            transition={{ duration: 1.5, times: [0, 0.3, 1] }}
            className="absolute inset-0 z-10 flex items-center justify-center"
          >
            <div className="w-1 h-screen bg-gradient-to-b from-transparent via-primary to-transparent blur-sm" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PasswordGate;
