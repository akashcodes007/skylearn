import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Upload, X } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface AINotesGeneratorProps {
  onClose: () => void;
  onGenerate: (content: string, title: string) => void;
}

export function AINotesGenerator({ onClose, onGenerate }: AINotesGeneratorProps) {
  const { toast } = useToast();
  const [sourceType, setSourceType] = useState("text");
  const [file, setFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState("");
  const [textInput, setTextInput] = useState("");
  const [format, setFormat] = useState("detailed");
  const [complexity, setComplexity] = useState("intermediate");
  const [generateQuestions, setGenerateQuestions] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [title, setTitle] = useState("");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title) {
      toast({
        title: "Title is required",
        description: "Please provide a title for your notes",
        variant: "destructive"
      });
      return;
    }
    
    let content = "";
    
    // Validation based on source type
    if (sourceType === "file" && !file) {
      toast({
        title: "File is required",
        description: "Please upload a document",
        variant: "destructive"
      });
      return;
    } else if (sourceType === "video" && !videoUrl) {
      toast({
        title: "Video URL is required",
        description: "Please enter a video URL",
        variant: "destructive"
      });
      return;
    } else if (sourceType === "text" && !textInput) {
      toast({
        title: "Text input is required",
        description: "Please enter some text content",
        variant: "destructive"
      });
      return;
    }
    
    setIsGenerating(true);
    
    try {
      // In a real implementation, we would handle file upload and video transcription
      // For this demo, we'll use the text input directly or mock file/video content
      
      if (sourceType === "file" && file) {
        // Mock file content extraction for demo
        content = `Content extracted from file: ${file.name}. This is a simulated file content for demonstration purposes. In a real implementation, we would extract the text content from the uploaded file.`;
      } else if (sourceType === "video" && videoUrl) {
        // Mock video transcription for demo
        content = `Transcription from video at URL: ${videoUrl}. This is a simulated transcription for demonstration purposes. In a real implementation, we would extract the transcription from the video.`;
      } else if (sourceType === "text") {
        content = textInput;
      }
      
      // Call the API to generate notes
      const response = await apiRequest("POST", "/api/notes/generate", {
        text: content,
        format: format,
        complexity: complexity,
        generateQuestions: generateQuestions
      });
      
      const result = await response.json();
      
      // Call the onGenerate callback with the generated content
      onGenerate(result.content, title);
      
      toast({
        title: "Notes generated successfully",
        description: "Your AI-generated notes are ready!",
      });
      
      onClose();
    } catch (error) {
      console.error("Error generating notes:", error);
      
      // Get detailed error message if available
      let errorMessage = "There was a problem generating your notes. Please try again.";
      
      if (error instanceof Response) {
        // Try to get error details from response
        try {
          const errorData = await error.json();
          if (errorData.message) {
            errorMessage = errorData.message;
          }
        } catch (e) {
          // If we can't parse the JSON, use the status text
          errorMessage = error.statusText || errorMessage;
        }
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      // Show specific message based on error type
      if (errorMessage.includes('rate limit') || errorMessage.includes('429')) {
        toast({
          title: "OpenAI API Rate Limit Exceeded",
          description: "We've hit the API rate limit. Please try again in a few minutes.",
          variant: "destructive"
        });
      } else if (errorMessage.includes('quota exceeded') || errorMessage.includes('insufficient_quota')) {
        toast({
          title: "OpenAI API Quota Exceeded",
          description: "The API quota has been exceeded. Please contact the administrator.",
          variant: "destructive"
        });
      } else {
        toast({
          title: "Error generating notes",
          description: errorMessage,
          variant: "destructive"
        });
      }
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
      <Card className="w-full max-w-3xl">
        <CardHeader className="flex flex-row items-center justify-between p-4 border-b">
          <CardTitle className="text-lg">Generate AI Notes</CardTitle>
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
            <div className="mb-6">
              <Label className="block text-sm font-medium mb-2">Note Title</Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter a title for your notes"
                className="w-full"
                required
              />
            </div>
            
            <div className="mb-6">
              <Label className="block text-sm font-medium mb-2">Source Type</Label>
              <RadioGroup 
                value={sourceType}
                onValueChange={setSourceType}
                className="flex space-x-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="file" id="file" />
                  <Label htmlFor="file">Upload PDF</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="video" id="video" />
                  <Label htmlFor="video">Video URL</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="text" id="text" />
                  <Label htmlFor="text">Text Input</Label>
                </div>
              </RadioGroup>
            </div>
            
            {sourceType === "file" && (
              <div className="mb-6">
                <Label className="block text-sm font-medium mb-2">Upload Document</Label>
                <div className="border-2 border-dashed border-muted rounded-lg p-6 text-center">
                  {!file ? (
                    <>
                      <Upload className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground mb-3">
                        Drag and drop your PDF here, or click to browse
                      </p>
                      <Button 
                        type="button"
                        variant="outline"
                        onClick={() => document.getElementById("file-upload")?.click()}
                      >
                        Browse Files
                      </Button>
                      <Input
                        id="file-upload"
                        type="file"
                        accept=".pdf,.doc,.docx,.txt"
                        className="hidden"
                        onChange={handleFileChange}
                      />
                    </>
                  ) : (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="mr-3 p-2 bg-primary/10 rounded">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="24"
                            height="24"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="h-5 w-5 text-primary"
                          >
                            <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                            <polyline points="14 2 14 8 20 8" />
                          </svg>
                        </div>
                        <div>
                          <p className="font-medium">{file.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {(file.size / 1024).toFixed(2)} KB
                          </p>
                        </div>
                      </div>
                      <Button 
                        type="button"
                        variant="ghost" 
                        size="sm"
                        onClick={() => setFile(null)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {sourceType === "video" && (
              <div className="mb-6">
                <Label className="block text-sm font-medium mb-2">Video URL</Label>
                <Input
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  placeholder="https://www.youtube.com/watch?v=..."
                  className="w-full"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Supports YouTube, Vimeo, and most common video platforms
                </p>
              </div>
            )}
            
            {sourceType === "text" && (
              <div className="mb-6">
                <Label className="block text-sm font-medium mb-2">Text Content</Label>
                <Textarea
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  placeholder="Enter the text content you want to generate notes from..."
                  className="w-full min-h-[200px]"
                />
              </div>
            )}
            
            <div className="mb-6">
              <Label className="block text-sm font-medium mb-2">Note Options</Label>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="block text-xs text-muted-foreground mb-1">Format</Label>
                  <Select value={format} onValueChange={setFormat}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select format" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="detailed">Detailed Notes</SelectItem>
                      <SelectItem value="concise">Concise Summary</SelectItem>
                      <SelectItem value="bullet">Bullet Points</SelectItem>
                      <SelectItem value="qa">Q&A Format</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="block text-xs text-muted-foreground mb-1">Complexity Level</Label>
                  <Select value={complexity} onValueChange={setComplexity}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="beginner">Beginner</SelectItem>
                      <SelectItem value="intermediate">Intermediate</SelectItem>
                      <SelectItem value="advanced">Advanced</SelectItem>
                      <SelectItem value="expert">Expert</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="generate-questions"
                  checked={generateQuestions}
                  onCheckedChange={(checked) => setGenerateQuestions(checked as boolean)}
                />
                <label
                  htmlFor="generate-questions"
                  className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Generate practice questions
                </label>
              </div>
              
              <div className="flex gap-3">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={onClose}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit"
                  disabled={isGenerating}
                >
                  {isGenerating ? "Generating..." : "Generate Notes"}
                </Button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
