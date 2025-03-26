import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Timer } from "lucide-react";
import { format } from "date-fns";

interface UpcomingCardProps {
  title: string;
  heading: string;
  items: Array<UpcomingInterview | UpcomingTest>;
  viewAllLink: string;
  onScheduleNew?: () => void;
}

interface UpcomingInterview {
  id: number;
  title: string;
  description: string;
  isAi: boolean;
  scheduledAt: Date;
  type: 'interview';
}

interface UpcomingTest {
  id: number;
  title: string;
  description: string;
  type: 'test';
  testType: 'MCQ' | 'Coding';
  durationMinutes: number;
  scheduledAt: Date;
}

export function UpcomingCard({
  title,
  heading,
  items,
  viewAllLink,
  onScheduleNew
}: UpcomingCardProps) {
  // Format date as "Tomorrow, 2:00 PM" or "Friday, 11:00 AM"
  const formatScheduledDate = (date: Date) => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    // Check if date is today
    if (date.toDateString() === today.toDateString()) {
      return `Today, ${format(date, 'h:mm a')}`;
    } 
    // Check if date is tomorrow
    else if (date.toDateString() === tomorrow.toDateString()) {
      return `Tomorrow, ${format(date, 'h:mm a')}`;
    } 
    // Otherwise show day name and time
    else {
      return `${format(date, 'EEEE')}, ${format(date, 'h:mm a')}`;
    }
  };

  return (
    <Card className="mb-6">
      <CardContent className="p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold">{heading}</h3>
          {onScheduleNew ? (
            <button 
              onClick={onScheduleNew}
              className="text-sm text-primary hover:underline"
            >
              Schedule new
            </button>
          ) : (
            <a href={viewAllLink} className="text-sm text-primary hover:underline">
              View all
            </a>
          )}
        </div>
        
        <div className="divide-y">
          {items.length > 0 ? (
            items.map((item, index) => (
              <div key={index} className="py-3 first:pt-0 last:pb-0">
                <div className="flex justify-between items-start mb-1">
                  <h4 className="font-medium">{item.title}</h4>
                  
                  {'isAi' in item ? (
                    <Badge 
                      variant={item.isAi ? 'default' : 'secondary'}
                    >
                      {item.isAi ? 'AI' : 'Human'}
                    </Badge>
                  ) : (
                    <Badge 
                      variant={item.testType === 'MCQ' ? 'warning' : 'accent'}
                    >
                      {item.testType}
                    </Badge>
                  )}
                </div>
                
                <p className="text-sm text-muted-foreground mb-2">
                  {item.description}
                </p>
                
                {'durationMinutes' in item && (
                  <div className="flex items-center text-xs text-muted-foreground mb-2">
                    <Timer className="mr-1 h-3 w-3" />
                    <span>
                      {item.durationMinutes} minutes
                      {item.testType === 'MCQ' ? ', multiple choice' : ', coding challenges'}
                    </span>
                  </div>
                )}
                
                <div className="flex items-center text-xs text-muted-foreground">
                  <Calendar className="mr-1 h-3 w-3" />
                  <span>{formatScheduledDate(item.scheduledAt)}</span>
                </div>
              </div>
            ))
          ) : (
            <div className="py-6 text-center text-muted-foreground">
              <p>No upcoming {title.toLowerCase()} scheduled</p>
              {onScheduleNew && (
                <button 
                  onClick={onScheduleNew}
                  className="mt-2 text-primary text-sm hover:underline"
                >
                  Schedule your first {title.toLowerCase().slice(0, -1)}
                </button>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
