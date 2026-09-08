import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { User, ShieldCheck, Stethoscope, ArrowRight } from "lucide-react";

export default function LandingPage() {
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
        <div className="space-y-3">
          <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center border-2 border-primary/20 shadow-inner">
            <Stethoscope className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">
            ClinicQueue Management System
          </h1>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            Welcome to Smart Token & Queue Management. Select your portal to continue.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
          {/* Patient Option */}
          <Card 
            className="group hover:border-primary/50 transition-all duration-300 shadow-lg hover:shadow-xl bg-card/90 backdrop-blur-sm cursor-pointer overflow-hidden border-2 border-border"
            onClick={() => navigate("/patient")}
          >
            <CardHeader className="text-center pb-2">
              <div className="mx-auto w-14 h-14 bg-emerald-500/10 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300">
                <User className="w-7 h-7 text-emerald-600 dark:text-emerald-400" />
              </div>
              <CardTitle className="text-2xl">Patient Portal</CardTitle>
              <CardDescription>
                Search clinics, view live queues, and book digital tokens
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              <Button className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors" variant="outline" size="lg">
                Enter Patient Portal
                <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </CardContent>
          </Card>

          {/* Admin Portal Option */}
          <Card 
            className="group hover:border-primary/50 transition-all duration-300 shadow-lg hover:shadow-xl bg-card/90 backdrop-blur-sm cursor-pointer overflow-hidden border-2 border-border"
            onClick={() => navigate("/admin")}
          >
            <CardHeader className="text-center pb-2">
              <div className="mx-auto w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300">
                <ShieldCheck className="w-7 h-7 text-primary" />
              </div>
              <CardTitle className="text-2xl">Admin Portal</CardTitle>
              <CardDescription>
                Super Admin and Clinic Admin management login
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              <Button className="w-full" variant="medical" size="lg">
                Enter Admin Portal
                <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
