import { useState } from "react";
import { Bell, MessageSquare, Search, Menu } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/use-auth";

interface HeaderProps {
  onMenuClick: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");

  if (!user) return null;

  // Get user initials for avatar
  const initials = user.name
    .split(' ')
    .map(part => part[0])
    .join('')
    .toUpperCase()
    .substring(0, 2);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle search functionality
    console.log("Searching for:", searchQuery);
  };

  return (
    <header className="bg-white border-b flex items-center justify-between p-4 sticky top-0 z-30">
      <div className="flex items-center">
        <button 
          className="md:hidden text-neutral-400 mr-4" 
          onClick={onMenuClick}
        >
          <Menu className="h-6 w-6" />
        </button>
        
        <form onSubmit={handleSearch} className="relative w-64">
          <Input
            type="text"
            placeholder="Search courses, notes..."
            className="w-full pl-10 pr-4 py-2" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
        </form>
      </div>
      
      <div className="flex items-center">
        <button className="relative mr-3 p-2 rounded-full hover:bg-muted">
          <Bell className="h-5 w-5 text-neutral-400" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-destructive rounded-full"></span>
        </button>
        
        <button className="relative mr-3 p-2 rounded-full hover:bg-muted">
          <MessageSquare className="h-5 w-5 text-neutral-400" />
        </button>
        
        <div className="hidden sm:block">
          <div className="w-9 h-9 rounded-full bg-primary text-white flex items-center justify-center">
            <span className="text-sm font-medium">{initials}</span>
          </div>
        </div>
      </div>
    </header>
  );
}
