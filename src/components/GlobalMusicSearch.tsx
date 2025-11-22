"use client"

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Loader2, Music, ExternalLink, Plus, Music2, User } from "lucide-react";
import { toast } from "sonner";
import { UnifiedTrack } from "@/lib/music-api/types";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Artist } from "@/types";

interface GlobalMusicSearchProps {
  onTrackAdded: () => void;
}

export default function GlobalMusicSearch({ onTrackAdded }: GlobalMusicSearchProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<{ platform: string; tracks: UnifiedTrack[] }[]>([]);
  const [importing, setImporting] = useState<string | null>(null);
  const [artists, setArtists] = useState<Artist[]>([]);
  const [selectedArtistId, setSelectedArtistId] = useState<string>("");
  const [loadingArtists, setLoadingArtists] = useState(false);

  useEffect(() => {
    if (open) {
      fetchArtists();
    }
  }, [open]);

  const fetchArtists = async () => {
    setLoadingArtists(true);
    try {
      const response = await fetch("/api/artists");
      if (response.ok) {
        const data = await response.json();
        setArtists(data);
      }
    } catch (error) {
      console.error("Error fetching artists:", error);
    } finally {
      setLoadingArtists(false);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!searchQuery.trim() || searchQuery.length < 2) {
      toast.error("Введите минимум 2 символа для поиска");
      return;
    }

    setLoading(true);
    setResults([]);
    
    try {
      const response = await fetch(`/api/music/search?q=${encodeURIComponent(searchQuery)}&platforms=spotify,soundcloud&limit=10`);
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Ошибка поиска");
      }

      const data = await response.json();
      setResults(data.results || []);
      
      if (data.results.length === 0 || data.results.every((r: any) => r.tracks.length === 0)) {
        toast.info("Треки не найдены. Попробуйте другой запрос.");
      }
    } catch (error) {
      console.error("Search error:", error);
      toast.error(error instanceof Error ? error.message : "Ошибка поиска");
    } finally {
      setLoading(false);
    }
  };

  const handleImportTrack = async (track: UnifiedTrack) => {
    if (!selectedArtistId) {
      toast.error("Пожалуйста, выберите артиста");
      return;
    }

    setImporting(track.id);
    
    try {
      const response = await fetch("/api/tracks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: track.title,
          artistId: parseInt(selectedArtistId),
          albumArt: track.artworkUrl || null,
          audioUrl: track.previewUrl || track.streamUrl || null,
          vocals: 5,
          production: 5,
          lyrics: 5,
          originality: 5,
          vibe: 5,
          notes: `Импортировано из ${track.platform.toUpperCase()}${track.externalUrl ? `\nСсылка: ${track.externalUrl}` : ''}`,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Ошибка импорта трека");
      }

      toast.success(`Трек "${track.title}" успешно импортирован!`);
      onTrackAdded();
      setOpen(false);
      setSearchQuery("");
      setResults([]);
      setSelectedArtistId("");
    } catch (error) {
      console.error("Import error:", error);
      toast.error(error instanceof Error ? error.message : "Ошибка импорта");
    } finally {
      setImporting(null);
    }
  };

  const getPlatformName = (platform: string) => {
    const names: Record<string, string> = {
      spotify: 'Spotify',
      soundcloud: 'SoundCloud',
      vk: 'VKontakte',
      yandex: 'Яндекс.Музыка',
    };
    return names[platform] || platform;
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="glass-card border-border hover:border-primary/50">
          <Music2 className="mr-2 h-4 w-4" />
          Поиск по площадкам
        </Button>
      </DialogTrigger>
      <DialogContent className="glass-card border-border max-w-3xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="gradient-text text-2xl">Поиск треков по площадкам</DialogTitle>
          <p className="text-sm text-muted-foreground">Найдите треки на Spotify, SoundCloud и других платформах</p>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Artist Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Выберите артиста для импорта</label>
            <Select value={selectedArtistId} onValueChange={setSelectedArtistId}>
              <SelectTrigger className="glass-card border-border">
                <SelectValue placeholder={loadingArtists ? "Загрузка..." : "Выберите артиста"} />
              </SelectTrigger>
              <SelectContent className="glass-card border-border">
                {artists.map((artist) => (
                  <SelectItem key={artist.id} value={artist.id.toString()}>
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4" />
                      {artist.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Search Form */}
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Название трека или исполнителя..."
                  className="pl-10 glass-card border-border"
                />
              </div>
              <Button type="submit" disabled={loading} className="bg-primary hover:bg-primary/90">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              </Button>
            </div>
          </form>
        </div>

        <div className="flex-1 overflow-y-auto space-y-4 pr-2">
          {results.map((result) => (
            <div key={result.platform}>
              {result.tracks.length > 0 && (
                <>
                  <div className="flex items-center gap-2 mb-3">
                    <Music className="w-4 h-4 text-primary" />
                    <h3 className="font-semibold text-sm">{getPlatformName(result.platform)}</h3>
                    <span className="text-xs text-muted-foreground">({result.tracks.length} треков)</span>
                  </div>
                  
                  <div className="space-y-2">
                    {result.tracks.map((track) => (
                      <div
                        key={track.id}
                        className="glass-card rounded-lg p-3 flex items-center gap-3 hover:bg-secondary/20 transition-colors"
                      >
                        {track.artworkUrl ? (
                          <img
                            src={track.artworkUrl}
                            alt={track.title}
                            className="w-12 h-12 rounded object-cover flex-shrink-0"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded bg-gradient-to-br from-primary to-accent flex items-center justify-center flex-shrink-0">
                            <Music className="w-6 h-6 text-white" />
                          </div>
                        )}
                        
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium truncate">{track.title}</h4>
                          <p className="text-sm text-muted-foreground truncate">{track.artist}</p>
                          {track.album && (
                            <p className="text-xs text-muted-foreground truncate">{track.album}</p>
                          )}
                        </div>

                        <div className="flex items-center gap-2 flex-shrink-0">
                          {track.duration > 0 && (
                            <span className="text-xs text-muted-foreground">
                              {formatDuration(track.duration)}
                            </span>
                          )}
                          
                          {track.externalUrl && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => window.open(track.externalUrl, '_blank')}
                              className="h-8 w-8 p-0"
                            >
                              <ExternalLink className="h-3 w-3" />
                            </Button>
                          )}
                          
                          <Button
                            size="sm"
                            onClick={() => handleImportTrack(track)}
                            disabled={importing === track.id || !selectedArtistId}
                            className="bg-primary hover:bg-primary/90"
                          >
                            {importing === track.id ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <>
                                <Plus className="h-3 w-3 mr-1" />
                                Импорт
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          ))}
          
          {!loading && results.length === 0 && searchQuery && (
            <div className="text-center py-12">
              <Music className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">Введите запрос и нажмите поиск</p>
            </div>
          )}
        </div>

        <div className="text-xs text-muted-foreground text-center pt-2 border-t border-border">
          <p>💡 Сначала выберите артиста, затем найдите и импортируйте треки</p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
