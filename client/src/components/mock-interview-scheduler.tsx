import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X } from "lucide-react";
import { format, addDays } from "date-fns";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface MockInterviewSchedulerProps {
  onClose: () => void;
}

export function MockInterviewScheduler({ onClose }: MockInterviewSchedulerProps) {
  const { toast } = useToast();
  const [interviewType, setInterviewType] = useState("dsa");
  const [interviewer, setInterviewer] = useState("ai");
  const [difficulty, setDifficulty] = useState("medium");
  const [selectedDate, setSelectedDate] = useState<string>(
    format(addDays(new Date(), 1), "yyyy-MM-dd")
  );
  const [selectedTime, setSelectedTime] = useState("14:00");
  const [specialRequests, setSpecialRequests] = useState("");
  const [isScheduling, setIsScheduling] = useState(false);

  // Generate available times for select
  const getTimeOptions = () => {
    const options = [];
    for (let hour = 9; hour <= 17; hour++) {
      options.push(`${hour}:00`);
      options.push(`${hour}:30`);
    }
    return options;
  };

  const formatTimeOption = (time: string) => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    return `${hour % 12 || 12}:${minutes} ${hour >= 12 ? 'PM' : 'AM'}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedDate || !selectedTime) {
      toast({
        title: "Date and time required",
        description: "Please select both a date and time for your interview",
        variant: "destructive"
      });
      return;
    }
    
    setIsScheduling(true);
    
    try {
      // Convert to proper datetime format
      const scheduledAt = new Date(`${selectedDate}T${selectedTime}:00`);
      
      // Get interview type label
      const interviewTypeLabel = {
        "dsa": "Data Structures & Algorithms",
        "system": "System Design",
        "behavioral": "Behavioral",
        "frontend": "Frontend Development",
        "backend": "Backend Development"
      }[interviewType] || interviewType;
      
      // Schedule the interview
      await apiRequest("POST", "/api/interviews", {
        type: interviewTypeLabel,
        isAi: interviewer === "ai",
        scheduledAt,
        difficulty,
        notes: specialRequests || undefined
      });
      
      // Invalidate interviews cache to refresh data
      queryClient.invalidateQueries({ queryKey: ["/api/interviews"] });
      queryClient.invalidateQueries({ queryKey: ["/api/interviews/upcoming"] });
      
      toast({
        title: "Interview scheduled",
        description: `Your ${interviewTypeLabel} interview has been scheduled for ${format(scheduledAt, "PPpp")}`,
      });
      
      onClose();
    } catch (error) {
      console.error("Error scheduling interview:", error);
      toast({
        title: "Error scheduling interview",
        description: "There was a problem scheduling your interview. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsScheduling(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
      <Card className="w-full max-w-3xl">
        <CardHeader className="flex flex-row items-center justify-between p-4 border-b">
          <CardTitle className="text-lg">Schedule Mock Interview</CardTitle>
          <Button 
            variant="ghost" 
            onClick={onClose}
            className="h-8 w-8 p-0"
          >
            <X className="h-5 w-5" />
          </Button>
        </CardHeader>
        
        <CardContent className="p-6">
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-2 gap-6 mb-6">
              <div>
                <Label className="block text-sm font-medium mb-2">Interview Type</Label>
                <Select value={interviewType} onValueChange={setInterviewType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select interview type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="dsa">Data Structures & Algorithms</SelectItem>
                    <SelectItem value="system">System Design</SelectItem>
                    <SelectItem value="behavioral">Behavioral</SelectItem>
                    <SelectItem value="frontend">Frontend Development</SelectItem>
                    <SelectItem value="backend">Backend Development</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="block text-sm font-medium mb-2">Interviewer</Label>
                <Select value={interviewer} onValueChange={setInterviewer}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select interviewer type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ai">AI Interviewer (Free)</SelectItem>
                    <SelectItem value="human">Human Expert (Premium)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="mb-6">
              <Label className="block text-sm font-medium mb-2">Difficulty Level</Label>
              <div className="flex space-x-2">
                <Button
                  type="button"
                  variant={difficulty === "easy" ? "default" : "outline"}
                  className="flex-1"
                  onClick={() => setDifficulty("easy")}
                >
                  Easy
                </Button>
                <Button
                  type="button"
                  variant={difficulty === "medium" ? "default" : "outline"}
                  className="flex-1"
                  onClick={() => setDifficulty("medium")}
                >
                  Medium
                </Button>
                <Button
                  type="button"
                  variant={difficulty === "hard" ? "default" : "outline"}
                  className="flex-1"
                  onClick={() => setDifficulty("hard")}
                >
                  Hard
                </Button>
              </div>
            </div>
            
            <div className="mb-6">
              <Label className="block text-sm font-medium mb-2">Date & Time</Label>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    min={format(new Date(), "yyyy-MM-dd")}
                  />
                </div>
                <div>
                  <Select value={selectedTime} onValueChange={setSelectedTime}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select time" />
                    </SelectTrigger>
                    <SelectContent>
                      {getTimeOptions().map((time) => (
                        <SelectItem key={time} value={time}>
                          {formatTimeOption(time)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            
            <div className="mb-6">
              <Label className="block text-sm font-medium mb-2">Special Requests (Optional)</Label>
              <Textarea
                value={specialRequests}
                onChange={(e) => setSpecialRequests(e.target.value)}
                placeholder="Any specific topics or questions you'd like to cover..."
                className="h-24"
              />
            </div>
            
            <div className="flex justify-end">
              <Button 
                type="button" 
                variant="outline" 
                onClick={onClose}
                className="mr-3"
              >
                Cancel
              </Button>
              <Button 
                type="submit"
                disabled={isScheduling}
              >
                {isScheduling ? "Scheduling..." : "Schedule Interview"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
