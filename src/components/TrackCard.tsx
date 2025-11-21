"use client"

import { Track } from "@/types";
import { Music, Trash2, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import CustomAudioPlayer from "@/components/CustomAudioPlayer";
import { useState } from "react";

interface TrackCardProps {
  track: Track;
  onDelete: () => void;
  onView: (track: Track) => void;
  isAdmin: boolean;
}

export default function TrackCard({ track, onDelete, onView, isAdmin }: TrackCardProps) {
  const [isDeleting, setIsDeleting] = useState(false);

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

  const averageRating = (
    (track.vocals + track.production + track.lyrics + track.originality + track.vibe) / 5
  ).toFixed(1);

  return (
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
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onView(track)}
          className="h-8 w-8 hover:bg-primary/20 hover:text-primary transition-all duration-200"
        >
          <Eye className="h-4 w-4" />
        </Button>
        {isAdmin && (
          <Button
            variant="ghost"
            size="icon"
            onClick={handleDelete}
            disabled={isDeleting}
            className="h-8 w-8 hover:bg-destructive/20 hover:text-destructive transition-all duration-200"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}