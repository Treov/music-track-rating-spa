"use client"

import { useState } from "react";
import { Track } from "@/types";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Mic2, Radio, FileText, Sparkles, Music, Loader2 } from "lucide-react";
import RatingSlider from "./RatingSlider";
import { toast } from "sonner";

interface TrackRatingDialogProps {
  track: Track | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
}

export default function TrackRatingDialog({ track, open, onOpenChange, onSaved }: TrackRatingDialogProps) {
  const [ratings, setRatings] = useState({
    vocals: track?.vocals || 5,
    production: track?.production || 5,
    lyrics: track?.lyrics || 5,
    originality: track?.originality || 5,
    vibe: track?.vibe || 5,
  });
  const [notes, setNotes] = useState(track?.notes || "");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!track) return;

    setSaving(true);
    try {
      const response = await fetch(`/api/tracks/${track.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...ratings,
          notes,
        }),
      });

      if (!response.ok) {
        throw new Error("Ошибка сохранения");
      }

      toast.success("Оценки сохранены!");
      onSaved();
      onOpenChange(false);
    } catch (error) {
      toast.error("Ошибка сохранения оценок");
    } finally {
      setSaving(false);
    }
  };

  if (!track) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-card border-border max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="gradient-text text-2xl">Оценка трека</DialogTitle>
          <p className="text-sm text-muted-foreground">{track.title}</p>
        </DialogHeader>

        <div className="space-y-6">
          {/* Album Art */}
          {track.albumArt && (
            <div className="flex justify-center">
              <img
                src={track.albumArt}
                alt={track.title}
                className="w-32 h-32 rounded-lg object-cover"
              />
            </div>
          )}

          {/* Rating Sliders */}
          <div className="space-y-4">
            <RatingSlider
              label="Вокал"
              value={ratings.vocals}
              onChange={(value) => setRatings({ ...ratings, vocals: value })}
              icon={<Mic2 className="w-4 h-4 text-primary" />}
            />
            <RatingSlider
              label="Продакшн"
              value={ratings.production}
              onChange={(value) => setRatings({ ...ratings, production: value })}
              icon={<Radio className="w-4 h-4 text-primary" />}
            />
            <RatingSlider
              label="Текст"
              value={ratings.lyrics}
              onChange={(value) => setRatings({ ...ratings, lyrics: value })}
              icon={<FileText className="w-4 h-4 text-primary" />}
            />
            <RatingSlider
              label="Оригинальность"
              value={ratings.originality}
              onChange={(value) => setRatings({ ...ratings, originality: value })}
              icon={<Sparkles className="w-4 h-4 text-primary" />}
            />
            <RatingSlider
              label="Вайб"
              value={ratings.vibe}
              onChange={(value) => setRatings({ ...ratings, vibe: value })}
              icon={<Music className="w-4 h-4 text-primary" />}
            />
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Заметки</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Добавьте заметки о треке..."
              className="glass-card border-border min-h-[100px]"
            />
          </div>

          {/* Average Rating Display */}
          <div className="glass-card rounded-lg p-4 text-center">
            <div className="text-sm text-muted-foreground mb-1">Средняя оценка</div>
            <div className="text-3xl font-bold gradient-text">
              {((ratings.vocals + ratings.production + ratings.lyrics + ratings.originality + ratings.vibe) / 5).toFixed(1)}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={saving}
              className="glass-card"
            >
              Отмена
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving}
              className="bg-primary hover:bg-primary/90"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Сохранить"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
