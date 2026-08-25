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

      <CardHeader className="pb-2 pt-5">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isOpen ? "bg-primary/10" : "bg-muted"}`}>
              <Stethoscope className={`w-5 h-5 ${isOpen ? "text-primary" : "text-muted-foreground"}`} />
            </div>
            <div>
              <CardTitle className="text-base leading-tight">{clinicName}</CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">{doctorName}</p>
            </div>
          </div>
          <Badge variant={isOpen ? "default" : "secondary"} className={isOpen ? "bg-success/10 text-success border-success/30" : ""}>
            {status}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="p-2 bg-primary/5 rounded-lg border border-primary/10">
            <div className="text-xl font-bold text-primary">{currentToken || 0}</div>
            <div className="text-[10px] text-muted-foreground leading-tight">Now Serving</div>
          </div>
          <div className="p-2 bg-accent/5 rounded-lg border border-accent/10">
            <div className="flex items-center justify-center gap-1">
              <Users className="w-3 h-3 text-accent" />
              <div className="text-xl font-bold text-accent">{waitingCount}</div>
            </div>
            <div className="text-[10px] text-muted-foreground leading-tight">Waiting</div>
          </div>
          <div className="p-2 bg-warning/5 rounded-lg border border-warning/10">
            <div className="flex items-center justify-center gap-1">
              <Clock className="w-3 h-3 text-warning" />
              <div className="text-xl font-bold text-warning">{estimatedWait}</div>
            </div>
            <div className="text-[10px] text-muted-foreground leading-tight">Min wait</div>
          </div>
        </div>

        <Button
          className="w-full"
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
