import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

// AdminCall is now handled per-clinic from AdminPanel.
// This page redirects back to the panel.
const AdminCall = () => {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background">
      <div className="text-center p-8 bg-card rounded-xl border max-w-sm">
        <p className="text-muted-foreground mb-4">
          Queue management is now handled per-clinic in the Admin Dashboard.
        </p>
        <Button variant="medical" onClick={() => navigate("/admin/panel")}>
          <ArrowLeft className="w-4 h-4 mr-2" /> Go to Admin Dashboard
        </Button>
      </div>
    </div>
  );
};

export default AdminCall;
