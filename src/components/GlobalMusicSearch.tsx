"use client"

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Loader2, Music, ExternalLink, Plus, Music2 } from "lucide-react";
import { toast } from "sonner";
import { UnifiedTrack } from "@/lib/music-api/types";
import TrackRatingDialog from "./TrackRatingDialog";
import { Track } from "@/types";

interface UserData {
  id: number;
  username: string;
  displayName: string | null;
  role: string;
  permissions?: {
    canAddArtists: boolean;
  };
}

interface GlobalMusicSearchProps {
  onTrackAdded: () => void;
  currentUser: UserData;
}

export default function GlobalMusicSearch({ onTrackAdded, currentUser }: GlobalMusicSearchProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<{ platform: string; tracks: UnifiedTrack[] }[]>([]);
  const [importing, setImporting] = useState<string | null>(null);
  const [selectedTrack, setSelectedTrack] = useState<Track | null>(null);
  const [ratingDialogOpen, setRatingDialogOpen] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!searchQuery.trim() || searchQuery.length < 2) {
      toast.error("Введите минимум 2 символа для поиска");
      return;
    }

    setLoading(true);
    setResults([]);
    
    try {
      const response = await fetch(`/api/music/search?q=${encodeURIComponent(searchQuery)}&platforms=spotify,soundcloud,yandex&limit=10`);
      
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

  const handleYandexSearch = () => {
    if (!searchQuery.trim()) {
      toast.error("Введите запрос для поиска");
      return;
    }
    
    const searchUrl = `https://music.yandex.ru/search?text=${encodeURIComponent(searchQuery)}`;
    
    // Check if we're in iframe
    const isInIframe = window.self !== window.top;
    if (isInIframe) {
      // Post message to parent to open in new tab
      window.parent.postMessage({ type: "OPEN_EXTERNAL_URL", data: { url: searchUrl } }, "*");
    } else {
      window.open(searchUrl, '_blank', 'noopener,noreferrer');
    }
    
    toast.success("Открываю Яндекс Музыку...");
  };

  const handleImportTrack = async (track: UnifiedTrack) => {
    setImporting(track.id);
    
    try {
      // Step 1: Check if artist exists
      const artistsResponse = await fetch(`/api/artists?search=${encodeURIComponent(track.artist)}`);
      let artistId: number;
      
      if (artistsResponse.ok) {
        const artists = await artistsResponse.json();
        const existingArtist = artists.find(
          (a: any) => a.name.toLowerCase() === track.artist.toLowerCase()
        );
        
        if (existingArtist) {
          artistId = existingArtist.id;
        } else {
          // Create new artist
          const createArtistResponse = await fetch("/api/artists", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              name: track.artist,
              imageUrl: track.artworkUrl || null,
            }),
          });
          
          if (!createArtistResponse.ok) {
            throw new Error("Ошибка создания артиста");
          }
          
          const newArtist = await createArtistResponse.json();
          artistId = newArtist.id;
        }
      } else {
        throw new Error("Ошибка проверки артиста");
      }

      // Step 2: Create track
      const response = await fetch("/api/tracks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: track.title,
          artistId,
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

      const createdTrack = await response.json();
      
      // Step 3: Open rating dialog
      setSelectedTrack(createdTrack);
      setOpen(false);
      setRatingDialogOpen(true);
      
      toast.success(`Трек "${track.title}" добавлен! Теперь оцените его.`);
    } catch (error) {
      console.error("Import error:", error);
      toast.error(error instanceof Error ? error.message : "Ошибка импорта");
    } finally {
      setImporting(null);
    }
  };

  const handleRatingDialogClose = () => {
    setRatingDialogOpen(false);
    setSelectedTrack(null);
    setSearchQuery("");
    setResults([]);
    onTrackAdded();
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

  const getPlatformIcon = (platform: string) => {
    // SVG icons for platforms
    const icons: Record<string, JSX.Element> = {
      spotify: (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
        </svg>
      ),
      soundcloud: (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M1.175 12.225c-.051 0-.094.046-.101.1l-.233 2.154.233 2.105c.007.058.05.098.101.098.05 0 .09-.04.099-.098l.255-2.105-.27-2.154c0-.057-.045-.1-.09-.1m-.899.828c-.051 0-.091.043-.101.098l-.18 1.326.18 1.223c.01.051.05.09.101.09.051 0 .09-.043.099-.09l.209-1.223-.209-1.326c0-.051-.045-.098-.09-.098m1.83-1.229c-.06 0-.113.051-.113.112l-.21 2.563.21 2.458c0 .06.05.113.112.113.06 0 .111-.051.111-.113l.245-2.458-.245-2.563c0-.06-.05-.112-.111-.112m.931-.371c-.07 0-.132.06-.132.132l-.184 2.934.184 2.794c0 .07.06.132.132.132.07 0 .132-.06.132-.132l.207-2.794-.207-2.934c0-.07-.06-.132-.132-.132m.964-.349c-.08 0-.146.066-.146.146l-.167 3.283.167 3.154c0 .08.066.145.146.145.08 0 .145-.066.145-.145l.189-3.154-.189-3.283c0-.08-.066-.146-.145-.146m.984-.354c-.09 0-.162.073-.162.162l-.15 3.637.15 3.486c0 .09.073.162.162.162.09 0 .163-.073.163-.162l.17-3.486-.17-3.637c0-.09-.073-.162-.163-.162m1 .023c-.1 0-.177.079-.177.179l-.133 3.614.133 3.378c0 .1.078.179.177.179.1 0 .178-.079.178-.179l.15-3.378-.15-3.614c0-.1-.078-.179-.178-.179m.969-.088c-.11 0-.195.087-.195.196l-.115 3.702.115 3.28c0 .11.087.196.195.196.11 0 .195-.087.195-.196l.13-3.28-.13-3.702c0-.11-.087-.196-.195-.196m1 .129c-.12 0-.214.095-.214.214l-.1 3.573.1 3.185c0 .12.095.214.214.214.12 0 .214-.095.214-.214l.112-3.185-.112-3.573c0-.12-.095-.214-.214-.214m.961-.016c-.13 0-.232.103-.232.232l-.082 3.589.082 3.122c0 .13.103.232.232.232.13 0 .232-.103.232-.232l.093-3.122-.093-3.589c0-.13-.103-.232-.232-.232m1 .025c-.14 0-.25.11-.25.25l-.066 3.564.066 3.054c0 .14.11.25.25.25.14 0 .25-.11.25-.25l.074-3.054-.074-3.564c0-.14-.11-.25-.25-.25m.962-.065c-.15 0-.268.119-.268.268l-.047 3.629.047 2.998c0 .15.119.268.268.268.15 0 .268-.119.268-.268l.054-2.998-.054-3.629c0-.15-.119-.268-.268-.268m1.006.025c-.16 0-.285.126-.285.285l-.031 3.604.031 2.944c0 .16.126.285.285.285.16 0 .286-.126.286-.285l.035-2.944-.035-3.604c0-.16-.126-.285-.286-.285m.954-.079c-.17 0-.303.135-.303.303l-.014 3.683.014 2.888c0 .17.135.303.303.303.17 0 .303-.135.303-.303l.016-2.888-.016-3.683c0-.17-.135-.303-.303-.303m1.007 0c-.18 0-.322.142-.322.322v6.571c0 .18.142.322.322.322.18 0 .322-.142.322-.322v-6.571c0-.18-.142-.322-.322-.322m.968.014c-.19 0-.34.15-.34.34v6.543c0 .19.15.34.34.34.19 0 .34-.15.34-.34v-6.543c0-.19-.15-.34-.34-.34m1.006.017c-.2 0-.36.16-.36.36v6.509c0 .2.16.36.36.36.2 0 .36-.16.36-.36v-6.509c0-.2-.16-.36-.36-.36m.961.005c-.21 0-.376.167-.376.376v6.499c0 .21.167.376.376.376.21 0 .376-.167.376-.376v-6.499c0-.21-.167-.376-.376-.376m1.012.02c-.22 0-.392.173-.392.393v6.459c0 .22.173.393.392.393.22 0 .393-.173.393-.393v-6.459c0-.22-.173-.393-.393-.393m.954-.012c-.23 0-.41.182-.41.41v6.483c0 .23.182.41.41.41.23 0 .41-.182.41-.41v-6.483c0-.23-.182-.41-.41-.41m1.011-.009c-.24 0-.428.189-.428.428v6.501c0 .24.189.428.428.428.24 0 .428-.189.428-.428v-6.501c0-.24-.189-.428-.428-.428z"/>
        </svg>
      ),
      yandex: (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.6 0 12 0zm3.4 18.5h-2.7l-3.9-7.1c-.3-.5-.5-.9-.5-1.3 0-1 .7-1.7 1.8-1.7h1.3V6.2H9.1c-2.7 0-4.4 1.7-4.4 4.2 0 1.1.3 2.1 1.1 3.3l3.4 5.8h-2.8v2h9v-2.9h-.1l-3.2-5.8h3.4v5.8h2.7V6.2h-2.7v12.3z"/>
        </svg>
      ),
    };
    return icons[platform] || <Music className="w-5 h-5" />;
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <>
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
            <p className="text-sm text-muted-foreground">Найдите треки на Spotify, SoundCloud, Яндекс Музыке и других платформах</p>
          </DialogHeader>
          
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
              <Button 
                type="button"
                onClick={handleYandexSearch}
                disabled={!searchQuery.trim()}
                className="bg-red-600 hover:bg-red-700 text-white"
                title="Искать на Яндекс Музыке"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.6 0 12 0zm3.4 18.5h-2.7l-3.9-7.1c-.3-.5-.5-.9-.5-1.3 0-1 .7-1.7 1.8-1.7h1.3V6.2H9.1c-2.7 0-4.4 1.7-4.4 4.2 0 1.1.3 2.1 1.1 3.3l3.4 5.8h-2.8v2h9v-2.9h-.1l-3.2-5.8h3.4v5.8h2.7V6.2h-2.7v12.3z"/>
                </svg>
              </Button>
            </div>
          </form>

          <div className="flex-1 overflow-y-auto space-y-4 pr-2">
            {results.map((result) => (
              <div key={result.platform}>
                {result.tracks.length > 0 && (
                  <>
                    <div className="flex items-center gap-2 mb-3">
                      <div className="text-primary">
                        {getPlatformIcon(result.platform)}
                      </div>
                      <h3 className="font-semibold text-sm">{getPlatformName(result.platform)}</h3>
                      <span className="text-xs text-muted-foreground">({result.tracks.length} треков)</span>
                    </div>
                    
                    <div className="space-y-2">
                      {result.tracks.map((track) => (
                        <div
                          key={track.id}
                          className="glass-card rounded-lg p-3 flex items-center gap-3 hover:bg-secondary/20 transition-colors"
                        >
                          <div className="relative flex-shrink-0">
                            {track.artworkUrl ? (
                              <img
                                src={track.artworkUrl}
                                alt={track.title}
                                className="w-12 h-12 rounded object-cover"
                              />
                            ) : (
                              <div className="w-12 h-12 rounded bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                                <Music className="w-6 h-6 text-white" />
                              </div>
                            )}
                            {/* Platform Icon Badge */}
                            <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-background rounded-full flex items-center justify-center border border-border">
                              <div className="text-primary scale-75">
                                {getPlatformIcon(track.platform)}
                              </div>
                            </div>
                          </div>
                          
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
                              disabled={importing === track.id}
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
            
            {!loading && results.length === 0 && (
              <div className="text-center py-12">
                <Music className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">Введите запрос и нажмите поиск</p>
                <p className="text-xs text-muted-foreground mt-2">
                  Или используйте кнопку с иконкой "Я" для поиска на Яндекс Музыке
                </p>
              </div>
            )}
          </div>

          <div className="text-xs text-muted-foreground text-center pt-2 border-t border-border">
            <p>💡 После импорта сразу откроется меню оценки трека</p>
            <p className="mt-1">🎵 Кнопка с "Я" открывает Яндекс Музыку в новой вкладке</p>
          </div>
        </DialogContent>
      </Dialog>

      {/* Rating Dialog */}
      <TrackRatingDialog
        track={selectedTrack}
        open={ratingDialogOpen}
        onOpenChange={setRatingDialogOpen}
        onSaved={handleRatingDialogClose}
      />
    </>
  );
}