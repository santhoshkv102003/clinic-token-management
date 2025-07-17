import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { QueueDisplay } from "@/components/QueueDisplay";

const ADMIN_LOGIN_KEY = 'adminLoggedIn';

const AdminPanel = () => {
  const navigate = useNavigate();
  // Local state for queue status (for demo, you may want to share this state across admin pages)
  const [currentNumber, setCurrentNumber] = useState(1);
  const [tokens, setTokens] = useState<any[]>([]);

  useEffect(() => {
    if (localStorage.getItem(ADMIN_LOGIN_KEY) !== 'true') {
      navigate('/');
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem(ADMIN_LOGIN_KEY);
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center py-8 relative">
      <div className="w-full max-w-3xl">
        {/* Logout Button */}
        <div className="flex justify-end mb-4">
          <Button variant="outline" onClick={handleLogout}>Logout</Button>
        </div>
        {/* Queue Status Dashboard */}
        <div className="mb-8">
          <QueueDisplay currentNumber={currentNumber} queueLength={tokens.length} recentTokens={tokens} />
        </div>
        <div className="flex flex-col gap-8">
          <div className="flex flex-col gap-4 mb-8">
            <Button
              variant="medical"
              className="w-full text-lg py-6"
              onClick={() => navigate('/admin/booking')}
            >
              Booking Patient
            </Button>
            <Button
              variant="medical"
              className="w-full text-lg py-6"
              onClick={() => navigate('/admin/call')}
            >
              Call Next Patient
            </Button>
            <Button
              variant="medical"
              className="w-full text-lg py-6"
              onClick={() => navigate('/admin/activity')}
            >
              Patient Activity
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPanel; 