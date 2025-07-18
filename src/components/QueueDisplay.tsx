import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Monitor, Users, Clock, CheckCircle, Home } from "lucide-react";
import { useQueue } from "../QueueContext";
import { useNavigate, useLocation } from "react-router-dom";

export function QueueDisplay() {
  const { currentNumber, tokens } = useQueue();
  const navigate = useNavigate();
  const location = useLocation();
  // Only count tokens that are not yet served
  // Now Serving starts at 0
  const waitingTokens = tokens.filter(token => token.tokenNumber >= currentNumber);
  const waitingCount = waitingTokens.length;
  const estimatedWait = waitingCount * 5;

  // If there are tokens, set currentNumber to 0 for the first token
  const displayCurrentNumber = tokens.length > 0 ? currentNumber - 1 : 0;

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6 relative">
      {/* Home Logo OUTSIDE the Card */}
      {/* Main Display */}
      <Card className="text-center bg-transparent shadow-none border-none">
        <CardHeader className="flex flex-col space-y-1.5 p-6">
          <CardTitle className="font-semibold tracking-tight text-3xl">Queue Status</CardTitle>
        </CardHeader>
        
        <CardContent>
          <div className="grid md:grid-cols-3 gap-6">
            {/* Current Number */}
            <div className="p-6 bg-card/50 backdrop-blur-sm rounded-xl border-2 border-primary/20">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Users className="w-6 h-6 text-primary" />
              </div>
              <div className="text-4xl font-bold text-primary mb-2">{displayCurrentNumber}</div>
              <div className="text-lg font-medium text-black">Now Serving</div>
              <div className="text-sm text-muted-foreground mt-1">Please proceed to counter</div>
            </div>
            
            {/* Queue Length */}
            <div className="p-6 bg-card/50 backdrop-blur-sm rounded-xl border-2 border-primary/20">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Users className="w-6 h-6 text-accent" />
              </div>
              <div className="text-4xl font-bold text-accent mb-2">{waitingCount}</div>
              <div className="text-lg font-medium">In Queue</div>
              <div className="text-sm text-muted-foreground">Patients waiting</div>
            </div>
            
            {/* Average Wait */}
            <div className="p-6 bg-card/50 backdrop-blur-sm rounded-xl border-2 border-primary/20">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Clock className="w-6 h-6 text-warning" />
              </div>
              <div className="text-4xl font-bold text-warning mb-2">{estimatedWait}</div>
              <div className="text-lg font-medium">Minutes</div>
              <div className="text-sm text-muted-foreground">Estimated Waiting Time</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}