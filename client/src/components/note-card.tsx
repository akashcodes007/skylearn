import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Edit, Download, Share2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface NoteCardProps {
  title: string;
  content: string;
  createdAt: Date;
  tags: string[];
  onEdit?: () => void;
  onDownload?: () => void;
  onShare?: () => void;
}

export function NoteCard({
  title,
  content,
  createdAt,
  tags,
  onEdit,
  onDownload,
  onShare
}: NoteCardProps) {
  // Format date as "2 days ago", "1 week ago", etc.
  const timeAgo = formatDistanceToNow(new Date(createdAt), { addSuffix: true });

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold">{title}</h3>
          <div className="flex items-center text-muted-foreground text-sm">
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
            Generated {timeAgo}
          </div>
        </div>
        
        <p className="text-muted-foreground mb-4 text-sm line-clamp-2">
          {content}
        </p>
        
        <div className="flex items-center justify-between">
          <div className="flex flex-wrap gap-2">
            {tags.map((tag, index) => {
              // Determine badge color based on tag name
              const getVariant = (tag: string) => {
                const tagLower = tag.toLowerCase();
                if (tagLower.includes('structure')) return 'primary';
                if (tagLower.includes('design')) return 'secondary';
                if (tagLower.includes('algorithm')) return 'default';
                return 'outline';
              };
              
              return (
                <Badge key={index} variant={getVariant(tag) as any}>
                  {tag}
                </Badge>
              );
            })}
          </div>
          
          <div className="flex space-x-2">
            <button 
              onClick={onEdit}
              className="p-1.5 rounded-full hover:bg-muted"
            >
              <Edit className="h-4 w-4 text-muted-foreground" />
            </button>
            <button 
              onClick={onDownload}
              className="p-1.5 rounded-full hover:bg-muted"
            >
              <Download className="h-4 w-4 text-muted-foreground" />
            </button>
            <button 
              onClick={onShare}
              className="p-1.5 rounded-full hover:bg-muted"
            >
              <Share2 className="h-4 w-4 text-muted-foreground" />
            </button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
