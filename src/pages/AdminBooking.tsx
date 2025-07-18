import { useState, useEffect } from "react";
import { TokenBooking } from "@/components/TokenBooking";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const AdminBooking = () => {
  const [currentNumber, setCurrentNumber] = useState(1);
  const [tokens, setTokens] = useState<any[]>([]);
  const [adminBookingKey, setAdminBookingKey] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    const handleTabClose = () => {
      localStorage.removeItem('adminLoggedIn');
    };
    window.addEventListener('beforeunload', handleTabClose);
    return () => {
      window.removeEventListener('beforeunload', handleTabClose);
    };
  }, []);

  const handleTokenIssued = (tokenData: any) => {
    setTokens(prev => [...prev, tokenData]);
    setAdminBookingKey(k => k + 1);
  };

  return (
    <div
      className="min-h-screen bg-background flex flex-col items-center justify-center py-8"
      style={{
        backgroundImage: "url('/DeWatermark.ai_1752809220809.jpeg')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat"
      }}
    >
      <div className="w-full max-w-xl">
        <Button
          className="mb-6 p-6 bg-card/50 backdrop-blur-sm rounded-xl border-2 border-primary/20"
          onClick={() => navigate(-1)}
        >
          ← Back
        </Button>
        <TokenBooking
          key={adminBookingKey}
          onTokenIssued={handleTokenIssued}
          currentNumber={currentNumber}
          queueLength={tokens.length}
        />
      </div>
    </div>
  );
};

export default AdminBooking; 