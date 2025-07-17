import { useState } from "react";
import { TokenBooking } from "@/components/TokenBooking";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const AdminBooking = () => {
  const [currentNumber, setCurrentNumber] = useState(1);
  const [tokens, setTokens] = useState<any[]>([]);
  const [adminBookingKey, setAdminBookingKey] = useState(0);
  const navigate = useNavigate();

  const handleTokenIssued = (tokenData: any) => {
    setTokens(prev => [...prev, tokenData]);
    setAdminBookingKey(k => k + 1);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center py-8">
      <div className="w-full max-w-xl">
        <Button variant="outline" className="mb-6" onClick={() => navigate(-1)}>
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