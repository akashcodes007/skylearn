import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";
import { Link, useLocation } from "wouter";
import { 
  Home, 
  BookOpen, 
  FileText, 
  Code, 
  HelpCircle, 
  UserVoice, 
  User, 
  Settings, 
  LogOut, 
  Menu, 
  X
} from "lucide-react";
import { useState } from "react";

interface SidebarProps {
  className?: string;
}

export function Sidebar({ className }: SidebarProps) {
  const [location] = useLocation();
  const { user, logoutMutation } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  if (!user) return null;

  // Get user initials for avatar
  const initials = user.name
    .split(' ')
    .map(part => part[0])
    .join('')
    .toUpperCase()
    .substring(0, 2);

  const navItems = [
    {
      section: "Main",
      items: [
        { 
          name: "Dashboard", 
          href: "/dashboard", 
          icon: <Home className="mr-3 h-5 w-5" />,
          active: location === "/" || location === "/dashboard"
        },
        { 
          name: "My Courses", 
          href: "/courses", 
          icon: <BookOpen className="mr-3 h-5 w-5" />,
          active: location === "/courses"
        },
        { 
          name: "AI Notes", 
          href: "/notes", 
          icon: <FileText className="mr-3 h-5 w-5" />,
          active: location === "/notes"
        }
      ]
    },
    {
      section: "Practice",
      items: [
        { 
          name: "Coding Problems", 
          href: "/coding", 
          icon: <Code className="mr-3 h-5 w-5" />,
          active: location === "/coding"
        },
        { 
          name: "Tests & Quizzes", 
          href: "/tests", 
          icon: <HelpCircle className="mr-3 h-5 w-5" />,
          active: location === "/tests"
        },
        { 
          name: "Mock Interviews", 
          href: "/interviews", 
          icon: <UserVoice className="mr-3 h-5 w-5" />,
          active: location === "/interviews"
        }
      ]
    },
    {
      section: "Account",
      items: [
        { 
          name: "My Profile", 
          href: "/profile", 
          icon: <User className="mr-3 h-5 w-5" />,
          active: location === "/profile"
        },
        { 
          name: "Settings", 
          href: "/settings", 
          icon: <Settings className="mr-3 h-5 w-5" />,
          active: location === "/settings"
        }
      ]
    }
  ];

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  // Mobile menu toggle
  const toggleMobileMenu = () => {
    setMobileOpen(!mobileOpen);
  };

  return (
    <>
      {/* Mobile Menu Button */}
      <button 
        className="md:hidden fixed top-4 left-4 z-50 p-2 rounded-md bg-white shadow-md text-neutral-400"
        onClick={toggleMobileMenu}
      >
        {mobileOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Sidebar */}
      <aside 
        className={cn(
          "bg-white shadow-lg w-64 flex-shrink-0 flex flex-col h-screen fixed z-40",
          "transition-transform duration-300 ease-in-out",
          mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0",
          className
        )}
      >
        {/* Logo */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center">
            <div className="w-10 h-10 rounded-md bg-primary flex items-center justify-center text-white mr-3">
              <Code className="h-6 w-6" />
            </div>
            <h1 className="font-bold text-xl text-primary">CodeLearn</h1>
          </div>
          <button className="md:hidden text-neutral-400 hover:text-primary" onClick={toggleMobileMenu}>
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* User Profile */}
        <div className="p-4">
          <div className="flex items-center mb-6">
            <div className="w-10 h-10 rounded-full bg-primary-light text-white flex items-center justify-center mr-3">
              <span className="text-sm font-medium">{initials}</span>
            </div>
            <div>
              <p className="font-medium">{user.name}</p>
              <p className="text-xs text-neutral-300 capitalize">{user.role}</p>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1">
            {navItems.map((section, idx) => (
              <div key={idx} className="mb-2">
                <p className="text-xs uppercase font-medium text-neutral-300 mb-2 px-3">
                  {section.section}
                </p>
                <ul>
                  {section.items.map((item, i) => (
                    <li key={i}>
                      <Link href={item.href}>
                        <a className={cn(
                          "flex items-center px-3 py-2 rounded-md mb-1 transition-colors",
                          item.active 
                            ? "text-primary bg-primary-light bg-opacity-10 font-medium" 
                            : "text-neutral-400 hover:text-primary hover:bg-primary-light hover:bg-opacity-10"
                        )}>
                          {item.icon}
                          <span>{item.name}</span>
                        </a>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </div>

        {/* Logout */}
        <div className="p-4 mt-auto border-t">
          <button 
            onClick={handleLogout}
            className="flex items-center px-3 py-2 rounded-md text-neutral-400 hover:text-destructive hover:bg-destructive hover:bg-opacity-10 transition-colors w-full"
          >
            <LogOut className="mr-3 h-5 w-5" />
            <span>Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
}
