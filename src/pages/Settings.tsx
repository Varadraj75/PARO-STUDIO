
import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { mockService } from "@/lib/mockData";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { Camera, ImageIcon } from "lucide-react";
import { uploadImageToGitHub, generateFilename } from "@/lib/githubUpload";

export default function Settings() {
  const navigate = useNavigate();
  const { user, profile, refreshProfile } = useAuth();
  const { toast } = useToast();
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [website, setWebsite] = useState("");
  const [twitter, setTwitter] = useState("");
  const [instagram, setInstagram] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [coverUrl, setCoverUrl] = useState<string | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [usernameError, setUsernameError] = useState("");

  useEffect(() => {
    if (profile) {
      setUsername(profile.username || "");
      setDisplayName(profile.display_name || "");
      setBio(profile.bio || "");
      setWebsite(profile.website || "");
      setTwitter(profile.twitter || "");
      setInstagram(profile.instagram || "");
      setAvatarUrl(profile.avatar_url);
      setCoverUrl(profile.cover_url || null);
    }
  }, [profile]);

  const handleAvatarSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (!file.type.startsWith("image/")) {
      toast({ title: "Invalid file type", description: "Please select an image", variant: "destructive" });
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast({ title: "File too large", description: "Avatar must be less than 2MB", variant: "destructive" });
      return;
    }

    // Show preview immediately
    const reader = new FileReader();
    reader.onloadend = () => {
      setAvatarPreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    // Delete old avatar from GitHub if it exists
    if (avatarUrl) {
      const { deleteImageFromGitHub, extractFilenameFromUrl } = await import("@/lib/githubDelete");
      const oldFilename = extractFilenameFromUrl(avatarUrl);
      if (oldFilename) {
        await deleteImageFromGitHub(oldFilename);
      }
    }

    // Upload to GitHub
    toast({ title: "Uploading avatar...", description: "Please wait" });

    const filename = generateFilename(file.name);
    const result = await uploadImageToGitHub(file, filename);

    if (result.success && result.cdnUrl) {
      // Add cache-busting query parameter to force browser to reload the image
      const cacheBustedUrl = `${result.cdnUrl}?t=${Date.now()}`;
      setAvatarUrl(cacheBustedUrl);
      // Clear preview so the new CDN URL is displayed
      setAvatarPreview(null);
      toast({ title: "Avatar uploaded successfully!", description: "Your profile picture is now live" });
    } else {
      toast({
        title: "Upload failed",
        description: result.error || "Please try again",
        variant: "destructive"
      });
      // Revert preview on error
      setAvatarPreview(null);
    }

    // Reset file input to allow re-selection
    if (avatarInputRef.current) {
      avatarInputRef.current.value = "";
    }
  };

  const handleCoverSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (!file.type.startsWith("image/")) {
      toast({ title: "Invalid file type", description: "Please select an image", variant: "destructive" });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "File too large", description: "Cover must be less than 5MB", variant: "destructive" });
      return;
    }

    // Show preview immediately
    const reader = new FileReader();
    reader.onloadend = () => {
      setCoverPreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    // Delete old cover from GitHub if it exists
    if (coverUrl) {
      const { deleteImageFromGitHub, extractFilenameFromUrl } = await import("@/lib/githubDelete");
      const oldFilename = extractFilenameFromUrl(coverUrl);
      if (oldFilename) {
        await deleteImageFromGitHub(oldFilename);
      }
    }

    // Upload to GitHub
    toast({ title: "Uploading cover photo...", description: "Please wait" });

    const filename = generateFilename(file.name);
    const result = await uploadImageToGitHub(file, filename);

    if (result.success && result.cdnUrl) {
      // Add cache-busting query parameter to force browser to reload the image
      const cacheBustedUrl = `${result.cdnUrl}?t=${Date.now()}`;
      setCoverUrl(cacheBustedUrl);
      // Clear preview so the new CDN URL is displayed
      setCoverPreview(null);
      toast({ title: "Cover photo uploaded successfully!", description: "Your cover photo is now live" });
    } else {
      toast({
        title: "Upload failed",
        description: result.error || "Please try again",
        variant: "destructive"
      });
      // Revert preview on error
      setCoverPreview(null);
    }

    // Reset file input to allow re-selection
    if (coverInputRef.current) {
      coverInputRef.current.value = "";
    }
  };

  const checkUsernameAvailability = async (newUsername: string) => {
    if (!newUsername || newUsername === profile?.username) {
      setUsernameError("");
      return true;
    }

    // Validate format
    if (!/^[a-z0-9_]+$/.test(newUsername)) {
      setUsernameError("Only lowercase letters, numbers, and underscores");
      return false;
    }

    if (newUsername.length < 3) {
      setUsernameError("Username must be at least 3 characters");
      return false;
    }

    const data = await mockService.getProfileByUsername(newUsername);

    if (data && data.id !== user?.id) {
      setUsernameError("Username already taken");
      return false;
    }

    setUsernameError("");
    return true;
  };

  // Helper function to remove cache-busting query parameters
  const stripCacheBusting = (url: string | null): string | null => {
    if (!url) return null;
    return url.split('?')[0];
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user || !profile) return;

    const isUsernameValid = await checkUsernameAvailability(username);
    if (!isUsernameValid) return;

    setIsSubmitting(true);

    try {
      const updatedProfile = await mockService.updateProfile(user.id, {
        username: username.toLowerCase(),
        display_name: displayName,
        bio,
        website,
        twitter,
        instagram,
        avatar_url: stripCacheBusting(avatarUrl),
        cover_url: stripCacheBusting(coverUrl),
      });

      if (!updatedProfile) throw new Error("Failed to update profile");

      await refreshProfile();
      toast({ title: "Profile updated successfully!" });
      navigate(`/profile/${username}`);
    } catch (error: any) {
      toast({ title: "Update failed", description: error.message, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="pt-20 lg:pt-24 container mx-auto px-4 lg:px-8 text-center py-16">
          <h1 className="font-serif text-2xl mb-4">Sign in required</h1>
          <p className="text-muted-foreground">Please sign in to edit your profile</p>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="pt-20 lg:pt-24">
        <div className="container mx-auto px-4 lg:px-8 py-12">
          <div className="max-w-2xl mx-auto">
            <h1 className="font-serif text-3xl text-center mb-8">Edit Profile</h1>

            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Cover Photo */}
              <div className="space-y-2">
                <Label>Cover Photo</Label>
                <input
                  ref={coverInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleCoverSelect}
                  className="hidden"
                />
                <div
                  onClick={() => coverInputRef.current?.click()}
                  className="relative w-full h-40 bg-secondary/50 rounded-sm overflow-hidden cursor-pointer group"
                >
                  {(coverPreview || coverUrl) ? (
                    <>
                      <img
                        src={coverPreview || coverUrl || ""}
                        alt="Cover"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-foreground/0 group-hover:bg-foreground/30 transition-colors flex items-center justify-center">
                        <Camera className="h-8 w-8 text-background opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full gap-2">
                      <ImageIcon className="h-8 w-8 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">Click to upload cover photo</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Avatar */}
              <div className="space-y-2">
                <Label>Profile Picture</Label>
                <input
                  ref={avatarInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarSelect}
                  className="hidden"
                />
                <div
                  className="flex items-center gap-4 cursor-pointer"
                  onClick={() => avatarInputRef.current?.click()}
                >
                  <div className="relative group">
                    <Avatar className="h-20 w-20">
                      <AvatarImage src={avatarPreview || avatarUrl || ""} />
                      <AvatarFallback className="bg-secondary font-serif text-xl">
                        {(displayName || username).charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="absolute inset-0 rounded-full bg-foreground/0 group-hover:bg-foreground/30 transition-colors flex items-center justify-center">
                      <Camera className="h-6 w-6 text-background opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Click to upload profile picture<br />
                    Max 2MB, square recommended
                  </div>
                </div>
              </div>

              {/* Username */}
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  placeholder="your_username"
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value.toLowerCase());
                    checkUsernameAvailability(e.target.value.toLowerCase());
                  }}
                  required
                  className="bg-secondary/50 border-0"
                />
                {usernameError && (
                  <p className="text-sm text-destructive">{usernameError}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  paro.ai/profile/{username || "username"}
                </p>
              </div>

              {/* Display Name */}
              <div className="space-y-2">
                <Label htmlFor="displayName">Display Name</Label>
                <Input
                  id="displayName"
                  placeholder="Your Name"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="bg-secondary/50 border-0"
                />
              </div>

              {/* Bio */}
              <div className="space-y-2">
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                  id="bio"
                  placeholder="Tell us about yourself..."
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  rows={4}
                  maxLength={300}
                  className="bg-secondary/50 border-0 resize-none"
                />
                <p className="text-xs text-muted-foreground text-right">{bio.length}/300</p>
              </div>

              {/* Social Links */}
              <div className="space-y-4">
                <Label>Social Links</Label>
                <div className="space-y-3">
                  <Input
                    placeholder="Website URL"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                    className="bg-secondary/50 border-0"
                  />
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground text-sm">@</span>
                    <Input
                      placeholder="Twitter username"
                      value={twitter}
                      onChange={(e) => setTwitter(e.target.value)}
                      className="bg-secondary/50 border-0"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground text-sm">@</span>
                    <Input
                      placeholder="Instagram username"
                      value={instagram}
                      onChange={(e) => setInstagram(e.target.value)}
                      className="bg-secondary/50 border-0"
                    />
                  </div>
                </div>
              </div>

              {/* Submit */}
              <div className="flex gap-3">
                <Button type="submit" className="flex-1" disabled={isSubmitting || !!usernameError}>
                  {isSubmitting ? "Saving..." : "Save Changes"}
                </Button>
                <Button type="button" variant="outline" onClick={() => navigate(-1)}>
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
