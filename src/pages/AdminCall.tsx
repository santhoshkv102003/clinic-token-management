import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const AdminCall = () => {
  const [currentNumber, setCurrentNumber] = useState(1);
  const [tokens, setTokens] = useState<any[]>([]);
  const navigate = useNavigate();

  const handleNextNumber = () => {
    setCurrentNumber(prev => prev + 1);
  };

  const handleResetQueue = () => {
    setCurrentNumber(1);
    setTokens([]);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center py-8">
      <div className="w-full max-w-xl">
        <Button variant="outline" className="mb-6" onClick={() => navigate('/admin')}>
          ← Back to Admin Panel
        </Button>
        <div className="bg-card rounded-lg border p-6 flex flex-col items-center justify-center">
          <div className="text-3xl font-bold text-primary mb-2">{currentNumber - 1}</div>
          <div className="text-sm text-muted-foreground mb-4">Current Number</div>
          <Button 
            onClick={handleNextNumber}
            variant="medical"
            size="lg"
            className="w-full mb-2"
            disabled={tokens.filter(token => token.tokenNumber >= currentNumber).length === 0}
          >
            Call Next Patient
          </Button>
          <Button 
            onClick={handleResetQueue}
            variant="outline"
            size="lg"
            className="w-full"
          >
            Reset Queue
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AdminCall; 