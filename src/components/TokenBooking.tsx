import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Clock, User, Stethoscope } from "lucide-react";
import { useQueue } from "../QueueContext";

export function TokenBooking({ onBooked }: { onBooked?: () => void }) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [department, setDepartment] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { currentNumber, tokens, bookToken } = useQueue();

  const departments = [
    "General Medicine",
    "Cardiology", 
    "Orthopedics",
    "Dermatology",
    "Pediatrics",
    "ENT",
    "Ophthalmology"
  ];

  const queueLength = tokens.length;
  const estimatedWaitTime = Math.max(0, (queueLength - (currentNumber - 1)) * 5);

  const handleBookToken = async () => {
    if (!name || !phone || !department) {
      toast({
        title: "Please fill all fields",
        description: "Name, phone and department are required",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1000));

    bookToken({
      name,
      phone,
      department,
      bookedAt: new Date().toISOString()
    });

    toast({
      title: "Token Booked Successfully!",
      description: `Your token has been added to the queue.`,
    });

    setName("");
    setPhone("");
    setDepartment("");
    setLoading(false);
    if (onBooked) onBooked();
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-2">
          <Stethoscope className="w-6 h-6 text-primary" />
        </div>
        <CardTitle className="font-semibold tracking-tight text-2xl">Booking Token</CardTitle>
        <p className="text-sm text-muted-foreground">Get your token offline</p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Removed Now Serving and In Queue grid */}
        {estimatedWaitTime > 0 && (
          <div className="flex items-center gap-2 p-3 bg-warning/10 rounded-lg border border-warning/20">
            <Clock className="w-4 h-4 text-warning" />
            <span className="text-sm">
              Estimated wait: <span className="font-semibold">{estimatedWaitTime} mins</span>
            </span>
          </div>
        )}
        <div className="space-y-4">
          <div>
            <Label htmlFor="name" className="flex items-center gap-2">
              <User className="w-4 h-4" />
              Full Name
            </Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your full name"
            />
          </div>
          <div>
            <Label htmlFor="phone">Phone Number</Label>
            <Input
              id="phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Enter your phone number"
            />
          </div>
          <div>
            <Label htmlFor="department">Department</Label>
            <Select value={department} onValueChange={setDepartment}>
              <SelectTrigger>
                <SelectValue placeholder="Select department" />
              </SelectTrigger>
              <SelectContent>
                {departments.map((dept) => (
                  <SelectItem key={dept} value={dept}>
                    {dept}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <Button 
          onClick={handleBookToken} 
          disabled={loading}
          variant="medical"
          className="w-full"
          size="lg"
        >
          {loading ? "Booking..." : "Book Token"}
        </Button>
      </CardContent>
    </Card>
  );
}