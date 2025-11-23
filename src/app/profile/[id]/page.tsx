"use client"

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Camera, Save, Loader2, User, Music, Award, Plus, Trash2, ExternalLink, CheckCircle2, Globe, Youtube, Send, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import Link from "next/link";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface UserProfile {
  id: number;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  bio: string | null;
  role: string;
  isVerified: boolean;
  tracksRatedCount: number;
  tracksAddedCount: number;
  createdAt: string;
}

interface SocialLink {
  id: number;
  platform: string;
  url: string;
}

interface UserAward {
  id: number;
  awardId: number;
  name: string;
  description: string | null;
  iconUrl: string | null;
  color: string | null;
  assignedAt: string;
}

const platformIcons: Record<string, any> = {
  vk: Globe,
  instagram: Camera,
  soundcloud: Music,
  youtube: Youtube,
  telegram: Send,
  discord: MessageCircle,
  yandex_music: Music,
  genius: Music,
  website: Globe,
};

const platformLabels: Record<string, string> = {
  vk: "VK",
  instagram: "Instagram",
  soundcloud: "SoundCloud",
  youtube: "YouTube",
  telegram: "Telegram",
  discord: "Discord",
  yandex_music: "Яндекс Музыка",
  genius: "Genius",
  website: "Веб-сайт",
};

