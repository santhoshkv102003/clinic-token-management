import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Home } from "lucide-react";

const AdminPanel = () => {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center py-8 relative">
      {/* Home Logo Custom Position */}
      <button
        style={{ left: '10cm', top: '3cm' }}
        className="absolute flex items-center justify-center hover:opacity-80 transition"
        onClick={() => navigate('/')}
        aria-label="Go to Home"
      >
        <Home className="w-10 h-10 text-primary" />
      </button>
      <div className="w-full max-w-xl">
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