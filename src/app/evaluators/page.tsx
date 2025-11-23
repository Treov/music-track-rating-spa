"use client"

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, User, Shield, Crown, Search, Loader2, Settings as SettingsIcon, CheckCircle2, Award } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import Link from "next/link";

interface UserWithPermissions {
  id: number;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  role: string;
  isVerified: boolean;
  isBanned: boolean;
  tracksRatedCount: number;
  tracksAddedCount: number;
  permissions: {
    canEditOthersRatings: boolean;
    canDeleteOthersRatings: boolean;
    canVerifyArtists: boolean;
    canAddArtists: boolean;
    canDeleteArtists: boolean;
  } | null;
}

interface CurrentUser {
  id: number;
  role: string;
}

export default function EvaluatorsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<UserWithPermissions[]>([]);
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [search, setSearch] = useState("");
  const [filteredUsers, setFilteredUsers] = useState<UserWithPermissions[]>([]);

  useEffect(() => {
    checkAuthAndFetch();
  }, []);

  useEffect(() => {
    if (search.trim()) {
      const filtered = users.filter(user => 
        user.username.toLowerCase().includes(search.toLowerCase()) ||
        user.displayName?.toLowerCase().includes(search.toLowerCase())
      );
      setFilteredUsers(filtered);
    } else {
      setFilteredUsers(users);
    }
  }, [search, users]);

  const checkAuthAndFetch = async () => {
    const sessionData = localStorage.getItem("music_app_session");
    
    // Check auth but don't require it
    if (sessionData) {
      try {
        const session = JSON.parse(sessionData);
        const now = Date.now();
        
        if (session.expiresAt && now < session.expiresAt && session.user) {
          setCurrentUser(session.user);
        }
      } catch (error) {
        console.error("Error parsing session:", error);
      }
    }

    // Fetch all users (public endpoint)
    try {
      const response = await fetch("/api/users");
      if (!response.ok) {
        toast.error("Ошибка загрузки пользователей");
        return;
      }

      const data = await response.json();
      // Sort by role (ceo first, then admin, then moderator, then evaluator) and then by tracksRatedCount
      const roleOrder = { ceo: 0, admin: 1, moderator: 2, evaluator: 3 };
      const sorted = data.sort((a: UserWithPermissions, b: UserWithPermissions) => {
        const aOrder = roleOrder[a.role as keyof typeof roleOrder] ?? 999;
        const bOrder = roleOrder[b.role as keyof typeof roleOrder] ?? 999;
        if (aOrder !== bOrder) return aOrder - bOrder;
        return b.tracksRatedCount - a.tracksRatedCount;
      });
      setUsers(sorted);
      setFilteredUsers(sorted);
    } catch (error) {
      console.error("Error:", error);
      toast.error("Ошибка загрузки");
    } finally {
      setLoading(false);
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "ceo": return <Crown className="w-5 h-5 text-yellow-500" />;
      case "admin": return <Shield className="w-5 h-5 text-primary" />;
      case "moderator": return <Award className="w-5 h-5 text-blue-500" />;
      case "evaluator": return <User className="w-5 h-5 text-green-500" />;
      default: return <User className="w-5 h-5 text-muted-foreground" />;
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case "ceo": return "CEO";
      case "admin": return "Администратор";
      case "moderator": return "Модератор";
      case "evaluator": return "Оценщик";
      default: return role;
    }
  };

  const isCEO = currentUser?.role === "ceo";

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Link href="/">
            <Button variant="ghost" className="glass-card">
              <ArrowLeft className="mr-2 h-4 w-4" />
              На главную
            </Button>
          </Link>
        </div>

        {/* Title & Search */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold gradient-text mb-2">
            Оценщики
          </h1>
          <p className="text-muted-foreground mb-6">
            Список всех участников проекта и их статистика
          </p>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
            <Input
              placeholder="Поиск по имени или логину..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 glass-card border-border"
            />
          </div>
        </div>

        {/* Users Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredUsers.map((user) => (
            <div
              key={user.id}
              className={`glass-card rounded-xl p-6 ${
                user.isBanned ? "opacity-50" : ""
              } transition-all hover:scale-105 relative`}
            >
              {/* Verification Badge */}
              {user.isVerified && (
                <div className="absolute top-4 right-4">
                  <CheckCircle2 className="w-6 h-6 text-green-500" />
                </div>
              )}

              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  {user.avatarUrl ? (
                    <img
                      src={user.avatarUrl}
                      alt={user.displayName || user.username}
                      className="w-12 h-12 rounded-full object-cover border-2 border-primary/50"
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                      }}
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                      <User className="w-6 h-6 text-white" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold truncate">
                      {user.displayName || user.username}
                    </h3>
                    <p className="text-xs text-muted-foreground truncate">@{user.username}</p>
                  </div>
                </div>
                
                {getRoleIcon(user.role)}
              </div>

              {/* Role Badge */}
              <div className="mb-4 flex gap-2 flex-wrap">
                <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                  user.role === "ceo" ? "bg-yellow-500/20 text-yellow-500" :
                  user.role === "admin" ? "bg-primary/20 text-primary" :
                  user.role === "moderator" ? "bg-blue-500/20 text-blue-500" :
                  user.role === "evaluator" ? "bg-green-500/20 text-green-500" :
                  "bg-muted text-muted-foreground"
                }`}>
                  {getRoleLabel(user.role)}
                </span>
                {user.isBanned && (
                  <span className="inline-block px-3 py-1 rounded-full text-xs font-medium bg-destructive/20 text-destructive">
                    Забанен
                  </span>
                )}
              </div>

              {/* Stats */}
              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Оценено треков:</span>
                  <span className="font-semibold">{user.tracksRatedCount}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Добавлено треков:</span>
                  <span className="font-semibold">{user.tracksAddedCount}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <Link href={`/profile/${user.id}`} className="flex-1">
                  <Button variant="outline" size="sm" className="w-full glass-card">
                    <User className="w-4 h-4 mr-2" />
                    Профиль
                  </Button>
                </Link>
                
                {isCEO && user.id !== currentUser?.id && (
                  <Link href={`/admin/user/${user.id}`}>
                    <Button variant="outline" size="sm" className="glass-card">
                      <SettingsIcon className="w-4 h-4" />
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>

        {filteredUsers.length === 0 && (
          <div className="glass-card rounded-xl p-12 text-center">
            <User className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Пользователи не найдены</h3>
            <p className="text-muted-foreground">
              Попробуйте изменить поисковый запрос
            </p>
          </div>
        )}
      </div>
    </div>
  );
}