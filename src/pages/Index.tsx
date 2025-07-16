import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TokenBooking } from "@/components/TokenBooking";
import { QueueDisplay } from "@/components/QueueDisplay";
import { TokenStatus } from "@/components/TokenStatus";
import { AdminPanel } from "@/components/AdminPanel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Heart, Shield, Clock } from "lucide-react";

const Index = () => {
  const [currentNumber, setCurrentNumber] = useState(1);
  const [tokens, setTokens] = useState<any[]>([]);
  const [userToken, setUserToken] = useState<any>(null);

  // Auto-increment current number for demo (remove in production)
  useEffect(() => {
    const interval = setInterval(() => {
      if (tokens.length > 0 && currentNumber < Math.max(...tokens.map(t => t.tokenNumber))) {
        setCurrentNumber(prev => prev + 1);
      }
    }, 30000); // Every 30 seconds for demo

    return () => clearInterval(interval);
  }, [tokens, currentNumber]);

  const handleTokenIssued = (tokenData: any) => {
    setTokens(prev => [...prev, tokenData]);
    setUserToken(tokenData);
  };

  const handleNextNumber = () => {
    setCurrentNumber(prev => prev + 1);
  };

  const handleResetQueue = () => {
    setCurrentNumber(1);
    setTokens([]);
    setUserToken(null);
  };

  const handleBackToBooking = () => {
    setUserToken(null);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                <Heart className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">ClinicQueue</h1>
                <p className="text-sm text-muted-foreground">Smart Token Management</p>
              </div>
            </div>
            <Badge variant="outline" className="bg-success/10 text-success border-success/20">
              <div className="w-2 h-2 bg-success rounded-full mr-2"></div>
              Online
            </Badge>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {userToken ? (
          // Show token status if user has a token
          <TokenStatus 
            token={userToken} 
            currentNumber={currentNumber}
            onBack={handleBackToBooking}
          />
        ) : (
          // Main interface with tabs
          <Tabs defaultValue="queue" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="queue">Queue Status</TabsTrigger>
              <TabsTrigger value="book">Book Token</TabsTrigger>
              <TabsTrigger value="admin">Admin Panel</TabsTrigger>
            </TabsList>

            <TabsContent value="queue" className="space-y-6">
              <QueueDisplay 
                currentNumber={currentNumber}
                queueLength={tokens.length}
                recentTokens={tokens}
              />
            </TabsContent>

            <TabsContent value="book" className="space-y-6">
              <TokenBooking 
                onTokenIssued={handleTokenIssued}
                currentNumber={currentNumber}
                queueLength={tokens.length}
              />
              
              {/* Features */}
              <div className="grid md:grid-cols-3 gap-6 mt-8">
                <Card>
                  <CardHeader className="text-center">
                    <Clock className="w-8 h-8 text-primary mx-auto mb-2" />
                    <CardTitle className="text-lg">Save Time</CardTitle>
                  </CardHeader>
                  <CardContent className="text-center">
                    <p className="text-sm text-muted-foreground">
                      No more waiting in crowded rooms. Get your token online and arrive just in time.
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="text-center">
                    <Shield className="w-8 h-8 text-accent mx-auto mb-2" />
                    <CardTitle className="text-lg">Stay Safe</CardTitle>
                  </CardHeader>
                  <CardContent className="text-center">
                    <p className="text-sm text-muted-foreground">
                      Minimize exposure by reducing time spent in waiting areas.
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="text-center">
                    <Heart className="w-8 h-8 text-success mx-auto mb-2" />
                    <CardTitle className="text-lg">Better Care</CardTitle>
                  </CardHeader>
                  <CardContent className="text-center">
                    <p className="text-sm text-muted-foreground">
                      Real-time updates and estimated wait times for a better experience.
                    </p>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="admin" className="space-y-6">
              <AdminPanel 
                currentNumber={currentNumber}
                queueLength={tokens.length}
                tokens={tokens}
                onNextNumber={handleNextNumber}
                onResetQueue={handleResetQueue}
              />
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  );
};

export default Index;
