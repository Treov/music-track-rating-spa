"use client"

import { useState, useEffect } from "react";
import { Artist } from "@/types";
import { Search, Loader2, Music2, LogOut, LogIn, User, Users, Settings } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import AddArtistDialog from "@/components/AddArtistDialog";
import GlobalMusicSearch from "@/components/GlobalMusicSearch";
import ArtistCard from "@/components/ArtistCard";
import LoginForm from "@/components/LoginForm";
import { toast } from "sonner";
import Link from "next/link";

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
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<UserData | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [showLogin, setShowLogin] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  // Check authentication on mount
  useEffect(() => {
    checkAuth();
  }, []);

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

  const isSuperAdmin = currentUser?.role === "super_admin";
  const canAddArtists = currentUser?.permissions?.canAddArtists || isSuperAdmin;
  const canVerifyArtists = currentUser?.permissions?.canVerifyArtists || isSuperAdmin;

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
    <div className={`min-h-screen p-6 md:p-8 transition-all duration-300 ${isAnimating ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}`}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Music2 className="w-10 h-10 text-primary" />
              <div>
                <h1 className="text-3xl md:text-4xl font-bold gradient-text">
                  Soundcore x pumkingott
                </h1>
                <p className="text-sm text-muted-foreground mt-1">
                  Event HOSPITAL TOURNAMENT
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
                      {currentUser.role === "super_admin" ? "Главный админ" : 
                       currentUser.role === "admin" ? "Администратор" : "Модератор"}
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
                  
                  {isSuperAdmin && (
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
                <Button
                  onClick={handleShowLogin}
                  className="bg-primary hover:bg-primary/90 glow-purple"
                  size="sm"
                >
                  <LogIn className="w-4 h-4 mr-2" />
                  login
                </Button>
              )}
            </div>
          </div>
          
          <p className="text-muted-foreground text-center">
            Developed by VENTO ANDA
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
            <div className="flex gap-2">
              {isAuthenticated && canAddArtists && (
                <>
                  <GlobalMusicSearch onTrackAdded={fetchArtists} currentUser={currentUser!} />
                  <AddArtistDialog onArtistAdded={fetchArtists} />
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
              <AddArtistDialog onArtistAdded={fetchArtists} />
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {artists.map((artist) => (
              <ArtistCard
                key={artist.id}
                artist={artist}
                onDelete={fetchArtists}
                onVerify={fetchArtists}
                isAdmin={isAuthenticated}
                canVerify={canVerifyArtists}
                currentUser={currentUser}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}