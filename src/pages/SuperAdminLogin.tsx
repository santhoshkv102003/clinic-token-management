import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Crown, LogIn, ArrowLeft } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export default function SuperAdminLogin() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { login, logout, user, loading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && user) {
      if (user.role === 'SUPER_ADMIN') {
        navigate('/admin/super/dashboard', { replace: true });
      }
    }
  }, [user, loading, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      await login(email.trim(), password);
      // Verify role after login attempt
      const stored = localStorage.getItem('auth');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed?.user?.role !== 'SUPER_ADMIN') {
          logout();
          throw new Error('Access denied: This portal is for Super Admins only. Please use the Clinic Admin Login page.');
        }
      }
      toast({ title: "Welcome Super Admin!" });
      navigate('/admin/super/dashboard', { replace: true });
    } catch (err: any) {
      toast({ title: err.message || "Super Admin Login failed", variant: "destructive" });
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

        <Card className="bg-card/90 backdrop-blur-sm shadow-xl border-2 border-amber-500/20">
          <CardHeader className="text-center pb-2">
            <div className="mx-auto w-14 h-14 bg-amber-500/10 rounded-full flex items-center justify-center mb-3">
              <Crown className="w-7 h-7 text-amber-600 dark:text-amber-400" />
            </div>
            <CardTitle className="text-2xl">Super Admin Login</CardTitle>
            <CardDescription>Full system administration access</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4" autoComplete="off">
              <div className="space-y-1">
                <Label htmlFor="super-email">Super Admin Email</Label>
                <Input
                  id="super-email"
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="superadmin@clinic.com"
                  required
                  autoComplete="off"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="super-password">Password</Label>
                <Input
                  id="super-password"
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
                {busy ? "Authenticating..." : "Login as Super Admin"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
