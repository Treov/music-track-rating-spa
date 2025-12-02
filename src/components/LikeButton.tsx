"use client"

import { useState, useEffect } from "react";
import { Heart, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { ensureGuestUser, getGuestUserId } from "@/lib/guest-user";
import { GuestNameDialog } from "./GuestNameDialog";

interface LikeButtonProps {
  entityType: "track" | "artist";
  entityId: number;
  currentUserId?: number | null;
  onLikeChange?: () => void;
}

export const LikeButton = ({ entityType, entityId, currentUserId, onLikeChange }: LikeButtonProps) => {
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [showGuestDialog, setShowGuestDialog] = useState(false);

  useEffect(() => {
    fetchLikeStatus();
  }, [entityType, entityId, currentUserId]);

  const fetchLikeStatus = async () => {
    try {
      const guestId = getGuestUserId();
      const params = new URLSearchParams();
      
      if (currentUserId) {
        params.append("userId", currentUserId.toString());
      } else if (guestId) {
        params.append("guestId", guestId.toString());
      }

      const endpoint = entityType === "track" 
        ? `/api/tracks/${entityId}/likes`
        : `/api/artists/${entityId}/likes`;

      const response = await fetch(`${endpoint}?${params}`);
      if (response.ok) {
        const data = await response.json();
        setLiked(data.userLiked);
        setLikeCount(data.count);
      }
    } catch (error) {
      console.error("Error fetching like status:", error);
    }
  };

  const handleLike = async () => {
    setLoading(true);

    try {
      let userId = currentUserId;
      let guestId = getGuestUserId();

      // If not authenticated and no guest user, ask for nickname
      if (!userId && !guestId) {
        setShowGuestDialog(true);
        setLoading(false);
        return;
      }

      const endpoint = entityType === "track"
        ? `/api/tracks/${entityId}/likes`
        : `/api/artists/${entityId}/likes`;

      if (liked) {
        // Unlike
        const response = await fetch(endpoint, {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId, guestId }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || "Failed to unlike");
        }

        const data = await response.json();
        setLiked(false);
        setLikeCount(data.totalLikes);
      } else {
        // Like
        const response = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId, guestId }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || "Failed to like");
        }

        const data = await response.json();
        setLiked(true);
        setLikeCount(data.totalLikes);
      }

      onLikeChange?.();
    } catch (error) {
      console.error("Error toggling like:", error);
      toast.error(error instanceof Error ? error.message : "Ошибка при лайке");
    } finally {
      setLoading(false);
    }
  };

  const handleGuestNameSubmit = async (displayName: string) => {
    try {
      const guestUser = await ensureGuestUser(displayName);
      if (guestUser) {
        setShowGuestDialog(false);
        // Retry the like action
        setTimeout(() => handleLike(), 100);
      } else {
        toast.error("Не удалось создать гостевого пользователя");
      }
    } catch (error) {
      toast.error("Ошибка при создании гостевого пользователя");
    }
  };

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={handleLike}
        disabled={loading}
        className={`glass-card border-border hover:border-primary/50 gap-2 ${
          liked ? "text-primary border-primary" : ""
        }`}
      >
        {loading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Heart className={`w-4 h-4 ${liked ? "fill-current" : ""}`} />
        )}
        <span>{likeCount}</span>
      </Button>

      <GuestNameDialog
        open={showGuestDialog}
        onSubmit={handleGuestNameSubmit}
        onCancel={() => setShowGuestDialog(false)}
      />
    </>
  );
};
