import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Stethoscope, LogIn } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

// Unified login page for both SUPER_ADMIN and CLINIC_ADMIN
export default function AdminLogin() {
  const navigate  = useNavigate();
  const { toast } = useToast();
  const { login, user, loading } = useAuth();
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [busy,     setBusy]     = useState(false);

  // If already logged in, redirect
  useEffect(() => {
    if (!loading && user) {
      navigate(user.role === 'SUPER_ADMIN' ? '/admin/dashboard' : '/admin/clinic', { replace: true });
    }
  }, [user, loading]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      await login(email.trim(), password);
      // redirect handled by useEffect above
    } catch (err: any) {
      toast({ title: err.message || "Login failed", variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{
        backgroundImage: "url('/DeWatermark.ai_1752809220809.jpeg')",
        backgroundSize: "cover", backgroundPosition: "center",
      }}
    >
      <div className="w-full max-w-sm px-4">
        <Card className="bg-card/90 backdrop-blur-sm shadow-xl">
          <CardHeader className="text-center pb-2">
            <div className="mx-auto w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center mb-3">
              <Stethoscope className="w-7 h-7 text-primary" />
            </div>
            <CardTitle className="text-2xl">Admin Login</CardTitle>
            <p className="text-sm text-muted-foreground">ClinicQueue Management System</p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4" autoComplete="off">
              <div className="space-y-1">
                <Label htmlFor="email">Email or Clinic ID</Label>
                <Input
                  id="email"
                  type="text"
                  name="admin_login_email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="Enter mail id"
                  required
                  autoComplete="off"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  name="admin_login_password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Enter password"
                  required
                  autoComplete="new-password"
                />
              </div>

              <Button type="submit" className="w-full" variant="medical" disabled={busy}>
                <LogIn className="w-4 h-4 mr-2" />
                {busy ? "Logging in..." : "Login"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
