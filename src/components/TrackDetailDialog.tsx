"use client"

import { Track } from "@/types";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Mic2, Radio, FileText, Sparkles, Music } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from "recharts";

interface TrackDetailDialogProps {
  track: Track | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function TrackDetailDialog({ track, open, onOpenChange }: TrackDetailDialogProps) {
  if (!track) return null;

  const averageRating = (
    (track.vocals + track.production + track.lyrics + track.originality + track.vibe) / 5
  ).toFixed(1);

  const ratings = [
    { category: "Вокал", value: track.vocals, icon: <Mic2 className="w-4 h-4" /> },
    { category: "Продакшн", value: track.production, icon: <Radio className="w-4 h-4" /> },
    { category: "Текст", value: track.lyrics, icon: <FileText className="w-4 h-4" /> },
    { category: "Оригинальность", value: track.originality, icon: <Sparkles className="w-4 h-4" /> },
    { category: "Вайб", value: track.vibe, icon: <Music className="w-4 h-4" /> },
  ];

  const radarData = ratings.map(r => ({
    category: r.category,
    value: r.value,
    fullMark: 10,
  }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-card border-border max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="gradient-text text-2xl">{track.title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Average Rating */}
          <div className="glass-card rounded-lg p-6 text-center">
            <div className="text-sm text-muted-foreground mb-2">Общая оценка</div>
            <div className="text-5xl font-bold gradient-text mb-2">{averageRating}</div>
            <div className="text-muted-foreground">из 10</div>
          </div>

          {/* Radar Chart */}
          <div className="glass-card rounded-lg p-4">
            <h3 className="font-semibold mb-4 text-center">Визуализация оценок</h3>
            <ResponsiveContainer width="100%" height={300}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="rgba(147, 51, 234, 0.3)" />
                <PolarAngleAxis 
                  dataKey="category" 
                  tick={{ fill: '#a0a0a0', fontSize: 12 }}
                />
                <PolarRadiusAxis 
                  angle={90} 
                  domain={[0, 10]} 
                  tick={{ fill: '#a0a0a0' }}
                />
                <Radar
                  name="Rating"
                  dataKey="value"
                  stroke="#9333ea"
                  fill="#9333ea"
                  fillOpacity={0.6}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>

          {/* Detailed Ratings */}
          <div className="space-y-4">
            <h3 className="font-semibold">Детальные оценки</h3>
            {ratings.map((rating) => (
              <div key={rating.category} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {rating.icon}
                    <span className="text-sm">{rating.category}</span>
                  </div>
                  <span className="font-semibold text-primary">{rating.value}/10</span>
                </div>
                <Progress value={rating.value * 10} className="h-2" />
              </div>
            ))}
          </div>

          {/* Notes */}
          {track.notes && (
            <div className="glass-card rounded-lg p-4">
              <h3 className="font-semibold mb-2">Заметки</h3>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">{track.notes}</p>
            </div>
          )}

          {/* Metadata */}
          <div className="text-xs text-muted-foreground text-center">
            Добавлено: {new Date(track.createdAt).toLocaleDateString('ru-RU', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
