"use client"

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Artist, Track, TrackFormData } from "@/types";
import { ArrowLeft, Loader2, Plus, Music, Mic2, Radio, FileText, Sparkles, Music as MusicIcon, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import RatingSlider from "@/components/RatingSlider";
import TrackCard from "@/components/TrackCard";
import TrackDetailDialog from "@/components/TrackDetailDialog";
import { toast } from "sonner";
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from "recharts";

export default function ArtistPage() {
  const params = useParams();
  const router = useRouter();
  const artistId = parseInt(params.id as string);

  const [artist, setArtist] = useState<Artist | null>(null);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [selectedTrack, setSelectedTrack] = useState<Track | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const [formData, setFormData] = useState<TrackFormData>({
    title: "",
    artistId,
    albumArt: "",
    audioUrl: "",
    vocals: 5,
    production: 5,
    lyrics: 5,
    originality: 5,
    vibe: 5,
    notes: "",
  });

  // Check authentication
  useEffect(() => {
    const sessionData = localStorage.getItem("music_app_session");
    if (sessionData) {
      try {
        const session = JSON.parse(sessionData);
        const now = Date.now();
        if (session.expiresAt && now < session.expiresAt) {
          setIsAuthenticated(true);
        }
      } catch (error) {
        setIsAuthenticated(false);
      }
    }
  }, []);

  const fetchArtist = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/artists/${artistId}`);
      if (!response.ok) throw new Error("Артист не найден");
      
      const data = await response.json();
      setArtist(data);
      setTracks(data.tracks || []);
    } catch (error) {
      toast.error("Ошибка загрузки артиста");
      router.push("/");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isNaN(artistId)) {
      fetchArtist();
    }
  }, [artistId]);

  const handleAudioFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.includes('audio')) {
        toast.error("Пожалуйста, выберите аудио файл");
        return;
      }
      setAudioFile(file);
      toast.success(`Файл "${file.name}" выбран`);
    }
  };

  const uploadAudioFile = async (file: File): Promise<string> => {
    // Create a data URL from the file for now
    // In production, you would upload to a cloud storage service
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        resolve(reader.result as string);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isAuthenticated) {
      toast.error("Для добавления треков необходимо войти как администратор");
      return;
    }
    
    if (!formData.title.trim()) {
      toast.error("Введите название трека");
      return;
    }

    setSubmitting(true);
    
    try {
      let audioUrl = formData.audioUrl;
      
      // Upload audio file if selected
      if (audioFile) {
        setUploading(true);
        audioUrl = await uploadAudioFile(audioFile);
        setUploading(false);
      }

      const response = await fetch("/api/tracks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          audioUrl
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Ошибка создания трека");
      }

      toast.success("Трек добавлен!");
      setFormData({
        title: "",
        artistId,
        albumArt: "",
        audioUrl: "",
        vocals: 5,
        production: 5,
        lyrics: 5,
        originality: 5,
        vibe: 5,
        notes: "",
      });
      setAudioFile(null);
      fetchArtist();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Ошибка");
    } finally {
      setSubmitting(false);
      setUploading(false);
    }
  };

  const handleViewTrack = (track: Track) => {
    setSelectedTrack(track);
    setDetailOpen(true);
  };

  const calculateOverallRating = () => {
    if (tracks.length === 0) return 0;
    
    const totalRating = tracks.reduce((sum, track) => {
      return sum + (track.vocals + track.production + track.lyrics + track.originality + track.vibe) / 5;
    }, 0);
    
    return (totalRating / tracks.length).toFixed(1);
  };

  const getRadarData = () => {
    if (tracks.length === 0) return [];

    const avgVocals = tracks.reduce((sum, t) => sum + t.vocals, 0) / tracks.length;
    const avgProduction = tracks.reduce((sum, t) => sum + t.production, 0) / tracks.length;
    const avgLyrics = tracks.reduce((sum, t) => sum + t.lyrics, 0) / tracks.length;
    const avgOriginality = tracks.reduce((sum, t) => sum + t.originality, 0) / tracks.length;
    const avgVibe = tracks.reduce((sum, t) => sum + t.vibe, 0) / tracks.length;

    return [
      { category: "Вокал", value: avgVocals, fullMark: 10 },
      { category: "Продакшн", value: avgProduction, fullMark: 10 },
      { category: "Текст", value: avgLyrics, fullMark: 10 },
      { category: "Оригинальность", value: avgOriginality, fullMark: 10 },
      { category: "Вайб", value: avgVibe, fullMark: 10 },
    ];
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!artist) return null;

  return (
    <div className="min-h-screen p-6 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <Button
          variant="ghost"
          onClick={() => router.push("/")}
          className="mb-6 glass-card"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Назад
        </Button>

        <div className="glass-card rounded-xl p-6 mb-6">
          <div className="flex items-start gap-4 mb-6">
            <div className="w-20 h-20 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center flex-shrink-0">
              {artist.imageUrl ? (
                <img
                  src={artist.imageUrl}
                  alt={artist.name}
                  className="w-full h-full object-cover rounded-lg"
                />
              ) : (
                <Music className="w-10 h-10 text-white" />
              )}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <h1 className="text-3xl md:text-4xl font-bold gradient-text">
                  {artist.name}
                </h1>
                {artist.verified === 1 && (
                  <div className="relative w-8 h-8 flex items-center justify-center">
                    <div className="absolute inset-0 bg-primary/20 rounded-full blur-md"></div>
                    <Music className="w-6 h-6 text-primary relative z-10" title="Верифицирован" />
                  </div>
                )}
              </div>
              <p className="text-muted-foreground">
                {tracks.length} {tracks.length === 1 ? "трек" : "треков"}
              </p>
            </div>
            {tracks.length > 0 && (
              <div className="text-center">
                <div className="text-sm text-muted-foreground mb-1">Средняя оценка</div>
                <div className="text-4xl font-bold gradient-text">{calculateOverallRating()}</div>
              </div>
            )}
          </div>

          {/* Radar Chart - Available for everyone */}
          {tracks.length > 0 && (
            <div className="glass-card rounded-lg p-4 mt-6">
              <h3 className="font-semibold mb-4 text-center">Средние оценки по категориям</h3>
              <ResponsiveContainer width="100%" height={300}>
                <RadarChart data={getRadarData()}>
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
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Add Track Form */}
          {isAuthenticated && (
            <div className="glass-card rounded-xl p-6">
              <h2 className="text-2xl font-semibold gradient-text mb-6 flex items-center gap-2">
                <Plus className="w-6 h-6" />
                Добавить трек
              </h2>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="title">Название трека *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Введите название"
                    className="glass-card border-border"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="albumArt">URL обложки</Label>
                  <Input
                    id="albumArt"
                    value={formData.albumArt}
                    onChange={(e) => setFormData({ ...formData, albumArt: e.target.value })}
                    placeholder="https://..."
                    className="glass-card border-border"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="audioFile">Загрузить MP3-файл</Label>
                  <div className="relative">
                    <Input
                      id="audioFile"
                      type="file"
                      accept="audio/mp3,audio/mpeg"
                      onChange={handleAudioFileChange}
                      className="glass-card border-border file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90 file:cursor-pointer"
                    />
                    {audioFile && (
                      <p className="text-xs text-primary mt-2 flex items-center gap-2">
                        <Upload className="w-3 h-3" />
                        {audioFile.name}
                      </p>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">Выберите MP3-файл с вашего устройства</p>
                </div>

                <div className="space-y-4">
                  <h3 className="font-semibold">Оценки (0-10)</h3>
                  
                  <RatingSlider
                    label="Вокал"
                    value={formData.vocals}
                    onChange={(value) => setFormData({ ...formData, vocals: value })}
                    icon={<Mic2 className="w-4 h-4" />}
                  />
                  
                  <RatingSlider
                    label="Продакшн"
                    value={formData.production}
                    onChange={(value) => setFormData({ ...formData, production: value })}
                    icon={<Radio className="w-4 h-4" />}
                  />
                  
                  <RatingSlider
                    label="Текст"
                    value={formData.lyrics}
                    onChange={(value) => setFormData({ ...formData, lyrics: value })}
                    icon={<FileText className="w-4 h-4" />}
                  />
                  
                  <RatingSlider
                    label="Оригинальность"
                    value={formData.originality}
                    onChange={(value) => setFormData({ ...formData, originality: value })}
                    icon={<Sparkles className="w-4 h-4" />}
                  />
                  
                  <RatingSlider
                    label="Вайб"
                    value={formData.vibe}
                    onChange={(value) => setFormData({ ...formData, vibe: value })}
                    icon={<MusicIcon className="w-4 h-4" />}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Заметки</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Дополнительные комментарии..."
                    className="glass-card border-border min-h-[100px]"
                  />
                </div>

                <Button 
                  type="submit" 
                  disabled={submitting || uploading} 
                  className="w-full bg-primary hover:bg-primary/90 glow-purple"
                >
                  {submitting || uploading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      {uploading ? "Загрузка..." : "Добавление..."}
                    </>
                  ) : (
                    <>
                      <Plus className="mr-2 h-4 w-4" />
                      Добавить трек
                    </>
                  )}
                </Button>
              </form>
            </div>
          )}

          {/* Tracks List */}
          <div className={!isAuthenticated ? "lg:col-span-2" : ""}>
            <h2 className="text-2xl font-semibold gradient-text mb-6">
              Треки ({tracks.length})
            </h2>
            
            {tracks.length === 0 ? (
              <div className="glass-card rounded-xl p-12 text-center">
                <Music className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">Нет треков</h3>
                <p className="text-muted-foreground">
                  {isAuthenticated 
                    ? "Добавьте первый трек для оценки"
                    : "У этого артиста пока нет треков"}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {tracks.map((track) => (
                  <TrackCard
                    key={track.id}
                    track={track}
                    onDelete={fetchArtist}
                    onView={handleViewTrack}
                    isAdmin={isAuthenticated}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <TrackDetailDialog
        track={selectedTrack}
        open={detailOpen}
        onOpenChange={setDetailOpen}
      />
    </div>
  );
}