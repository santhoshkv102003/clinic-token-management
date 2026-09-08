import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Crown, Building2, ArrowLeft, ArrowRight, ShieldCheck } from "lucide-react";

export default function AdminPortalLanding() {
  const navigate = useNavigate();

  return (
    <div 
      className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background via-background/95 to-primary/5"
      style={{
        backgroundImage: "url('/DeWatermark.ai_1752809220809.jpeg')",
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <div className="absolute inset-0 bg-background/80 backdrop-blur-md" />

      <div className="relative z-10 w-full max-w-4xl space-y-8 text-center px-4">
        <div className="flex justify-start max-w-2xl mx-auto">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => navigate("/")}
            className="gap-2 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Home
          </Button>
        </div>

        <div className="space-y-3">
          <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center border-2 border-primary/20 shadow-inner">
            <ShieldCheck className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">
            Admin Portal Access
          </h1>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            Select your administrative role to proceed to authentication.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
          {/* Super Admin Option */}
          <Card 
            className="group hover:border-primary/50 transition-all duration-300 shadow-lg hover:shadow-xl bg-card/90 backdrop-blur-sm cursor-pointer overflow-hidden border-2 border-border"
            onClick={() => navigate("/admin/super/login")}
          >
            <CardHeader className="text-center pb-2">
              <div className="mx-auto w-14 h-14 bg-amber-500/10 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300">
                <Crown className="w-7 h-7 text-amber-600 dark:text-amber-400" />
              </div>
              <CardTitle className="text-2xl">Super Admin</CardTitle>
              <CardDescription>
                System-wide management, clinic creation, and overall stats
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              <Button className="w-full" variant="outline" size="lg">
                Super Admin Login
                <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </CardContent>
          </Card>

          {/* Clinic Admin Option */}
          <Card 
            className="group hover:border-primary/50 transition-all duration-300 shadow-lg hover:shadow-xl bg-card/90 backdrop-blur-sm cursor-pointer overflow-hidden border-2 border-border"
            onClick={() => navigate("/admin/clinic/login")}
          >
            <CardHeader className="text-center pb-2">
              <div className="mx-auto w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300">
                <Building2 className="w-7 h-7 text-primary" />
              </div>
              <CardTitle className="text-2xl">Clinic Admin</CardTitle>
              <CardDescription>
                Manage your specific clinic queue, next patient, and status
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              <Button className="w-full" variant="medical" size="lg">
                Clinic Admin Login
                <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
