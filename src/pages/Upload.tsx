
import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { mockService } from "@/lib/mockData";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { X, ImageIcon, TrendingUp } from "lucide-react";
import { STANDARD_TAGS } from "@/lib/standardTags";

const AI_TOOLS = [
  "DALL-E 3 (ChatGPT)",
  "Meta AI",
  "Midjourney",
  "Stable Diffusion",
  "Leonardo AI",
  "Firefly",
  "Other",
];

export default function UploadPrompt() {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState("");
  const [promptText, setPromptText] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState("");
  const [useUrl, setUseUrl] = useState(false);
  const [toolUsed, setToolUsed] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [customTool, setCustomTool] = useState("");

  // Get the actual tool name for submission
  const getActualToolName = () => {
    if (toolUsed === "Other" && customTool.trim()) {
      return customTool.trim();
    }
    return toolUsed;
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast({
        title: "Invalid file type",
        description: "Please select an image file",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Image must be less than 5MB",
        variant: "destructive",
      });
      return;
    }

    setImageFile(file);

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const clearImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleAddTag = () => {
    const tag = tagInput.toLowerCase().trim();
    if (tag && !tags.includes(tag) && tags.length < 8) {
      setTags([...tags, tag]);
      setTagInput("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  const handleTagKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      handleAddTag();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user || !profile) {
      toast({
        title: "Sign in required",
        description: "Please sign in to upload prompts",
        variant: "destructive",
      });
      return;
    }

    if (tags.length < 3) {
      toast({
        title: "More tags needed",
        description: "Please add at least 3 tags",
        variant: "destructive",
      });
      return;
    }

    // Validate image (either file or URL)
    if (!useUrl && !imageFile) {
      toast({
        title: "Image required",
        description: "Please select an image to upload",
        variant: "destructive",
      });
      return;
    }

    if (useUrl && !imageUrl.trim()) {
      toast({
        title: "Image URL required",
        description: "Please enter an image URL",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      let finalImageUrl = imageUrl;

      // If using file upload, upload to GitHub
      if (!useUrl && imageFile) {
        setIsUploading(true);

        const { uploadImageToGitHub, generateFilename } = await import("@/lib/githubUpload");
        const filename = generateFilename(imageFile.name);

        const uploadResult = await uploadImageToGitHub(imageFile, filename);

        if (!uploadResult.success) {
          throw new Error(uploadResult.error || "Failed to upload image");
        }

        finalImageUrl = uploadResult.cdnUrl!;
        setIsUploading(false);
      }

      // Create the prompt with the image URL
      const newPrompt = await mockService.createPrompt({
        creator_id: profile.id,
        title,
        prompt_text: promptText,
        image_url: finalImageUrl,
        tool_used: getActualToolName(),
        tags: tags
      });

      toast({
        title: "Prompt uploaded successfully!",
        description: useUrl ? "Your prompt has been created" : "Your image has been uploaded"
      });
      navigate(`/prompt/${newPrompt.id}`);
    } catch (error: any) {
      console.error("Upload error:", error);
      toast({
        title: "Upload failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
      setIsUploading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen min-h-[100dvh] bg-background">
        <Navbar />
        <main className="pt-14 sm:pt-16 lg:pt-20 px-4 sm:px-6 lg:px-8 text-center py-12 sm:py-16">
          <h1 className="font-serif text-xl sm:text-2xl mb-3 sm:mb-4">Sign in to upload</h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            You need to be signed in to upload prompts
          </p>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen min-h-[100dvh] bg-background flex flex-col">
      <Navbar />

      <main className="flex-1 pt-14 sm:pt-16 lg:pt-20">
        <div className="px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-12">
          <div className="max-w-xl sm:max-w-2xl mx-auto">
            <h1 className="font-serif text-2xl sm:text-3xl text-center mb-6 sm:mb-8">
              Upload Prompt
            </h1>

            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
              {/* Image Upload */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-sm sm:text-base">Image</Label>
                  <button
                    type="button"
                    onClick={() => {
                      setUseUrl(!useUrl);
                      setImageFile(null);
                      setImagePreview(null);
                      setImageUrl("");
                      if (fileInputRef.current) {
                        fileInputRef.current.value = "";
                      }
                    }}
                    className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {useUrl ? "Upload file instead" : "Use URL instead"}
                  </button>
                </div>

                {useUrl ? (
                  <div className="space-y-2">
                    <Input
                      type="url"
                      placeholder="https://example.com/image.jpg"
                      value={imageUrl}
                      onChange={(e) => {
                        setImageUrl(e.target.value);
                        setImagePreview(e.target.value);
                      }}
                      className="bg-secondary/50 border-0 text-sm sm:text-base"
                    />
                    {imagePreview && (
                      <div className="relative">
                        <img
                          src={imagePreview}
                          alt="Preview"
                          className="w-full max-h-48 sm:max-h-64 object-contain bg-secondary rounded-sm"
                          onError={() => {
                            toast({
                              title: "Invalid image URL",
                              description: "Could not load image from the provided URL",
                              variant: "destructive",
                            });
                            setImagePreview(null);
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setImageUrl("");
                            setImagePreview(null);
                          }}
                          className="absolute top-2 right-2 p-1.5 bg-background/80 rounded-sm hover:bg-background transition-colors touch-target"
                          aria-label="Clear image"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileSelect}
                      className="hidden"
                    />

                    {!imagePreview ? (
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full h-36 sm:h-48 border-2 border-dashed border-border rounded-sm flex flex-col items-center justify-center gap-2 sm:gap-3 hover:border-accent transition-colors bg-secondary/30 touch-target"
                      >
                        <ImageIcon className="h-8 sm:h-10 w-8 sm:w-10 text-muted-foreground" />
                        <div className="text-center px-4">
                          <p className="text-xs sm:text-sm font-medium">Click to upload image</p>
                          <p className="text-xs text-muted-foreground mt-1">PNG, JPG, WEBP up to 5MB</p>
                        </div>
                      </button>
                    ) : (
                      <div className="relative">
                        <img
                          src={imagePreview}
                          alt="Preview"
                          className="w-full max-h-48 sm:max-h-64 object-contain bg-secondary rounded-sm"
                        />
                        <button
                          type="button"
                          onClick={clearImage}
                          className="absolute top-2 right-2 p-1.5 bg-background/80 rounded-sm hover:bg-background transition-colors touch-target"
                          aria-label="Remove image"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Title */}
              <div className="space-y-2">
                <Label htmlFor="title" className="text-sm sm:text-base">Title</Label>
                <Input
                  id="title"
                  placeholder="Give your prompt a descriptive title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  maxLength={100}
                  className="bg-secondary/50 border-0 text-sm sm:text-base"
                />
              </div>

              {/* Prompt Text */}
              <div className="space-y-2">
                <Label htmlFor="promptText" className="text-sm sm:text-base">Prompt</Label>
                <Textarea
                  id="promptText"
                  placeholder="Enter the full prompt text..."
                  value={promptText}
                  onChange={(e) => setPromptText(e.target.value)}
                  required
                  rows={5}
                  className="bg-secondary/50 border-0 resize-none text-sm sm:text-base min-h-[120px] sm:min-h-[150px]"
                />
              </div>

              {/* Tool Used */}
              <div className="space-y-2">
                <Label htmlFor="toolUsed" className="text-sm sm:text-base">AI Tool</Label>
                <Select value={toolUsed} onValueChange={(value) => {
                  setToolUsed(value);
                  if (value !== "Other") {
                    setCustomTool("");
                  }
                }} required>
                  <SelectTrigger className="bg-secondary/50 border-0 text-sm sm:text-base">
                    <SelectValue placeholder="Select the tool used" />
                  </SelectTrigger>
                  <SelectContent>
                    {/* NANO BANANA - Featured Tool */}
                    <SelectItem value="NANO BANANA" className="relative">
                      <span className="flex items-center gap-2">
                        <span className="font-semibold text-foreground">
                          NANO BANANA (Gemini)
                        </span>
                        <TrendingUp className="h-3.5 w-3.5 text-gold" />
                      </span>
                    </SelectItem>
                    <div className="h-px bg-border my-1" />
                    {AI_TOOLS.map((tool) => (
                      <SelectItem key={tool} value={tool}>
                        {tool}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Custom tool input when "Other" is selected */}
                {toolUsed === "Other" && (
                  <Input
                    placeholder="Enter the name of the tool"
                    value={customTool}
                    onChange={(e) => setCustomTool(e.target.value)}
                    className="bg-secondary/50 border-0 mt-2 text-sm sm:text-base"
                    required
                  />
                )}
              </div>

              {/* Tags */}
              <div className="space-y-2">
                <Label htmlFor="tags" className="text-sm sm:text-base">
                  Tags ({tags.length}/8) — minimum 3
                </Label>
                <div className="flex gap-2">
                  <Input
                    id="tags"
                    placeholder="Add a tag and press Enter"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={handleTagKeyDown}
                    className="bg-secondary/50 border-0 text-sm sm:text-base flex-1"
                    disabled={tags.length >= 8}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleAddTag}
                    disabled={tags.length >= 8 || !tagInput.trim()}
                    className="flex-shrink-0"
                  >
                    Add
                  </Button>
                </div>

                {/* Suggested Tags */}
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground">Suggested tags:</p>
                  <div className="flex flex-wrap gap-1 sm:gap-1.5">
                    {STANDARD_TAGS.filter(tag => !tags.includes(tag)).slice(0, 12).map((tag) => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => {
                          if (tags.length < 8 && !tags.includes(tag)) {
                            setTags([...tags, tag]);
                          }
                        }}
                        disabled={tags.length >= 8}
                        className="px-2 py-0.5 text-xs bg-secondary/50 hover:bg-secondary text-muted-foreground hover:text-foreground rounded-sm transition-colors disabled:opacity-50"
                      >
                        + {tag}
                      </button>
                    ))}
                  </div>
                </div>

                {tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 sm:gap-2 mt-2">
                    {tags.map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center gap-1 px-2 sm:px-3 py-0.5 sm:py-1 bg-secondary text-xs sm:text-sm rounded-sm"
                      >
                        {tag}
                        <button
                          type="button"
                          onClick={() => handleRemoveTag(tag)}
                          className="text-muted-foreground hover:text-foreground p-0.5"
                          aria-label={`Remove ${tag} tag`}
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Submit */}
              <Button
                type="submit"
                className="w-full text-sm sm:text-base py-2.5 sm:py-3"
                disabled={
                  isSubmitting ||
                  !toolUsed ||
                  (toolUsed === "Other" && !customTool.trim()) ||
                  tags.length < 3 ||
                  (useUrl ? !imageUrl.trim() : !imageFile)
                }
              >
                {isUploading ? "Uploading image..." : isSubmitting ? "Saving..." : "Upload Prompt"}
              </Button>
            </form>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}