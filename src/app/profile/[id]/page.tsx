"use client"

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Camera, Save, Loader2, User, Music, Award } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import Link from "next/link";

interface UserProfile {
  id: number;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  bio: string | null;
  role: string;
  tracksRatedCount: number;
  tracksAddedCount: number;
  createdAt: string;
}

export default function ProfilePage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [isOwnProfile, setIsOwnProfile] = useState(false);
  
  // Form state
  const [displayName, setDisplayName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [bio, setBio] = useState("");

  useEffect(() => {
    checkAuthAndFetch();
  }, [params.id]);

  const checkAuthAndFetch = async () => {
    const sessionData = localStorage.getItem("music_app_session");
    
    if (!sessionData) {
      toast.error("Необходима авторизация");
      router.push("/");
      return;
    }

    try {
      const session = JSON.parse(sessionData);
      const now = Date.now();
      
      if (!session.expiresAt || now >= session.expiresAt || !session.user) {
        localStorage.removeItem("music_app_session");
        toast.error("Сессия истекла");
        router.push("/");
        return;
      }

      setCurrentUserId(session.user.id);
      setIsOwnProfile(session.user.id === parseInt(params.id));

      // Fetch profile data
      const response = await fetch(`/api/users/${params.id}`);
      if (!response.ok) {
        toast.error("Профиль не найден");
        router.push("/");
        return;
      }

      const data = await response.json();
      setProfile(data);
      setDisplayName(data.displayName || "");
      setAvatarUrl(data.avatarUrl || "");
      setBio(data.bio || "");
    } catch (error) {
      console.error("Error:", error);
      toast.error("Ошибка загрузки профиля");
      router.push("/");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!isOwnProfile) {
      toast.error("Вы можете редактировать только свой профиль");
      return;
    }

    setSaving(true);

    try {
      const response = await fetch(`/api/users/${params.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          displayName: displayName.trim() || null,
          avatarUrl: avatarUrl.trim() || null,
          bio: bio.trim() || null
        })
      });

      if (!response.ok) {
        const error = await response.json();
        toast.error(error.error || "Ошибка сохранения");
        setSaving(false);
        return;
      }

      const updated = await response.json();
      setProfile(updated);
      toast.success("Профиль обновлен!");
      
      // Update session if display name changed
      const sessionData = localStorage.getItem("music_app_session");
      if (sessionData) {
        const session = JSON.parse(sessionData);
        session.user.displayName = updated.displayName;
        localStorage.setItem("music_app_session", JSON.stringify(session));
      }
    } catch (error) {
      console.error("Save error:", error);
      toast.error("Ошибка соединения");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!profile) {
    return null;
  }

  const getRoleLabel = (role: string) => {
    switch (role) {
      case "super_admin": return "Главный администратор";
      case "admin": return "Администратор";
      case "moderator": return "Модератор";
      default: return role;
    }
  };

  return (
    <div className="min-h-screen p-6 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Back Button */}
        <Link href="/">
          <Button variant="ghost" className="mb-6 glass-card">
            <ArrowLeft className="mr-2 h-4 w-4" />
            На главную
          </Button>
        </Link>

        {/* Profile Card */}
        <div className="glass-card rounded-2xl p-8 mb-6">
          <div className="flex flex-col md:flex-row gap-8">
            {/* Avatar Section */}
            <div className="flex flex-col items-center">
              <div className="relative">
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt={displayName || profile.username}
                    className="w-32 h-32 rounded-full object-cover border-4 border-primary/50"
                    onError={(e) => {
                      e.currentTarget.src = "";
                      e.currentTarget.style.display = "none";
                    }}
                  />
                ) : (
                  <div className="w-32 h-32 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                    <User className="w-16 h-16 text-white" />
                  </div>
                )}
                {isOwnProfile && (
                  <div className="absolute bottom-0 right-0 p-2 rounded-full bg-primary text-white">
                    <Camera className="w-4 h-4" />
                  </div>
                )}
              </div>
              
              {/* Stats */}
              <div className="mt-6 space-y-3 w-full">
                <div className="glass-card p-3 rounded-lg flex items-center gap-3">
                  <Music className="w-5 h-5 text-primary" />
                  <div>
                    <p className="text-xs text-muted-foreground">Оценено треков</p>
                    <p className="text-lg font-bold">{profile.tracksRatedCount}</p>
                  </div>
                </div>
                <div className="glass-card p-3 rounded-lg flex items-center gap-3">
                  <Award className="w-5 h-5 text-accent" />
                  <div>
                    <p className="text-xs text-muted-foreground">Добавлено треков</p>
                    <p className="text-lg font-bold">{profile.tracksAddedCount}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Profile Info */}
            <div className="flex-1 space-y-6">
              <div>
                <h1 className="text-3xl font-bold gradient-text mb-2">
                  {profile.displayName || profile.username}
                </h1>
                <p className="text-sm text-muted-foreground">@{profile.username}</p>
                <div className="mt-2 inline-block px-3 py-1 rounded-full bg-primary/20 text-primary text-sm font-medium">
                  {getRoleLabel(profile.role)}
                </div>
              </div>

              {isOwnProfile ? (
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Отображаемое имя</label>
                    <Input
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="Ваше имя"
                      className="glass-card border-border"
                      maxLength={100}
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">URL аватара</label>
                    <Input
                      value={avatarUrl}
                      onChange={(e) => setAvatarUrl(e.target.value)}
                      placeholder="https://example.com/avatar.jpg"
                      className="glass-card border-border"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">О себе</label>
                    <Textarea
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      placeholder="Расскажите о себе..."
                      className="glass-card border-border min-h-[120px]"
                      maxLength={500}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      {bio.length} / 500 символов
                    </p>
                  </div>

                  <Button
                    onClick={handleSave}
                    disabled={saving}
                    className="w-full bg-gradient-to-r from-primary to-accent hover:opacity-90"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Сохранение...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        Сохранить изменения
                      </>
                    )}
                  </Button>
                </div>
              ) : (
                <div>
                  <h3 className="text-sm font-medium mb-2">О пользователе</h3>
                  <p className="text-muted-foreground">
                    {profile.bio || "Пользователь еще не добавил информацию о себе"}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Account Info */}
        <div className="glass-card rounded-xl p-6">
          <h3 className="text-lg font-semibold mb-4">Информация об аккаунте</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Дата регистрации</p>
              <p className="font-medium">
                {new Date(profile.createdAt).toLocaleDateString("ru-RU", {
                  day: "numeric",
                  month: "long",
                  year: "numeric"
                })}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">ID пользователя</p>
              <p className="font-medium">#{profile.id}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
