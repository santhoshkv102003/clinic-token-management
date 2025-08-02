import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { QueueDisplay } from "@/components/QueueDisplay";
import { UpcomingPatientsList } from "@/components/UpcomingPatientsList";
import { useQueue } from "../QueueContext";
import { Home, Users } from "lucide-react";

const ADMIN_LOGIN_KEY = 'adminLoggedIn';

const AdminPanel = () => {
  const { currentNumber, tokens, nextNumber } = useQueue();
  const navigate = useNavigate();
  const [showUpcomingPatients, setShowUpcomingPatients] = useState(false);

  useEffect(() => {
    console.log('adminLoggedIn:', localStorage.getItem(ADMIN_LOGIN_KEY));
    if (localStorage.getItem(ADMIN_LOGIN_KEY) !== 'true') {
      navigate('/');
    }
  }, [navigate]);

  useEffect(() => {
    const handleTabClose = () => {
      localStorage.removeItem('adminLoggedIn');
    };
    window.addEventListener('beforeunload', handleTabClose);
    return () => {
      window.removeEventListener('beforeunload', handleTabClose);
    };
  }, []);

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
            className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-all duration-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2"
            aria-label="Go to Home"
          >
            <Home className="w-10 h-10" />
          </button>
          <Button variant="outline" onClick={handleLogout}>Logout</Button>
        </div>
        {/* Queue Status Dashboard */}
        <div className="mb-8">
          <QueueDisplay />
        </div>
        {!showUpcomingPatients ? (
          <div className="flex flex-col gap-8">
            <div className="flex gap-8 justify-center mb-8">
              {/* Left column: Three buttons in vertical line */}
              <div className="flex flex-col gap-4">
                <Button
                  className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md font-medium ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 bg-gradient-to-r from-primary to-primary-glow text-primary-foreground hover:shadow-lg hover:scale-105 transition-all duration-200 h-10 px-4 w-80 text-lg py-6"
                  onClick={() => navigate('/admin/booking')}
                >
                  Booking Patient
                </Button>
                <Button
                  variant="medical"
                  className="w-80 text-lg py-6"
                  onClick={() => navigate('/admin/activity')}
                >
                  Visited Patients
                </Button>
                <Button
                  className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md font-medium ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 bg-gradient-to-r from-primary to-primary-glow text-primary-foreground hover:shadow-lg hover:scale-105 transition-all duration-200 h-10 px-4 w-80 text-lg py-6"
                  onClick={() => {
                    console.log('Opening upcoming patients list');
                    setShowUpcomingPatients(true);
                  }}
                >
                  Upcoming Patients
                </Button>
              </div>
              {/* Right column: Call Next Patient button */}
              <div className="flex items-center">
                <Button
                  variant="destructive"
                  className="w-80 text-lg py-6 hover:shadow-lg hover:scale-105 transition-all duration-200"
                  onClick={nextNumber}
                >
                  Call Next Patient
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="w-full">
            <UpcomingPatientsList onBack={() => {
              console.log('Closing upcoming patients list');
              setShowUpcomingPatients(false);
            }} />
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPanel; 