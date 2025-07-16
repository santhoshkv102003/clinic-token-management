import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Monitor, Users, Clock, CheckCircle } from "lucide-react";

interface QueueDisplayProps {
  currentNumber: number;
  queueLength: number;
  recentTokens: any[];
}

export function QueueDisplay({ currentNumber, queueLength, recentTokens }: QueueDisplayProps) {
  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Main Display */}
      <Card className="text-center">
        <CardHeader>
          <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-2">
            <Monitor className="w-8 h-8 text-primary" />
          </div>
          <CardTitle className="text-3xl">Queue Status</CardTitle>
        </CardHeader>
        
        <CardContent>
          <div className="grid md:grid-cols-3 gap-6">
            {/* Current Number */}
            <div className="p-6 bg-gradient-to-br from-primary/10 to-primary-glow/10 rounded-xl border-2 border-primary/20">
              <div className="text-6xl font-bold text-primary mb-2">{currentNumber}</div>
              <div className="text-lg font-medium text-primary">Now Serving</div>
              <div className="text-sm text-muted-foreground mt-1">Please proceed to counter</div>
            </div>
            
            {/* Queue Length */}
            <div className="p-6 bg-accent/5 rounded-xl border border-accent/20">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Users className="w-6 h-6 text-accent" />
              </div>
              <div className="text-4xl font-bold text-accent mb-2">{queueLength}</div>
              <div className="text-lg font-medium">In Queue</div>
              <div className="text-sm text-muted-foreground">Patients waiting</div>
            </div>
            
            {/* Average Wait */}
            <div className="p-6 bg-warning/5 rounded-xl border border-warning/20">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Clock className="w-6 h-6 text-warning" />
              </div>
              <div className="text-4xl font-bold text-warning mb-2">{queueLength * 5}</div>
              <div className="text-lg font-medium">Minutes</div>
              <div className="text-sm text-muted-foreground">Estimated wait</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentTokens.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No recent tokens yet
              </div>
            ) : (
              recentTokens.slice(-5).reverse().map((token) => (
                <div key={token.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                      <span className="font-bold text-primary">#{token.tokenNumber}</span>
                    </div>
                    <div>
                      <div className="font-medium">{token.name}</div>
                      <div className="text-sm text-muted-foreground">{token.department}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge variant="secondary">
                      {new Date(token.bookedAt).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </Badge>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}