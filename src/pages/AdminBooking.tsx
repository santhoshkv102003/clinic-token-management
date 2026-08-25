import { useEffect } from "react";
import { TokenBooking } from "@/components/TokenBooking";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

const AdminBooking = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const handleTabClose = () => localStorage.removeItem('adminLoggedIn');
    window.addEventListener('beforeunload', handleTabClose);
    return () => window.removeEventListener('beforeunload', handleTabClose);
  }, []);

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
          variant="outline"
          onClick={() => navigate('/admin/panel')}
        >
          <ArrowLeft className="w-4 h-4 mr-2" /> Back
        </Button>
        <TokenBooking onBooked={() => navigate('/admin/panel')} />
      </div>
    </div>
  );
};

export default AdminBooking;
