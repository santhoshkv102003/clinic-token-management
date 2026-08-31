import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, Users, Stethoscope, ArrowRight } from "lucide-react";

interface ClinicCardProps {
  clinicId: string;
  clinicName: string;
  doctorName: string;
  status: "Open" | "Closed";
  currentToken: number;
  waitingCount: number;
  estimatedWait: number;
}

export function ClinicCard({ clinicId, clinicName, doctorName, status, currentToken, waitingCount, estimatedWait }: ClinicCardProps) {
  const navigate = useNavigate();
  const isOpen = status === "Open";

  return (
    <Card className={`relative overflow-hidden transition-all duration-200 hover:shadow-lg hover:-translate-y-1 border-2 ${isOpen ? "border-primary/20 bg-card/80" : "border-muted bg-muted/30"}`}>
      {/* Status strip */}
      <div className={`absolute top-0 left-0 right-0 h-1 ${isOpen ? "bg-success" : "bg-muted-foreground"}`} />

      <CardHeader className="pb-2 pt-4 sm:pt-5 px-3 sm:px-6">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center shrink-0 ${isOpen ? "bg-primary/10" : "bg-muted"}`}>
              <Stethoscope className={`w-4 h-4 sm:w-5 sm:h-5 ${isOpen ? "text-primary" : "text-muted-foreground"}`} />
            </div>
            <div className="min-w-0">
              <CardTitle className="text-sm sm:text-base leading-tight truncate">{clinicName}</CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5 truncate">{doctorName}</p>
            </div>
          </div>
          <Badge variant={isOpen ? "default" : "secondary"} className={`shrink-0 text-[10px] sm:text-xs ${isOpen ? "bg-success/10 text-success border-success/30" : ""}`}>
            {status}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-3 px-3 sm:px-6 pb-4 sm:pb-6">
        <div className="grid grid-cols-3 gap-1.5 sm:gap-2 text-center">
          <div className="p-1.5 sm:p-2 bg-primary/5 rounded-lg border border-primary/10">
            <div className="text-lg sm:text-xl font-bold text-primary">{currentToken || 0}</div>
            <div className="text-[9px] sm:text-[10px] text-muted-foreground leading-tight">Now Serving</div>
          </div>
          <div className="p-1.5 sm:p-2 bg-accent/5 rounded-lg border border-accent/10">
            <div className="flex items-center justify-center gap-1">
              <Users className="w-3 h-3 text-accent" />
              <div className="text-lg sm:text-xl font-bold text-accent">{waitingCount}</div>
            </div>
            <div className="text-[9px] sm:text-[10px] text-muted-foreground leading-tight">Waiting</div>
          </div>
          <div className="p-1.5 sm:p-2 bg-warning/5 rounded-lg border border-warning/10">
            <div className="flex items-center justify-center gap-1">
              <Clock className="w-3 h-3 text-warning" />
              <div className="text-lg sm:text-xl font-bold text-warning">{estimatedWait}</div>
            </div>
            <div className="text-[9px] sm:text-[10px] text-muted-foreground leading-tight">Min wait</div>
          </div>
        </div>

        <Button
          className="w-full text-xs sm:text-sm font-semibold rounded-xl"
          variant={isOpen ? "medical" : "outline"}
          disabled={!isOpen}
          onClick={() => navigate(`/clinic/${clinicId}`)}
        >
          View Clinic <ArrowRight className="w-4 h-4 ml-1" />
        </Button>
      </CardContent>
    </Card>
  );
}
