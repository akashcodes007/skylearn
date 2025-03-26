import { Progress } from "@/components/ui/progress";
import { User } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "wouter";

interface CourseCardProps {
  id: number;
  title: string;
  description: string;
  level: string;
  durationHours: number;
  instructorName: string;
  progress: number;
  coverImage?: string;
}

export function CourseCard({
  id,
  title,
  description,
  level,
  durationHours,
  instructorName,
  progress,
  coverImage
}: CourseCardProps) {
  // Generate a background color based on course title if no image is provided
  const getBackgroundClass = () => {
    const colorOptions = [
      "bg-primary-light", 
      "bg-secondary-light", 
      "bg-accent-light"
    ];
    const index = title.length % colorOptions.length;
    return coverImage ? "" : colorOptions[index];
  };

  return (
    <Card className="overflow-hidden h-full">
      <div className={`h-36 relative ${getBackgroundClass()}`}>
        {coverImage && (
          <img 
            src={coverImage} 
            alt={title} 
            className="w-full h-full object-cover"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>
        <div className="absolute bottom-3 left-4 right-4 flex justify-between items-center">
          <span className="bg-white text-primary text-xs font-medium px-2 py-1 rounded">
            {level}
          </span>
          <span className="bg-primary text-white text-xs font-medium px-2 py-1 rounded flex items-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="mr-1"
            >
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
            {durationHours} hours
          </span>
        </div>
      </div>
      
      <CardContent className="p-4">
        <h3 className="font-semibold text-lg mb-2">{title}</h3>
        <p className="text-muted-foreground text-sm mb-3 line-clamp-2">
          {description}
        </p>
        
        <div className="mb-2">
          <div className="flex justify-between text-xs mb-1">
            <span>Progress</span>
            <span className="font-medium">{progress}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
        
        <div className="flex justify-between items-center mt-4">
          <div className="flex items-center">
            <div className="w-8 h-8 rounded-full overflow-hidden bg-muted flex items-center justify-center mr-2">
              <User className="h-4 w-4 text-muted-foreground" />
            </div>
            <span className="text-sm">{instructorName}</span>
          </div>
          <Link href={`/courses/${id}`}>
            <a className="text-primary text-sm font-medium hover:underline">Continue</a>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
