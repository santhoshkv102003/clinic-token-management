import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { QueueDisplay } from "@/components/QueueDisplay";
import { useQueue } from "../QueueContext";
import { Home } from "lucide-react";

const ADMIN_LOGIN_KEY = 'adminLoggedIn';

const AdminPanel = () => {
  const { currentNumber, tokens, nextNumber } = useQueue();
  const navigate = useNavigate();

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
    <div
      className="min-h-screen bg-background flex flex-col items-center justify-center py-8 relative"
      style={{
        backgroundImage: "url('/DeWatermark.ai_1752809220809.jpeg')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat"
      }}
    >
      <div className="w-full max-w-3xl">
        {/* Logout Button */}
        <div className="flex justify-end items-center gap-2 mb-4">
          <button
            onClick={() => navigate("/")}
            className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2 z-10"
            aria-label="Go to Home"
            style={{ border: "none", background: "none", cursor: "pointer" }}
          >
            <Home className="w-8 h-8 text-white" />
          </button>
          <Button variant="outline" onClick={handleLogout}>Logout</Button>
        </div>
        {/* Queue Status Dashboard */}
        <div className="mb-8">
          <QueueDisplay currentNumber={currentNumber} queueLength={tokens.length} recentTokens={tokens} />
        </div>
        <div className="flex flex-col gap-8">
          <div className="flex flex-col gap-4 mb-8">
            <Button
              className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md font-medium ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 bg-gradient-to-r from-primary to-primary-glow text-primary-foreground hover:shadow-lg hover:scale-105 transition-all duration-200 h-10 px-4 w-80 mx-auto text-lg py-6"
              onClick={() => navigate('/admin/booking')}
            >
              Booking Patient
            </Button>
            <Button
              variant="medical"
              className="w-80 mx-auto text-lg py-6"
              onClick={nextNumber}
            >
              Call Next Patient
            </Button>
            <Button
              variant="medical"
              className="w-80 mx-auto text-lg py-6"
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