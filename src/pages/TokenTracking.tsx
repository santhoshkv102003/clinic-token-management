import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Ticket, Clock, User, Building2, Stethoscope, ArrowLeft, RefreshCw, Bell } from "lucide-react";
import { fetchTokenDetails } from "@/services/api";
import { joinClinicRoom, leaveClinicRoom, onQueueUpdate } from "@/services/socket";

export default function TokenTracking() {
  const { tokenId } = useParams<{ tokenId: string }>();
  const [searchParams] = useSearchParams();
  const clinicIdParam = searchParams.get("clinicId") || undefined;
  const navigate = useNavigate();
  const { toast } = useToast();

  const [details, setDetails] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [prevStatus, setPrevStatus] = useState<string | null>(null);

  const loadDetails = useCallback(async () => {
    if (!tokenId) return;
    try {
      const data = await fetchTokenDetails(tokenId, clinicIdParam);
      setDetails(data);
      
      // Request browser notification permissions if available
      if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "default") {
        Notification.requestPermission();
      }

      // Trigger notification if status changed to serving
      const currentStatus = (data?.token?.status || '').toLowerCase();
      if (prevStatus && prevStatus !== currentStatus) {
        if (currentStatus === 'serving') {
          toast({
            title: "📢 YOUR TOKEN IS CALLED!",
            description: `Token #${data.token.tokenNumber} is now being served in ${data.token.department}.`,
          });
          if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
            new Notification("📢 Your Token is Called!", {
              body: `Token #${data.token.tokenNumber} is now being called in ${data.token.department} at ${data.clinicName}.`,
            });
          }
        }
      }
      setPrevStatus(currentStatus);
    } catch (e: any) {
      toast({ title: "Failed to load token status", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [tokenId, prevStatus, toast]);

  useEffect(() => {
    loadDetails();
  }, [tokenId]);

  useEffect(() => {
    if (details?.token?.clinicId) {
      const cid = details.token.clinicId;
      joinClinicRoom(cid);
      const unsub = onQueueUpdate(() => {
        loadDetails();
      });
      return () => {
        unsub();
        leaveClinicRoom(cid);
      };
    }
  }, [details?.token?.clinicId, loadDetails]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-background">
        <div className="text-center space-y-3">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">Loading token details...</p>
        </div>
      </div>
    );
  }

  if (!details || !details.token) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-background">
        <Card className="max-w-md w-full text-center p-6 space-y-4">
          <CardTitle>Token Not Found</CardTitle>
          <CardDescription>The requested token tracking ID does not exist.</CardDescription>
          <Button variant="outline" onClick={() => navigate("/patient")}>
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Patient Portal
          </Button>
        </Card>
      </div>
    );
  }

  const { token, clinicName, doctorName, servingToken, patientsAhead, estimatedWaitMinutes } = details;
  const statusLower = (token.status || 'waiting').toLowerCase();

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'serving':
        return <Badge className="bg-emerald-500 hover:bg-emerald-600 text-white text-base px-3 py-1">🟢 NOW SERVING</Badge>;
      case 'completed':
        return <Badge className="bg-blue-500 hover:bg-blue-600 text-white text-base px-3 py-1">✅ COMPLETED</Badge>;
      case 'cancelled':
        return <Badge variant="destructive" className="text-base px-3 py-1">❌ CANCELLED</Badge>;
      case 'no_show':
        return <Badge variant="secondary" className="text-base px-3 py-1">⚠️ NO-SHOW</Badge>;
      default:
        return <Badge className="bg-amber-500 hover:bg-amber-600 text-white text-base px-3 py-1">⏳ IN QUEUE (WAITING)</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-primary/5 p-4 md:p-8">
      <div className="max-w-xl mx-auto space-y-6">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => navigate(`/patient/clinic/${token.clinicId}`)}
          className="gap-2 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Clinic
        </Button>

        <Card className="shadow-2xl border-2 border-primary/20 bg-card/95 backdrop-blur-md overflow-hidden">
          <CardHeader className="text-center bg-primary/5 pb-4 border-b border-primary/10">
            <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-2">
              <Ticket className="w-6 h-6 text-primary" />
            </div>
            <CardTitle className="text-3xl font-extrabold text-primary">
              Token #{token.tokenNumber}
            </CardTitle>
            <CardDescription className="text-base font-medium text-foreground/80 mt-1">
              {clinicName} {doctorName ? `— Dr. ${doctorName}` : ''}
            </CardDescription>
            <div className="mt-3">
              {getStatusBadge(statusLower)}
            </div>
          </CardHeader>

          <CardContent className="p-6 space-y-6">
            {/* Real-time Status Card */}
            {statusLower === 'serving' ? (
              <div className="p-4 bg-emerald-500/10 rounded-xl border-2 border-emerald-500/30 text-center space-y-2 animate-pulse">
                <Bell className="w-8 h-8 text-emerald-600 dark:text-emerald-400 mx-auto" />
                <h3 className="text-xl font-bold text-emerald-700 dark:text-emerald-300">
                  Please proceed to the consultation room!
                </h3>
                <p className="text-sm text-emerald-600 dark:text-emerald-400">
                  Your token is currently being called.
                </p>
              </div>
            ) : statusLower === 'waiting' ? (
              <div className="grid grid-cols-2 gap-4 text-center">
                <div className="p-4 bg-primary/5 rounded-xl border border-primary/10">
                  <span className="text-xs text-muted-foreground uppercase font-semibold">Currently Serving</span>
                  <div className="text-3xl font-bold text-primary mt-1">
                    #{servingToken || '-'}
                  </div>
                </div>
                <div className="p-4 bg-amber-500/5 rounded-xl border border-amber-500/10">
                  <span className="text-xs text-muted-foreground uppercase font-semibold">Patients Ahead</span>
                  <div className="text-3xl font-bold text-amber-600 dark:text-amber-400 mt-1">
                    {patientsAhead}
                  </div>
                </div>
              </div>
            ) : null}

            {/* Token Info Details */}
            <div className="space-y-3 bg-muted/40 p-4 rounded-xl border border-border text-sm">
              <div className="flex justify-between items-center py-1 border-b border-border/50">
                <span className="text-muted-foreground flex items-center gap-2">
                  <User className="w-4 h-4 text-primary" /> Patient Name
                </span>
                <span className="font-semibold">{token.name}</span>
              </div>

              <div className="flex justify-between items-center py-1 border-b border-border/50">
                <span className="text-muted-foreground flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-primary" /> Department
                </span>
                <span className="font-semibold text-primary">{token.department || "General Medicine"}</span>
              </div>

              {token.phone && (
                <div className="flex justify-between items-center py-1 border-b border-border/50">
                  <span className="text-muted-foreground">Phone</span>
                  <span className="font-medium">{token.phone}</span>
                </div>
              )}

              {token.age && (
                <div className="flex justify-between items-center py-1 border-b border-border/50">
                  <span className="text-muted-foreground">Age</span>
                  <span className="font-medium">{token.age} yrs</span>
                </div>
              )}

              <div className="flex justify-between items-center py-1">
                <span className="text-muted-foreground flex items-center gap-2">
                  <Clock className="w-4 h-4 text-primary" /> Estimated Wait
                </span>
                <span className="font-semibold text-amber-600 dark:text-amber-400">
                  {statusLower === 'serving' ? 'Now Serving' : statusLower === 'waiting' ? `~${estimatedWaitMinutes} mins` : 'Ended'}
                </span>
              </div>
            </div>

            <Button onClick={loadDetails} variant="outline" className="w-full">
              <RefreshCw className="w-4 h-4 mr-2" /> Refresh Status
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
