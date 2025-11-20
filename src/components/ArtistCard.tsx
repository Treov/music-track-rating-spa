"use client"

import { Artist } from "@/types";
import { Music, Trash2 } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface ArtistCardProps {
  artist: Artist;
  onDelete: () => void;
}

export default function ArtistCard({ artist, onDelete }: ArtistCardProps) {
  const handleDelete = async () => {
    if (!confirm(`Удалить артиста ${artist.name}?`)) return;

    try {
      const response = await fetch(`/api/artists/${artist.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Ошибка удаления");
      }

      toast.success("Артист удален");
      onDelete();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Ошибка");
    }
  };

  return (
    <div className="glass-card glass-card-hover rounded-xl p-6 relative group">
      <Link href={`/artist/${artist.id}`} className="block">
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center flex-shrink-0">
            {artist.imageUrl ? (
              <img
                src={artist.imageUrl}
                alt={artist.name}
                className="w-full h-full object-cover rounded-lg"
              />
            ) : (
              <Music className="w-8 h-8 text-white" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-lg truncate mb-1">{artist.name}</h3>
            <p className="text-muted-foreground text-sm">
              {artist.trackCount || 0} треков
            </p>
          </div>
        </div>
      </Link>
      <Button
        variant="ghost"
        size="icon"
        onClick={handleDelete}
        className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive/20 hover:text-destructive"
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
}
