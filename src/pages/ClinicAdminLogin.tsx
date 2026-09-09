import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Building2, LogIn, ArrowLeft } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export default function ClinicAdminLogin() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { login, logout, user, loading } = useAuth();
  const [clinicId, setClinicId] = useState("");
  const [emailOrUser, setEmailOrUser] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && user) {
      if (user.role === 'CLINIC_ADMIN') {
        navigate('/admin/clinic/dashboard', { replace: true });
      }
    }
  }, [user, loading, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const loginIdentifier = emailOrUser.trim() || clinicId.trim();
      if (!loginIdentifier) {
        toast({ title: "Please enter Clinic ID or Email", variant: "destructive" });
        return;
      }
      await login(loginIdentifier, password);
      
      // Verify role after login attempt
      const stored = localStorage.getItem('auth');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed?.user?.role !== 'CLINIC_ADMIN') {
          logout();
          throw new Error('Access denied: This portal is for Clinic Admins only. Please use the Super Admin Login page.');
        }
      }
      toast({ title: "Welcome Clinic Admin!" });
      navigate('/admin/clinic/dashboard', { replace: true });
    } catch (err: any) {
      toast({ title: err.message || "Clinic Admin Login failed", variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{
        backgroundImage: "url('/DeWatermark.ai_1752809220809.jpeg')",
        backgroundSize: "cover", backgroundPosition: "center",
      }}
    >
      <div className="absolute inset-0 bg-background/80 backdrop-blur-md" />

      <div className="relative z-10 w-full max-w-sm px-4">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => navigate("/admin")}
          className="mb-4 gap-2 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Admin Portal
        </Button>

        <Card className="bg-card/90 backdrop-blur-sm shadow-xl border-2 border-primary/20">
          <CardHeader className="text-center pb-2">
            <div className="mx-auto w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center mb-3">
              <Building2 className="w-7 h-7 text-primary" />
            </div>
            <CardTitle className="text-2xl">Clinic Admin Login</CardTitle>
            <CardDescription>Clinic-specific queue management</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4" autoComplete="off">
              <div className="space-y-1">
                <Label htmlFor="clinic-id">Clinic ID (e.g. C025)</Label>
                <Input
                  id="clinic-id"
                  type="text"
                  value={clinicId}
                  onChange={e => setClinicId(e.target.value)}
                  placeholder="C025"
                  autoComplete="off"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="clinic-email">Email or Username</Label>
                <Input
                  id="clinic-email"
                  type="text"
                  value={emailOrUser}
                  onChange={e => setEmailOrUser(e.target.value)}
                  placeholder="san025@gmail.com"
                  autoComplete="off"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="clinic-password">Password</Label>
                <Input
                  id="clinic-password"
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Enter password"
                  required
                  autoComplete="current-password"
                />
              </div>

              <Button type="submit" className="w-full" variant="medical" disabled={busy}>
                <LogIn className="w-4 h-4 mr-2" />
                {busy ? "Authenticating..." : "Login as Clinic Admin"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
