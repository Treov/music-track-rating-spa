"use client"

import { useState, useEffect } from "react";
import { Artist } from "@/types";
import { Search, Loader2, Music2, LogOut, LogIn, User, Users, Settings, TrendingUp, Filter, ChevronDown, ChevronUp, Send } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import AddArtistDialog from "@/components/AddArtistDialog";
import GlobalMusicSearch from "@/components/GlobalMusicSearch";
import ArtistCard from "@/components/ArtistCard";
import LoginForm from "@/components/LoginForm";
import { toast } from "sonner";
import Link from "next/link";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface UserData {
  id: number;
  username: string;
  displayName: string | null;
  role: string;
  avatarUrl: string | null;
  permissions?: {
    canEditOthersRatings: boolean;
    canDeleteOthersRatings: boolean;
    canVerifyArtists: boolean;
    canAddArtists: boolean;
    canDeleteArtists: boolean;
  };
}

export default function Home() {
  const [artists, setArtists] = useState<Artist[]>([]);
  const [topArtists, setTopArtists] = useState<Artist[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [topLoading, setTopLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<UserData | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [showLogin, setShowLogin] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [eventName, setEventName] = useState("HOSPITAL TOURNAMENT");
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);
  const LIMIT = 12;
  
  // Top artists filters
  const [showTop, setShowTop] = useState(false);
  const [sortBy, setSortBy] = useState<'tracks' | 'rating'>('rating');
  const [minTracks, setMinTracks] = useState<string>('0');
  const [minRating, setMinRating] = useState<string>('0');

  // Check authentication on mount
  useEffect(() => {
    checkAuth();
    fetchEventName();
  }, []);

  const fetchEventName = async () => {
    try {
      const response = await fetch("/api/settings/eventName");
      if (response.ok) {
        const data = await response.json();
        setEventName(data.value);
      }
    } catch (error) {
      console.error("Error fetching event name:", error);
    }
  };

  const checkAuth = async () => {
    const sessionData = localStorage.getItem("music_app_session");
    
    if (sessionData) {
      try {
        const session = JSON.parse(sessionData);
        const now = Date.now();
        
        // Check if session is expired (1 hour)
        if (session.expiresAt && now < session.expiresAt && session.user) {
          // Fetch fresh user data with permissions
          const response = await fetch(`/api/users/${session.user.id}`);
          if (response.ok) {
            const userData = await response.json();
            setCurrentUser(userData);
            setIsAuthenticated(true);
          } else {
            // Session invalid, clear it
            localStorage.removeItem("music_app_session");
            setIsAuthenticated(false);
            setCurrentUser(null);
          }
        } else {
          // Session expired
          localStorage.removeItem("music_app_session");
          setIsAuthenticated(false);
          setCurrentUser(null);
          toast.error("Сессия истекла. Пожалуйста, войдите снова.");
        }
      } catch (error) {
        localStorage.removeItem("music_app_session");
        setIsAuthenticated(false);
        setCurrentUser(null);
      }
    } else {
      setIsAuthenticated(false);
      setCurrentUser(null);
    }
    
    setCheckingAuth(false);
  };

  const handleLoginSuccess = () => {
    checkAuth();
    setIsAnimating(true);
    setTimeout(() => {
      setShowLogin(false);
      setIsAnimating(false);
    }, 300);
  };

  const handleShowLogin = () => {
    setIsAnimating(true);
    setTimeout(() => {
      setShowLogin(true);
      setIsAnimating(false);
    }, 100);
  };

  const handleBackFromLogin = () => {
    setIsAnimating(true);
    setTimeout(() => {
      setShowLogin(false);
      setIsAnimating(false);
    }, 300);
  };

  const handleLogout = () => {
    localStorage.removeItem("music_app_session");
    setIsAuthenticated(false);
    setCurrentUser(null);
    toast.success("Вы вышли из системы");
  };

  const fetchArtists = async (reset: boolean = true) => {
    try {
      if (reset) {
        setLoading(true);
        setOffset(0);
        setHasMore(true);
      } else {
        setLoadingMore(true);
      }
      
      const currentOffset = reset ? 0 : offset;
      const params = new URLSearchParams();
      if (search) params.append("search", search);
      params.append("limit", LIMIT.toString());
      params.append("offset", currentOffset.toString());
      
      const response = await fetch(`/api/artists?${params}`);
      if (!response.ok) throw new Error("Ошибка загрузки");
      
      const data = await response.json();
      
      if (reset) {
        setArtists(data);
      } else {
        setArtists(prev => [...prev, ...data]);
      }
      
      // Check if there are more artists to load
      if (data.length < LIMIT) {
        setHasMore(false);
      } else {
        setHasMore(true);
        setOffset(currentOffset + LIMIT);
      }
    } catch (error) {
      console.error("Error fetching artists:", error);
      toast.error("Ошибка загрузки исполнителей");
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const handleLoadMore = () => {
    fetchArtists(false);
  };

  const fetchTopArtists = async () => {
    try {
      setTopLoading(true);
      const params = new URLSearchParams();
      params.append("sortBy", sortBy);
      params.append("limit", "10");
      if (minTracks) params.append("minTracks", minTracks);
      if (minRating) params.append("minRating", minRating);
      
      const response = await fetch(`/api/artists?${params}`);
      if (!response.ok) throw new Error("Ошибка загрузки");
      
      const data = await response.json();
      setTopArtists(data);
    } catch (error) {
      console.error("Error fetching top artists:", error);
    } finally {
      setTopLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchArtists(true);
    }, 300);

    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    if (showTop) {
      fetchTopArtists();
    }
  }, [sortBy, minTracks, minRating, showTop]);

  const isCEO = currentUser?.role === "super_admin";
  const canAddArtists = currentUser?.permissions?.canAddArtists || isCEO;
  const canVerifyArtists = currentUser?.permissions?.canVerifyArtists || isCEO;

  // Show loading spinner while checking auth
  if (checkingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Show login form if requested
  if (showLogin) {
    return (
      <div className={`transition-all duration-300 ${isAnimating ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}`}>
        <LoginForm onLoginSuccess={handleLoginSuccess} onBack={handleBackFromLogin} />
      </div>
    );
  }

  return (
    <div className={`min-h-screen pb-20 transition-all duration-300 ${isAnimating ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}`}>
      <div className="p-6 md:p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <Music2 className="w-10 h-10 text-primary" />
                <div>
                  <h1 className="text-3xl md:text-4xl font-bold gradient-text">
                    Soundcore
                  </h1>
                  <p className="text-sm text-muted-foreground mt-1">
                    Event {eventName}
                  </p>
                </div>
              </div>
              
              {/* User Info & Auth Buttons */}
              <div className="flex items-center gap-3">
                {isAuthenticated && currentUser ? (
                  <>
                    <div className="glass-card px-4 py-2 rounded-lg">
                      <p className="text-sm font-medium">{currentUser.displayName || currentUser.username}</p>
                      <p className="text-xs text-muted-foreground">
                        {currentUser.role === "super_admin" ? "CEO" : 
                         currentUser.role === "admin" ? "Администратор" : 
                         currentUser.role === "evaluator" ? "Оценщик" : "Модератор"}
                      </p>
                    </div>
                    
                    {/* Navigation buttons */}
                    <Link href={`/profile/${currentUser.id}`}>
                      <Button
                        variant="outline"
                        size="sm"
                        className="glass-card border-border hover:border-primary/50"
                      >
                        <User className="w-4 h-4 mr-2" />
                        Профиль
                      </Button>
                    </Link>
                    
                    <Link href="/evaluators">
                      <Button
                        variant="outline"
                        size="sm"
                        className="glass-card border-border hover:border-primary/50"
                      >
                        <Users className="w-4 h-4 mr-2" />
                        Оценщики
                      </Button>
                    </Link>
                    
                    {isCEO && (
                      <Link href="/admin">
                        <Button
                          variant="outline"
                          size="sm"
                          className="glass-card border-border hover:border-primary/50"
                        >
                          <Settings className="w-4 h-4 mr-2" />
                          Админпанель
                        </Button>
                      </Link>
                    )}
                    
                    <Button
                      onClick={handleLogout}
                      variant="outline"
                      size="sm"
                      className="glass-card border-border hover:border-primary/50"
                    >
                      <LogOut className="w-4 h-4 mr-2" />
                      Выход
                    </Button>
                  </>
                ) : (
                  <>
                    <Link href="/evaluators">
                      <Button
                        variant="outline"
                        size="sm"
                        className="glass-card border-border hover:border-primary/50"
                      >
                        <Users className="w-4 h-4 mr-2" />
                        Оценщики
                      </Button>
                    </Link>
                    <Button
                      onClick={handleShowLogin}
                      className="bg-primary hover:bg-primary/90 glow-purple"
                      size="sm"
                    >
                      <LogIn className="w-4 h-4 mr-2" />
                      login
                    </Button>
                  </>
                )}
              </div>
            </div>
            
            <p className="text-muted-foreground text-center">
              Developed by VENTO ANDA
            </p>
          </div>

          {/* Top Artists Toggle Button */}
          <div className="mb-6">
            <Button
              onClick={() => setShowTop(!showTop)}
              className="w-full glass-card border-border hover:border-primary/50"
              variant="outline"
            >
              <TrendingUp className="w-5 h-5 mr-2" />
              {showTop ? "Скрыть топ исполнителей" : "Показать топ исполнителей"}
              {showTop ? <ChevronUp className="w-5 h-5 ml-2" /> : <ChevronDown className="w-5 h-5 ml-2" />}
            </Button>
          </div>

          {/* Top Artists Section */}
          {showTop && (
            <div className="glass-card rounded-xl p-6 mb-8">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-6 h-6 text-primary" />
                  <h2 className="text-2xl font-bold gradient-text">Топ исполнителей</h2>
                </div>
                <Filter className="w-5 h-5 text-muted-foreground" />
              </div>

              {/* Filters */}
              <div className="flex flex-col md:flex-row gap-3 mb-6">
                <div className="flex-1">
                  <label className="text-sm text-muted-foreground mb-2 block">Сортировка</label>
                  <Select value={sortBy} onValueChange={(value: 'tracks' | 'rating') => setSortBy(value)}>
                    <SelectTrigger className="glass-card border-border">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="tracks">По количеству треков</SelectItem>
                      <SelectItem value="rating">По сумме оценок</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex-1">
                  <label className="text-sm text-muted-foreground mb-2 block">Минимум треков</label>
                  <Input
                    type="number"
                    min="0"
                    value={minTracks}
                    onChange={(e) => setMinTracks(e.target.value)}
                    className="glass-card border-border"
                    placeholder="0"
                  />
                </div>
                <div className="flex-1">
                  <label className="text-sm text-muted-foreground mb-2 block">Минимальная сумма оценок</label>
                  <Input
                    type="number"
                    min="0"
                    step="0.1"
                    value={minRating}
                    onChange={(e) => setMinRating(e.target.value)}
                    className="glass-card border-border"
                    placeholder="0"
                  />
                </div>
              </div>

              {/* Top Artists Grid */}
              {topLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              ) : topArtists.length === 0 ? (
                <div className="text-center py-12">
                  <Music2 className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground">Нет артистов с данными критериями</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                  {topArtists.map((artist, index) => (
                    <Link key={artist.id} href={`/artist/${artist.id}`}>
                      <div className="glass-card rounded-xl p-4 hover:scale-105 transition-all cursor-pointer">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="text-2xl font-bold text-primary">#{index + 1}</div>
                          {artist.imageUrl ? (
                            <img
                              src={artist.imageUrl}
                              alt={artist.name}
                              className="w-12 h-12 rounded-lg object-cover"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                              <Music2 className="w-6 h-6 text-white" />
                            </div>
                          )}
                        </div>
                        <h3 className="font-semibold truncate mb-2">{artist.name}</h3>
                        <div className="space-y-1 text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Треков:</span>
                            <span className="font-semibold">{artist.trackCount || 0}</span>
                          </div>
                          {artist.totalRating !== null && artist.totalRating !== undefined && (
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Сумма:</span>
                              <span className="font-semibold text-primary">{artist.totalRating.toFixed(1)}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}

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
              <div className="flex gap-2">
                {isAuthenticated && canAddArtists && (
                  <>
                    <GlobalMusicSearch onTrackAdded={() => fetchArtists(true)} currentUser={currentUser!} />
                    <AddArtistDialog onArtistAdded={() => fetchArtists(true)} />
                  </>
                )}
              </div>
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
              {!search && isAuthenticated && canAddArtists && (
                <AddArtistDialog onArtistAdded={() => fetchArtists(true)} />
              )}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {artists.map((artist) => (
                  <ArtistCard
                    key={artist.id}
                    artist={artist}
                    onDelete={() => fetchArtists(true)}
                    onVerify={() => fetchArtists(true)}
                    isAdmin={isAuthenticated}
                    canVerify={canVerifyArtists}
                    currentUser={currentUser}
                  />
                ))}
              </div>
              
              {/* Load More Button */}
              {hasMore && (
                <div className="flex justify-center mt-8">
                  <Button
                    onClick={handleLoadMore}
                    disabled={loadingMore}
                    className="glass-card border-border hover:border-primary/50 px-8"
                    variant="outline"
                    size="lg"
                  >
                    {loadingMore ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Загрузка...
                      </>
                    ) : (
                      <>
                        <ChevronDown className="w-5 h-5 mr-2" />
                        Загрузить еще
                      </>
                    )}
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Footer */}
      <footer className="fixed bottom-0 left-0 right-0 glass-card border-t border-border py-4 px-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            © 2025 Soundcore
          </p>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">Credits:</span>
            <a
              href="https://t.me/soundcorex"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm text-primary hover:text-accent transition-colors"
            >
              <Send className="w-4 h-4" />
              Telegram
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}