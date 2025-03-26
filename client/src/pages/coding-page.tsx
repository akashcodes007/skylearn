import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Sidebar } from "@/components/sidebar";
import { Header } from "@/components/header";
import { CodeEditor } from "@/components/code-editor";
import { Button } from "@/components/ui/button";
import { 
  Card, 
  CardContent, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { CodingProblem } from "@shared/schema";

export default function CodingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [selectedProblem, setSelectedProblem] = useState<CodingProblem | null>(null);
  const [difficultyFilter, setDifficultyFilter] = useState("all");
  const [tagFilter, setTagFilter] = useState("all");

  // Fetch coding problems
  const { data: problems, isLoading } = useQuery<CodingProblem[]>({
    queryKey: ["/api/coding-problems"]
  });

  // Get all unique tags from problems
  const allTags = problems
    ? Array.from(new Set(problems.flatMap(problem => problem.tags || [])))
    : [];

  // Filter problems based on selected filters
  const filteredProblems = problems
    ? problems.filter(problem => {
        const matchesDifficulty = difficultyFilter === "all" || problem.difficulty.toLowerCase() === difficultyFilter;
        const matchesTag = tagFilter === "all" || problem.tags?.includes(tagFilter);
        return matchesDifficulty && matchesTag;
      })
    : [];

  // Get difficulty color
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case "easy":
        return "bg-green-100 text-green-800";
      case "medium":
        return "bg-yellow-100 text-yellow-800";
      case "hard":
        return "bg-red-100 text-red-800";
      default:
        return "bg-blue-100 text-blue-800";
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-muted">
      <Sidebar className="z-50" />
      
      <div className="flex-1 flex flex-col overflow-hidden md:ml-64">
        <Header onMenuClick={() => setMobileMenuOpen(!mobileMenuOpen)} />
        
        <main className="flex-1 overflow-y-auto py-6 px-4 md:px-6">
          {/* Page Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
            <h1 className="text-2xl font-bold mb-2 sm:mb-0">Coding Problems</h1>
            <div className="flex gap-4">
              <Select value={difficultyFilter} onValueChange={setDifficultyFilter}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Difficulty" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Difficulties</SelectItem>
                  <SelectItem value="easy">Easy</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="hard">Hard</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={tagFilter} onValueChange={setTagFilter}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Tag" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Tags</SelectItem>
                  {allTags.map((tag) => (
                    <SelectItem key={tag} value={tag}>
                      {tag}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {/* Problems Grid */}
          {isLoading ? (
            <div className="text-center py-12">
              <div className="spinner h-8 w-8 mx-auto mb-4 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
              <p>Loading problems...</p>
            </div>
          ) : filteredProblems.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProblems.map((problem) => (
                <Card key={problem.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg">{problem.title}</CardTitle>
                      <Badge className={getDifficultyColor(problem.difficulty)}>
                        {problem.difficulty}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground line-clamp-3 mb-4">
                      {problem.description}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {problem.tags?.map((tag, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button 
                      className="w-full"
                      onClick={() => setSelectedProblem(problem)}
                    >
                      Solve Problem
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-white rounded-xl shadow-sm">
              <h3 className="text-lg font-medium mb-2">No matching problems found</h3>
              <p className="text-muted-foreground mb-4">
                Try adjusting your filters or check back later for new problems
              </p>
              <Button 
                variant="outline" 
                onClick={() => {
                  setDifficultyFilter("all");
                  setTagFilter("all");
                }}
              >
                Clear Filters
              </Button>
            </div>
          )}
        </main>
      </div>
      
      {/* Code Editor Modal */}
      {selectedProblem && (
        <CodeEditor
          problem={selectedProblem}
          onClose={() => setSelectedProblem(null)}
        />
      )}
    </div>
  );
}
