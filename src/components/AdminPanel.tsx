import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Settings, SkipForward, RotateCcw, Users, Play } from "lucide-react";

interface AdminPanelProps {
  currentNumber: number;
  queueLength: number;
  tokens: any[];
  onNextNumber: () => void;
  onResetQueue: () => void;
}

export function AdminPanel({ 
  currentNumber, 
  queueLength, 
  tokens, 
  onNextNumber, 
  onResetQueue 
}: AdminPanelProps) {
  const [showConfirmReset, setShowConfirmReset] = useState(false);

  const handleReset = () => {
    if (showConfirmReset) {
      onResetQueue();
      setShowConfirmReset(false);
    } else {
      setShowConfirmReset(true);
      setTimeout(() => setShowConfirmReset(false), 3000);
    }
  };

  // Only count tokens that are not yet served
  const waitingTokens = tokens.filter(token => token.tokenNumber >= currentNumber);
  const waitingCount = waitingTokens.length;
  // Show current number as 0-based
  const displayCurrentNumber = currentNumber - 1;

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Admin Control Panel
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Current Status */}
          <div className="grid md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-primary/5 rounded-lg border border-primary/20">
              <div className="text-3xl font-bold text-primary mb-1">{displayCurrentNumber}</div>
              <div className="text-sm text-muted-foreground">Current Number</div>
            </div>
            
            <div className="text-center p-4 bg-accent/5 rounded-lg border border-accent/20">
              <div className="text-3xl font-bold text-accent mb-1">{waitingCount}</div>
              <div className="text-sm text-muted-foreground">Total in Queue</div>
            </div>
            
            <div className="text-center p-4 bg-warning/5 rounded-lg border border-warning/20">
              <div className="text-3xl font-bold text-warning mb-1">{Math.max(0, queueLength - currentNumber)}</div>
              <div className="text-sm text-muted-foreground">Remaining</div>
            </div>
          </div>

          {/* Control Buttons */}
          <div className="flex gap-3">
            <Button 
              onClick={onNextNumber}
              variant="medical"
              size="lg"
              className="flex-1"
              disabled={waitingCount === 0}
            >
              <SkipForward className="w-4 h-4 mr-2" />
              Call Next Patient
            </Button>
            
            <Button 
              onClick={handleReset}
              variant={showConfirmReset ? "destructive" : "outline"}
              size="lg"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              {showConfirmReset ? "Confirm Reset" : "Reset Queue"}
            </Button>
          </div>

          {showConfirmReset && (
            <div className="p-3 bg-destructive/10 rounded-lg border border-destructive/20 text-center">
              <div className="text-destructive text-sm">
                ⚠️ This will reset the entire queue. Click "Confirm Reset" again to proceed.
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Upcoming Tokens */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Upcoming Patients
          </CardTitle>
        </CardHeader>
        
        <CardContent>
          {waitingTokens.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No patients in queue
            </div>
          ) : (
            <div className="space-y-3">
              {waitingTokens.map((token, index) => {
                const isNext = index === 0;
                return (
                  <div 
                    key={token.id} 
                    className={`flex items-center justify-between p-4 rounded-lg border ${
                      isNext 
                        ? 'bg-success/5 border-success/20' 
                        : 'bg-muted/30 border-border'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold ${
                        isNext 
                          ? 'bg-success text-success-foreground' 
                          : 'bg-primary/10 text-primary'
                      }`}>
                        #{token.tokenNumber}
                      </div>
                      <div>
                        <div className="font-medium">{token.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {token.department}
                          {token.age && ` • Age: ${token.age}`}
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      {isNext && (
                        <Badge variant="default" className="bg-success">
                          <Play className="w-3 h-3 mr-1" />
                          Next
                        </Badge>
                      )}
                      <div className="text-xs text-muted-foreground mt-1">
                        {new Date(token.bookedAt).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}