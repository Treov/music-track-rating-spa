"use client"

import { useState, useEffect } from "react";
import { Artist } from "@/types";
import { Search, Loader2, Music2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import AddArtistDialog from "@/components/AddArtistDialog";
import ArtistCard from "@/components/ArtistCard";

export default function Home() {
  const [artists, setArtists] = useState<Artist[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const fetchArtists = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.append("search", search);
      
      const response = await fetch(`/api/artists?${params}`);
      if (!response.ok) throw new Error("Ошибка загрузки");
      
      const data = await response.json();
      setArtists(data);
    } catch (error) {
      console.error("Error fetching artists:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchArtists();
    }, 300);

    return () => clearTimeout(timer);
  }, [search]);

  return (
    <div className="min-h-screen p-6 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="flex items-center justify-center gap-3 mb-3">
            <Music2 className="w-10 h-10 text-primary" />
            <h1 className="text-4xl md:text-5xl font-bold gradient-text">
              Stream Rating
            </h1>
          </div>
          <p className="text-muted-foreground">
            Оценивайте музыкальные треки на стриме
          </p>
        </div>

        {/* Actions Bar */}
        <div className="glass-card rounded-xl p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4 items-center">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
              <Input
                placeholder="Поиск артистов..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 glass-card border-border"
              />
            </div>
            <AddArtistDialog onArtistAdded={fetchArtists} />
          </div>
        </div>

        {/* Artists Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : artists.length === 0 ? (
          <div className="glass-card rounded-xl p-12 text-center">
            <Music2 className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Нет артистов</h3>
            <p className="text-muted-foreground mb-6">
              {search
                ? "Артисты не найдены. Попробуйте другой запрос."
                : "Добавьте первого артиста, чтобы начать оценивать треки."}
            </p>
            {!search && <AddArtistDialog onArtistAdded={fetchArtists} />}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {artists.map((artist) => (
              <ArtistCard
                key={artist.id}
                artist={artist}
                onDelete={fetchArtists}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}