"use client"

import { Track, TrackRating } from "@/types";
import { Music, Trash2, Eye, Pencil, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import CustomAudioPlayer from "@/components/CustomAudioPlayer";
import EditTrackDialog from "@/components/EditTrackDialog";
import { useState, useEffect } from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface TrackCardProps {
  track: Track;
  onDelete: () => void;
  onView: (track: Track) => void;
  isAdmin: boolean;
}

export default function TrackCard({ track, onDelete, onView, isAdmin }: TrackCardProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [ratings, setRatings] = useState<TrackRating[]>([]);
  const [loadingRatings, setLoadingRatings] = useState(false);
  const [ratingsOpen, setRatingsOpen] = useState(false);

  const fetchRatings = async () => {
    if (ratings.length > 0) return; // Already loaded
    
    setLoadingRatings(true);
    try {
      const response = await fetch(`/api/tracks/${track.id}/ratings`);
      if (response.ok) {
        const data = await response.json();
        setRatings(data);
      }
    } catch (error) {
      console.error("Error fetching ratings:", error);
    } finally {
      setLoadingRatings(false);
    }
  };

  const handleRatingsOpen = (open: boolean) => {
    setRatingsOpen(open);
    if (open && ratings.length === 0) {
      fetchRatings();
    }
  };

  const handleDelete = async () => {
    if (!confirm(`Удалить трек "${track.title}"?`)) return;

    setIsDeleting(true);
    
    // Wait for animation before deleting
    setTimeout(async () => {
      try {
        const response = await fetch(`/api/tracks/${track.id}`, {
          method: "DELETE",
        });

        if (!response.ok) {
          let errorMessage = "Ошибка удаления";
          try {
            const error = await response.json();
            errorMessage = error.error || errorMessage;
          } catch {
            errorMessage = `Ошибка сервера: ${response.status}`;
          }
          throw new Error(errorMessage);
        }

        toast.success("Трек удален");
        onDelete();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Ошибка");
        setIsDeleting(false);
      }
    }, 300);
  };

  const handleEdit = () => {
    setEditOpen(true);
  };

  const averageRating = (
    (track.vocals + track.production + track.lyrics + track.quality + track.vibe) / 5
  ).toFixed(1);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getRatingAverage = (rating: TrackRating) => {
    return ((rating.vocals + rating.production + rating.lyrics + rating.quality + rating.vibe) / 5).toFixed(1);
  };

  return (
    <>
      <div 
        className={`glass-card glass-card-hover rounded-xl p-4 relative group transition-all duration-300 ${
          isDeleting ? 'opacity-0 scale-95 translate-x-4' : 'opacity-100 scale-100 translate-x-0'
        }`}
      >
        <div className="flex items-start gap-4 mb-3">
          <div className="w-14 h-14 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center flex-shrink-0">
            {track.albumArt ? (
              <img
                src={track.albumArt}
                alt={track.title}
                className="w-full h-full object-cover rounded-lg"
              />
            ) : (
              <Music className="w-7 h-7 text-white" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold truncate mb-1">{track.title}</h4>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span className="text-xl font-bold text-primary">{averageRating}</span>
              <span>/</span>
              <span>10</span>
            </div>
          </div>
        </div>
        
        {track.audioUrl && (
          <div className="mt-3">
            <CustomAudioPlayer src={track.audioUrl} title={track.title} />
          </div>
        )}
        
        <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Popover open={ratingsOpen} onOpenChange={handleRatingsOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 hover:bg-accent/20 hover:text-accent transition-all duration-200"
              >
                <Users className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="glass-card border-border w-80 max-h-96 overflow-y-auto">
              <div className="space-y-3">
                <h4 className="font-semibold text-sm flex items-center gap-2">
                  <Users className="w-4 h-4 text-primary" />
                  Оценки трека
                </h4>
                
                {loadingRatings ? (
                  <div className="text-center py-4 text-sm text-muted-foreground">
                    Загрузка...
                  </div>
                ) : ratings.length === 0 ? (
                  <div className="text-center py-4 text-sm text-muted-foreground">
                    Трек еще не оценен
                  </div>
                ) : (
                  <div className="space-y-2">
                    {ratings.map((rating) => (
                      <div key={rating.id} className="glass-card rounded-lg p-3 space-y-2">
                        <div className="flex items-center gap-2">
                          {rating.avatarUrl ? (
                            <img
                              src={rating.avatarUrl}
                              alt={rating.displayName || rating.username}
                              className="w-8 h-8 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                              <span className="text-white text-xs font-bold">
                                {(rating.displayName || rating.username).charAt(0).toUpperCase()}
                              </span>
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">
                              {rating.displayName || rating.username}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {formatDate(rating.createdAt)}
                            </p>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-bold text-primary">
                              {getRatingAverage(rating)}
                            </div>
                          </div>
                        </div>
                        
                        {rating.notes && (
                          <p className="text-xs text-muted-foreground border-t border-border pt-2 mt-2">
                            {rating.notes}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </PopoverContent>
          </Popover>
          
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onView(track)}
            className="h-8 w-8 hover:bg-primary/20 hover:text-primary transition-all duration-200"
          >
            <Eye className="h-4 w-4" />
          </Button>
          {isAdmin && (
            <>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleEdit}
                className="h-8 w-8 hover:bg-accent/20 hover:text-accent transition-all duration-200"
              >
                <Pencil className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleDelete}
                disabled={isDeleting}
                className="h-8 w-8 hover:bg-destructive/20 hover:text-destructive transition-all duration-200"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>
      </div>

      <EditTrackDialog
        track={track}
        open={editOpen}
        onOpenChange={setEditOpen}
        onSuccess={onDelete}
      />
    </>
  );
}