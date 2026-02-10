import { Link } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface CreatorCardProps {
  id: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  promptCount: number;
  followerCount: number;
}

export function CreatorCard({
  id,
  username,
  displayName,
  avatarUrl,
  promptCount,
  followerCount,
}: CreatorCardProps) {
  return (
    <Link
      to={`/profile/${id}`}
      className="flex items-center gap-4 p-4 bg-card rounded-sm hover-lift transition-all duration-300"
    >
      <Avatar className="h-14 w-14">
        <AvatarImage src={avatarUrl || ""} alt={displayName || username} />
        <AvatarFallback className="bg-secondary text-secondary-foreground font-serif text-lg">
          {(displayName || username).charAt(0).toUpperCase()}
        </AvatarFallback>
      </Avatar>

      <div className="flex-1 min-w-0">
        <h4 className="font-serif text-lg truncate">
          {displayName || username}
        </h4>
        <p className="text-sm text-muted-foreground">@{username}</p>
        <div className="flex gap-4 mt-1 text-xs text-muted-foreground">
          <span>{promptCount} prompts</span>
          <span>{followerCount.toLocaleString()} followers</span>
        </div>
      </div>
    </Link>
  );
}
