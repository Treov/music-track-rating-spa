"use client"

import { Artist } from "@/types";
import { Music, Trash2 } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useState } from "react";

interface ArtistCardProps {
  artist: Artist;
  onDelete: () => void;
  onVerify: () => void;
  isAdmin: boolean;
}

export default function ArtistCard({ artist, onDelete, onVerify, isAdmin }: ArtistCardProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!confirm(`Удалить артиста ${artist.name}?`)) return;

    setIsDeleting(true);
    
    // Wait for animation before deleting
    setTimeout(async () => {
      try {
        const response = await fetch(`/api/artists/${artist.id}`, {
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

        toast.success("Артист удален");
        onDelete();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Ошибка");
        setIsDeleting(false);
      }
    }, 300);
  };

  const handleVerify = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    try {
      const response = await fetch(`/api/artists/${artist.id}/verify`, {
        method: "PATCH",
      });

      if (!response.ok) {
        let errorMessage = "Ошибка верификации";
        try {
          const error = await response.json();
          errorMessage = error.error || errorMessage;
        } catch {
          errorMessage = `Ошибка сервера: ${response.status}`;
        }
        throw new Error(errorMessage);
      }

      const updated = await response.json();
      toast.success(updated.verified === 1 ? "Артист верифицирован ✓" : "Верификация снята");
      onVerify();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Ошибка");
    }
  };

  const getTracksText = (count: number) => {
    if (count === 0) return "треков";
    if (count === 1) return "трек";
    if (count >= 2 && count <= 4) return "трека";
    return "треков";
  };

  return (
    <div 
      className={`glass-card glass-card-hover rounded-xl p-6 relative group transition-all duration-300 ${
        isDeleting ? 'opacity-0 scale-95 -translate-y-4' : 'opacity-100 scale-100 translate-y-0'
      }`}
    >
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
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-lg truncate">{artist.name}</h3>
              {artist.verified === 1 && (
                <div className="relative w-5 h-5 flex items-center justify-center flex-shrink-0">
                  <div className="absolute inset-0 bg-primary/20 rounded-full blur-sm"></div>
                  <Music className="w-4 h-4 text-primary relative z-10" title="Верифицирован" />
                </div>
              )}
            </div>
            <p className="text-muted-foreground text-sm">
              {artist.trackCount || 0} {getTracksText(artist.trackCount || 0)}
            </p>
          </div>
        </div>
      </Link>
      
      {/* Admin Controls */}
      {isAdmin && (
        <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleVerify}
            className="hover:bg-primary/20 hover:text-primary transition-all duration-200"
            title={artist.verified === 1 ? "Снять верификацию" : "Верифицировать"}
          >
            <Music className={`h-4 w-4 ${artist.verified === 1 ? 'text-primary' : ''}`} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleDelete}
            disabled={isDeleting}
            className="hover:bg-destructive/20 hover:text-destructive transition-all duration-200"
            title="Удалить"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}