export default function ProfilePage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [isOwnProfile, setIsOwnProfile] = useState(false);
  const [socialLinks, setSocialLinks] = useState<SocialLink[]>([]);
  const [userAwards, setUserAwards] = useState<UserAward[]>([]);
  
  // Form state
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [bio, setBio] = useState("");
  
  // Social link form
  const [newLinkPlatform, setNewLinkPlatform] = useState("");
  const [newLinkUrl, setNewLinkUrl] = useState("");
  const [addingLink, setAddingLink] = useState(false);

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

      // Fetch profile data, social links, and awards
      await Promise.all([
        fetchProfile(),
        fetchSocialLinks(),
        fetchUserAwards()
      ]);
    } catch (error) {
      console.error("Error:", error);
      toast.error("Ошибка загрузки профиля");
      router.push("/");
    } finally {
      setLoading(false);
    }
  };

  const fetchProfile = async () => {
    const response = await fetch(`/api/users/${params.id}`);
    if (!response.ok) {
      toast.error("Профиль не найден");
      router.push("/");
      return;
    }

    const data = await response.json();
    setProfile(data);
    setUsername(data.username || "");
    setDisplayName(data.displayName || "");
    setAvatarUrl(data.avatarUrl || "");
    setBio(data.bio || "");
  };

  const fetchSocialLinks = async () => {
    try {
      const response = await fetch(`/api/users/${params.id}/social-links`);
      if (response.ok) {
        const data = await response.json();
        setSocialLinks(data);
      }
    } catch (error) {
      console.error("Error fetching social links:", error);
    }
  };

  const fetchUserAwards = async () => {
    try {
      // Fetch user awards from userAwards endpoint
      const response = await fetch(`/api/users/${params.id}`);
      if (response.ok) {
        const userData = await response.json();
        // TODO: Add awards to API response
        setUserAwards([]);
      }
    } catch (error) {
      console.error("Error fetching awards:", error);
    }
  };

  const handleSave = async () => {
    if (!isOwnProfile) {
      toast.error("Вы можете редактировать только свой профиль");
      return;
    }

    // Validate username
    if (!username.trim()) {
      toast.error("Username не может быть пустым");
      return;
    }

    if (username.trim().length < 3) {
      toast.error("Username должен содержать минимум 3 символа");
      return;
    }

    setSaving(true);

    try {
      const response = await fetch(`/api/users/${params.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: username.trim(),
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
      
      // Update session if username or display name changed
      const sessionData = localStorage.getItem("music_app_session");
      if (sessionData) {
        const session = JSON.parse(sessionData);
        session.user.username = updated.username;
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

  const handleAddSocialLink = async () => {
    if (!newLinkPlatform || !newLinkUrl.trim()) {
      toast.error("Заполните все поля");
      return;
    }

    setAddingLink(true);

    try {
      const sessionData = localStorage.getItem("music_app_session");
      const session = JSON.parse(sessionData!);

      const response = await fetch(`/api/users/${params.id}/social-links`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          platform: newLinkPlatform,
          url: newLinkUrl.trim(),
          authUser: session.user
        })
      });

      if (!response.ok) {
        const error = await response.json();
        toast.error(error.error || "Ошибка добавления ссылки");
        setAddingLink(false);
        return;
      }

      toast.success("Ссылка добавлена");
      setNewLinkPlatform("");
      setNewLinkUrl("");
      fetchSocialLinks();
    } catch (error) {
      console.error("Error:", error);
      toast.error("Ошибка добавления");
    } finally {
      setAddingLink(false);
    }
  };

  const handleDeleteSocialLink = async (linkId: number) => {
    if (!confirm("Удалить эту ссылку?")) return;

    try {
      const sessionData = localStorage.getItem("music_app_session");
      const session = JSON.parse(sessionData!);

      const response = await fetch(`/api/users/${params.id}/social-links/${linkId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ authUser: session.user })
      });

      if (!response.ok) {
        toast.error("Ошибка удаления");
        return;
      }

      toast.success("Ссылка удалена");
      fetchSocialLinks();
    } catch (error) {
      console.error("Error:", error);
      toast.error("Ошибка удаления");
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
      case "ceo": return "CEO";
      case "admin": return "Администратор";
      case "moderator": return "Модератор";
      case "evaluator": return "Оценщик";
      default: return role;
    }
  };

  const availablePlatforms = Object.keys(platformLabels).filter(
    platform => !socialLinks.some(link => link.platform === platform)
  );

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
                {profile.isVerified && (
                  <div className="absolute top-0 right-0 p-1 rounded-full bg-green-500">
                    <CheckCircle2 className="w-5 h-5 text-white" />
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
                <div className="mt-2 flex gap-2 items-center flex-wrap">
                  <div className="inline-block px-3 py-1 rounded-full bg-primary/20 text-primary text-sm font-medium">
                    {getRoleLabel(profile.role)}
                  </div>
                  {profile.isVerified && (
                    <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-green-500/20 text-green-500 text-sm font-medium">
                      <CheckCircle2 className="w-4 h-4" />
                      Верифицирован
                    </div>
                  )}
                </div>
              </div>

              {isOwnProfile ? (
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Username (ID)</label>
                    <Input
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="Ваш username"
                      className="glass-card border-border"
                      maxLength={50}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Минимум 3 символа, используется для входа и уникальной идентификации
                    </p>
                  </div>

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

        {/* Awards */}
        {userAwards.length > 0 && (
          <div className="glass-card rounded-xl p-6 mb-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Award className="w-5 h-5 text-yellow-500" />
              Награды
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {userAwards.map((award) => (
                <div
                  key={award.id}
                  className="glass-card p-4 rounded-lg flex flex-col items-center text-center"
                >
                  {award.iconUrl ? (
                    <img src={award.iconUrl} alt={award.name} className="w-12 h-12 mb-2" />
                  ) : (
                    <div
                      className="w-12 h-12 rounded-lg flex items-center justify-center mb-2"
                      style={{ backgroundColor: award.color || "#9333ea" }}
                    >
                      <Award className="w-6 h-6 text-white" />
                    </div>
                  )}
                  <p className="font-semibold text-sm">{award.name}</p>
                  {award.description && (
                    <p className="text-xs text-muted-foreground mt-1">{award.description}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Social Links */}
        <div className="glass-card rounded-xl p-6 mb-6">
          <h3 className="text-lg font-semibold mb-4">Социальные сети</h3>
          
          {socialLinks.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
              {socialLinks.map((link) => {
                const Icon = platformIcons[link.platform] || Globe;
                return (
                  <div
                    key={link.id}
                    className="glass-card p-3 rounded-lg flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="w-5 h-5 text-primary" />
                      <div>
                        <p className="text-sm font-medium">{platformLabels[link.platform]}</p>
                        <a
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1"
                        >
                          Открыть <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    </div>
                    {isOwnProfile && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteSocialLink(link.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {isOwnProfile && availablePlatforms.length > 0 && (
            <div className="border-t border-border pt-4 space-y-3">
              <p className="text-sm font-medium">Добавить социальную сеть</p>
              <div className="flex gap-2">
                <Select value={newLinkPlatform} onValueChange={setNewLinkPlatform}>
                  <SelectTrigger className="glass-card border-border w-[200px]">
                    <SelectValue placeholder="Платформа" />
                  </SelectTrigger>
                  <SelectContent>
                    {availablePlatforms.map((platform) => (
                      <SelectItem key={platform} value={platform}>
                        {platformLabels[platform]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  value={newLinkUrl}
                  onChange={(e) => setNewLinkUrl(e.target.value)}
                  placeholder="https://..."
                  className="glass-card border-border flex-1"
                />
                <Button
                  onClick={handleAddSocialLink}
                  disabled={addingLink}
                  className="bg-primary hover:bg-primary/90"
                >
                  {addingLink ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Plus className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>
          )}

          {socialLinks.length === 0 && !isOwnProfile && (
            <p className="text-sm text-muted-foreground text-center py-4">
              Пользователь не добавил социальные сети
            </p>
          )}
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