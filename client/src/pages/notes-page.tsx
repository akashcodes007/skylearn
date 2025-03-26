import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Loader2, PlusCircle, Search } from "lucide-react";
import { Sidebar } from "@/components/sidebar";
import { Header } from "@/components/header";
import { NoteCard } from "@/components/note-card";
import { AINotesGenerator } from "@/components/ai-notes-generator";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Note } from "@shared/schema";

export default function NotesPage() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [showNotesGenerator, setShowNotesGenerator] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Fetch user's notes
  const { data: notes, isLoading } = useQuery<Note[]>({
    queryKey: ["/api/notes"]
  });

  // Create note mutation
  const createNoteMutation = useMutation({
    mutationFn: async (noteData: { title: string, content: string, tags: string[] }) => {
      const res = await apiRequest("POST", "/api/notes", noteData);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notes"] });
      toast({
        title: "Note saved successfully",
        description: "Your AI-generated note has been saved to your library"
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to save note",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Delete note mutation
  const deleteNoteMutation = useMutation({
    mutationFn: async (noteId: number) => {
      await apiRequest("DELETE", `/api/notes/${noteId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notes"] });
      toast({
        title: "Note deleted",
        description: "The note has been deleted successfully"
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to delete note",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Handle generating and saving notes
  const handleGenerateNote = (content: string, title: string) => {
    // Extract tags from content (simplified approach - in a real app, this would be more sophisticated)
    const commonTags = ["Data Structures", "Algorithms", "System Design", "Frontend", "Backend"];
    const tags = commonTags.filter(tag => 
      content.toLowerCase().includes(tag.toLowerCase())
    ).slice(0, 3);
    
    // If no tags were found, add a default tag
    if (tags.length === 0) {
      tags.push("General");
    }
    
    createNoteMutation.mutate({
      title,
      content,
      tags
    });
  };

  // Filter and sort notes
  const filteredAndSortedNotes = notes
    ? notes
        .filter(note => 
          searchQuery === "" || 
          note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          note.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
          note.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
        )
        .sort((a, b) => {
          if (sortBy === "newest") {
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
          } else if (sortBy === "oldest") {
            return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          } else if (sortBy === "title") {
            return a.title.localeCompare(b.title);
          }
          return 0;
        })
    : [];

  return (
    <div className="flex h-screen overflow-hidden bg-muted">
      <Sidebar className="z-50" />
      
      <div className="flex-1 flex flex-col overflow-hidden md:ml-64">
        <Header onMenuClick={() => setMobileMenuOpen(!mobileMenuOpen)} />
        
        <main className="flex-1 overflow-y-auto py-6 px-4 md:px-6">
          {/* Page Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
            <h1 className="text-2xl font-bold mb-2 sm:mb-0">AI-Generated Notes</h1>
            <Button 
              onClick={() => setShowNotesGenerator(true)}
              className="flex items-center"
            >
              <PlusCircle className="mr-2 h-5 w-5" />
              Generate New Notes
            </Button>
          </div>
          
          {/* Filters and Search */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="Search by title, content, or tags..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="w-full sm:w-48">
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger>
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest First</SelectItem>
                  <SelectItem value="oldest">Oldest First</SelectItem>
                  <SelectItem value="title">Title (A-Z)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {/* Notes Grid */}
          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filteredAndSortedNotes.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredAndSortedNotes.map((note) => (
                <NoteCard
                  key={note.id}
                  title={note.title}
                  content={note.content}
                  createdAt={note.createdAt}
                  tags={note.tags || []}
                  onEdit={() => toast({ 
                    title: "Edit feature",
                    description: "Note editing will be available in a future update" 
                  })}
                  onDownload={() => {
                    // Create a download link for the note content
                    const element = document.createElement("a");
                    const file = new Blob([note.content], {type: 'text/plain'});
                    element.href = URL.createObjectURL(file);
                    element.download = `${note.title.replace(/\s+/g, '_')}.txt`;
                    document.body.appendChild(element);
                    element.click();
                    document.body.removeChild(element);
                    
                    toast({
                      title: "Note downloaded",
                      description: `"${note.title}" has been downloaded as a text file`
                    });
                  }}
                  onShare={() => {
                    // In a real app, this would open a sharing dialog
                    navigator.clipboard.writeText(note.content);
                    toast({
                      title: "Note copied to clipboard",
                      description: "You can now paste it anywhere you want"
                    });
                  }}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-white rounded-xl shadow-sm">
              {searchQuery ? (
                <>
                  <h3 className="text-lg font-medium mb-2">No matching notes found</h3>
                  <p className="text-muted-foreground mb-4">
                    Try adjusting your search or clear the filter to see all notes
                  </p>
                  <Button 
                    variant="outline" 
                    onClick={() => setSearchQuery("")}
                  >
                    Clear Search
                  </Button>
                </>
              ) : (
                <>
                  <h3 className="text-lg font-medium mb-2">No notes yet</h3>
                  <p className="text-muted-foreground mb-4">
                    Generate your first AI-powered study notes
                  </p>
                  <Button onClick={() => setShowNotesGenerator(true)}>
                    Generate Notes
                  </Button>
                </>
              )}
            </div>
          )}
        </main>
      </div>
      
      {/* Notes Generator Modal */}
      {showNotesGenerator && (
        <AINotesGenerator
          onClose={() => setShowNotesGenerator(false)}
          onGenerate={handleGenerateNote}
        />
      )}
    </div>
  );
}
