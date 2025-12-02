"use client"

import { useState, useEffect } from "react";
import { MessageSquare, Send, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { ensureGuestUser, getGuestUserId } from "@/lib/guest-user";
import { GuestNameDialog } from "./GuestNameDialog";

interface Comment {
  id: number;
  trackId: number;
  userId: number | null;
  guestId: number | null;
  comment: string;
  displayName: string;
  role: string | null;
  createdAt: string;
  updatedAt: string;
}

interface TrackCommentsProps {
  trackId: number;
  currentUserId?: number | null;
  currentUserRole?: string | null;
}

export const TrackComments = ({ trackId, currentUserId, currentUserRole }: TrackCommentsProps) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [showGuestDialog, setShowGuestDialog] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  useEffect(() => {
    fetchComments();
  }, [trackId]);

  const fetchComments = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/tracks/${trackId}/comments`);
      if (response.ok) {
        const data = await response.json();
        setComments(data);
      }
    } catch (error) {
      console.error("Error fetching comments:", error);
      toast.error("Не удалось загрузить комментарии");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitComment = async () => {
    const trimmed = newComment.trim();
    if (!trimmed) {
      toast.error("Введите комментарий");
      return;
    }

    setSubmitting(true);

    try {
      let userId = currentUserId;
      let guestId = getGuestUserId();

      // If not authenticated and no guest user, ask for nickname
      if (!userId && !guestId) {
        setShowGuestDialog(true);
        setSubmitting(false);
        return;
      }

      const response = await fetch(`/api/tracks/${trackId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          comment: trimmed,
          userId,
          guestId,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to post comment");
      }

      const newCommentData = await response.json();
      setComments([newCommentData, ...comments]);
      setNewComment("");
      toast.success("Комментарий добавлен");
    } catch (error) {
      console.error("Error posting comment:", error);
      toast.error(error instanceof Error ? error.message : "Ошибка при добавлении комментария");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteComment = async (commentId: number, commentUserId: number | null, commentGuestId: number | null) => {
    const guestId = getGuestUserId();
    
    // Check if user can delete
    const isOwner = (currentUserId && commentUserId === currentUserId) || 
                    (guestId && commentGuestId === guestId);
    const isAdmin = currentUserRole && ["super_admin", "admin", "moderator"].includes(currentUserRole);
    
    if (!isOwner && !isAdmin) {
      toast.error("У вас нет прав на удаление этого комментария");
      return;
    }

    setDeletingId(commentId);

    try {
      const response = await fetch(`/api/tracks/${trackId}/comments/${commentId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: currentUserId,
          guestId: guestId,
          authUser: currentUserId && currentUserRole ? { id: currentUserId, role: currentUserRole } : undefined,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete comment");
      }

      setComments(comments.filter(c => c.id !== commentId));
      toast.success("Комментарий удалён");
    } catch (error) {
      console.error("Error deleting comment:", error);
      toast.error(error instanceof Error ? error.message : "Ошибка при удалении комментария");
    } finally {
      setDeletingId(null);
    }
  };

  const handleGuestNameSubmit = async (displayName: string) => {
    try {
      const guestUser = await ensureGuestUser(displayName);
      if (guestUser) {
        setShowGuestDialog(false);
        // Retry the comment submission
        setTimeout(() => handleSubmitComment(), 100);
      } else {
        toast.error("Не удалось создать гостевого пользователя");
      }
    } catch (error) {
      toast.error("Ошибка при создании гостевого пользователя");
    }
  };

  const canDeleteComment = (comment: Comment): boolean => {
    const guestId = getGuestUserId();
    const isOwner = (currentUserId && comment.userId === currentUserId) || 
                    (guestId && comment.guestId === guestId);
    const isAdmin = currentUserRole && ["super_admin", "admin", "moderator"].includes(currentUserRole);
    return isOwner || !!isAdmin;
  };

  const getRoleBadge = (role: string | null) => {
    if (!role) return null;
    
    const roleColors: Record<string, string> = {
      super_admin: "bg-purple-500/20 text-purple-400 border-purple-500/30",
      admin: "bg-red-500/20 text-red-400 border-red-500/30",
      moderator: "bg-blue-500/20 text-blue-400 border-blue-500/30",
      evaluator: "bg-green-500/20 text-green-400 border-green-500/30",
    };

    const roleNames: Record<string, string> = {
      super_admin: "CEO",
      admin: "Администратор",
      moderator: "Модератор",
      evaluator: "Оценщик",
    };

    return (
      <span className={`text-xs px-2 py-0.5 rounded-full border ${roleColors[role] || ""}`}>
        {roleNames[role] || role}
      </span>
    );
  };

  return (
    <>
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-semibold">Комментарии ({comments.length})</h3>
        </div>

        {/* Add comment form */}
        <div className="glass-card rounded-lg p-4 space-y-3">
          <Textarea
            placeholder="Напишите комментарий..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            className="glass-card border-border resize-none"
            rows={3}
            maxLength={1000}
          />
          <div className="flex justify-between items-center">
            <span className="text-xs text-muted-foreground">
              {newComment.length}/1000
            </span>
            <Button
              onClick={handleSubmitComment}
              disabled={submitting || !newComment.trim()}
              className="bg-primary hover:bg-primary/90"
              size="sm"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Отправка...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Отправить
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Comments list */}
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : comments.length === 0 ? (
          <div className="text-center py-8">
            <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
            <p className="text-muted-foreground">Пока нет комментариев</p>
            <p className="text-sm text-muted-foreground">Будьте первым!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {comments.map((comment) => (
              <div key={comment.id} className="glass-card rounded-lg p-4">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-sm">{comment.displayName}</span>
                    {getRoleBadge(comment.role)}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {new Date(comment.createdAt).toLocaleDateString("ru-RU", {
                        day: "numeric",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                    {canDeleteComment(comment) && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteComment(comment.id, comment.userId, comment.guestId)}
                        disabled={deletingId === comment.id}
                        className="h-6 w-6 p-0 hover:bg-destructive/20 hover:text-destructive"
                      >
                        {deletingId === comment.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </Button>
                    )}
                  </div>
                </div>
                <p className="text-sm whitespace-pre-wrap break-words">{comment.comment}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      <GuestNameDialog
        open={showGuestDialog}
        onSubmit={handleGuestNameSubmit}
        onCancel={() => setShowGuestDialog(false)}
      />
    </>
  );
};
