"use client"

import { Track } from "@/types";
import { Music, Trash2, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface TrackCardProps {
  track: Track;
  onDelete: () => void;
  onView: (track: Track) => void;
}

export default function TrackCard({ track, onDelete, onView }: TrackCardProps) {
  const handleDelete = async () => {
    if (!confirm(`Удалить трек "${track.title}"?`)) return;

    try {
      const response = await fetch(`/api/tracks/${track.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Ошибка удаления");
      }

      toast.success("Трек удален");
      onDelete();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Ошибка");
    }
  };

  const averageRating = (
    (track.vocals + track.production + track.lyrics + track.originality + track.vibe) / 5
  ).toFixed(1);

  return (
    <div className="glass-card glass-card-hover rounded-xl p-4 relative group">
      <div className="flex items-start gap-4">
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
      <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onView(track)}
          className="h-8 w-8 hover:bg-primary/20 hover:text-primary"
        >
          <Eye className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleDelete}
          className="h-8 w-8 hover:bg-destructive/20 hover:text-destructive"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
