"use client"

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save, Ban, UserX, Shield, Loader2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import Link from "next/link";

interface UserWithPermissions {
  id: number;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  role: string;
  isBanned: boolean;
  tracksRatedCount: number;
  tracksAddedCount: number;
  permissions: {
    id: number;
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

export default function UserManagementPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState<UserWithPermissions | null>(null);
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  
  // Form state
  const [role, setRole] = useState<string>("admin");
  const [canEditOthersRatings, setCanEditOthersRatings] = useState(false);
  const [canDeleteOthersRatings, setCanDeleteOthersRatings] = useState(false);
  const [canVerifyArtists, setCanVerifyArtists] = useState(true);
  const [canAddArtists, setCanAddArtists] = useState(true);
  const [canDeleteArtists, setCanDeleteArtists] = useState(false);
  const [isBanned, setIsBanned] = useState(false);

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
      
      // Check if session has user data (no expiration check)
      if (!session.user || !session.user.id) {
        localStorage.removeItem("music_app_session");
        toast.error("Сессия недействительна");
        router.push("/");
        return;
      }

      // Check if user is super_admin
      if (session.user.role !== "super_admin") {
        toast.error("Доступ запрещен");
        router.push("/");
        return;
      }

      setCurrentUser(session.user);

      // Fetch user data
      const response = await fetch(`/api/users/${params.id}`);
      if (!response.ok) {
        toast.error("Пользователь не найден");
        router.push("/evaluators");
        return;
      }

      const data = await response.json();
      setUser(data);
      
      // Set form values
      setRole(data.role);
      setIsBanned(data.isBanned);
      if (data.permissions) {
        setCanEditOthersRatings(data.permissions.canEditOthersRatings);
        setCanDeleteOthersRatings(data.permissions.canDeleteOthersRatings);
        setCanVerifyArtists(data.permissions.canVerifyArtists);
        setCanAddArtists(data.permissions.canAddArtists);
        setCanDeleteArtists(data.permissions.canDeleteArtists);
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error("Ошибка загрузки");
      router.push("/evaluators");
    } finally {
      setLoading(false);
    }
  };

  const handleSavePermissions = async () => {
    if (!user || !currentUser) return;

    setSaving(true);

    try {
      // Update permissions
      const permResponse = await fetch(`/api/users/${params.id}/permissions?id=${params.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          authUser: currentUser,
          canEditOthersRatings,
          canDeleteOthersRatings,
          canVerifyArtists,
          canAddArtists,
          canDeleteArtists
        })
      });

      if (!permResponse.ok) {
        const error = await permResponse.json();
        toast.error(error.error || "Ошибка обновления прав");
        setSaving(false);
        return;
      }

      toast.success("Права успешно обновлены!");
    } catch (error) {
      console.error("Save error:", error);
      toast.error("Ошибка соединения");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveRole = async () => {
    if (!user || !currentUser) return;

    setSaving(true);

    try {
      const response = await fetch(`/api/users/${params.id}/role`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role,
          authUser: currentUser
        })
      });

      if (!response.ok) {
        const error = await response.json();
        toast.error(error.error || "Ошибка обновления роли");
        setSaving(false);
        return;
      }

      toast.success("Роль успешно обновлена!");
      await checkAuthAndFetch();
    } catch (error) {
      console.error("Save error:", error);
      toast.error("Ошибка соединения");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleBan = async () => {
    if (!user || !currentUser) return;

    setSaving(true);

    try {
      const response = await fetch(`/api/users/${params.id}/ban`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          banned: !isBanned,
          authUser: currentUser
        })
      });

      if (!response.ok) {
        const error = await response.json();
        toast.error(error.error || "Ошибка изменения статуса");
        setSaving(false);
        return;
      }

      setIsBanned(!isBanned);
      toast.success(isBanned ? "Пользователь разблокирован!" : "Пользователь заблокирован!");
    } catch (error) {
      console.error("Ban error:", error);
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

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen p-6 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Link href="/evaluators">
            <Button variant="ghost" className="glass-card">
              <ArrowLeft className="mr-2 h-4 w-4" />
              К оценщикам
            </Button>
          </Link>
        </div>

        {/* Title */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold gradient-text mb-2">
            Управление пользователем
          </h1>
          <p className="text-muted-foreground">
            {user.displayName || user.username} (@{user.username})
          </p>
        </div>

        {/* Warning for own account */}
        {currentUser?.id === user.id && (
          <div className="glass-card rounded-xl p-4 mb-6 border-2 border-yellow-500/50 bg-yellow-500/10">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-yellow-500" />
              <p className="text-sm text-yellow-500">
                Вы редактируете свой собственный аккаунт. Будьте осторожны при изменении прав!
              </p>
            </div>
          </div>
        )}

        {/* Ban Status */}
        {isBanned && (
          <div className="glass-card rounded-xl p-4 mb-6 border-2 border-destructive bg-destructive/10">
            <div className="flex items-center gap-3">
              <UserX className="w-5 h-5 text-destructive" />
              <p className="text-sm text-destructive font-semibold">
                Пользователь заблокирован и не может войти в систему
              </p>
            </div>
          </div>
        )}

        {/* Role Management */}
        <div className="glass-card rounded-2xl p-8 mb-6">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <Shield className="w-6 h-6 text-primary" />
            Роль и иерархия
          </h2>

          <div className="space-y-6">
            <div className="space-y-2">
              <Label>Роль пользователя</Label>
              <Select value={role} onValueChange={setRole} disabled={saving}>
                <SelectTrigger className="glass-card border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="super_admin">
                    <div className="flex items-center gap-2">
                      <Shield className="w-4 h-4 text-yellow-500" />
                      <span>Главный администратор</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="admin">
                    <div className="flex items-center gap-2">
                      <Shield className="w-4 h-4 text-primary" />
                      <span>Администратор</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="moderator">
                    <div className="flex items-center gap-2">
                      <Shield className="w-4 h-4 text-muted-foreground" />
                      <span>Модератор</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Главные администраторы имеют все права и могут управлять другими пользователями
              </p>
            </div>

            <Button
              onClick={handleSaveRole}
              disabled={saving || role === user.role}
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
                  Сохранить роль
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Permissions Management */}
        <div className="glass-card rounded-2xl p-8 mb-6">
          <h2 className="text-2xl font-bold mb-6">Права доступа</h2>

          <div className="space-y-6">
            {/* Edit Others Ratings */}
            <div className="flex items-center justify-between p-4 glass-card rounded-lg">
              <div className="flex-1">
                <Label className="text-base font-semibold">Редактирование чужих оценок</Label>
                <p className="text-sm text-muted-foreground mt-1">
                  Возможность изменять оценки других пользователей
                </p>
              </div>
              <Switch
                checked={canEditOthersRatings}
                onCheckedChange={setCanEditOthersRatings}
                disabled={saving}
              />
            </div>

            {/* Delete Others Ratings */}
            <div className="flex items-center justify-between p-4 glass-card rounded-lg">
              <div className="flex-1">
                <Label className="text-base font-semibold">Удаление чужих оценок</Label>
                <p className="text-sm text-muted-foreground mt-1">
                  Возможность удалять оценки других пользователей
                </p>
              </div>
              <Switch
                checked={canDeleteOthersRatings}
                onCheckedChange={setCanDeleteOthersRatings}
                disabled={saving}
              />
            </div>

            {/* Verify Artists */}
            <div className="flex items-center justify-between p-4 glass-card rounded-lg">
              <div className="flex-1">
                <Label className="text-base font-semibold">Выдача верификации</Label>
                <p className="text-sm text-muted-foreground mt-1">
                  Возможность верифицировать артистов
                </p>
              </div>
              <Switch
                checked={canVerifyArtists}
                onCheckedChange={setCanVerifyArtists}
                disabled={saving}
              />
            </div>

            {/* Add Artists */}
            <div className="flex items-center justify-between p-4 glass-card rounded-lg">
              <div className="flex-1">
                <Label className="text-base font-semibold">Добавление артистов</Label>
                <p className="text-sm text-muted-foreground mt-1">
                  Возможность добавлять новых артистов и треки
                </p>
              </div>
              <Switch
                checked={canAddArtists}
                onCheckedChange={setCanAddArtists}
                disabled={saving}
              />
            </div>

            {/* Delete Artists */}
            <div className="flex items-center justify-between p-4 glass-card rounded-lg border-2 border-destructive/30">
              <div className="flex-1">
                <Label className="text-base font-semibold text-destructive">Удаление артистов</Label>
                <p className="text-sm text-muted-foreground mt-1">
                  Возможность удалять артистов и их треки (опасно!)
                </p>
              </div>
              <Switch
                checked={canDeleteArtists}
                onCheckedChange={setCanDeleteArtists}
                disabled={saving}
              />
            </div>

            <Button
              onClick={handleSavePermissions}
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
                  Сохранить права
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Ban/Unban */}
        <div className="glass-card rounded-2xl p-8 border-2 border-destructive/30">
          <h2 className="text-2xl font-bold mb-4 text-destructive">Опасная зона</h2>
          <p className="text-muted-foreground mb-6">
            {isBanned 
              ? "Разблокируйте пользователя, чтобы он мог снова войти в систему"
              : "Заблокируйте пользователя, если он нарушил правила"}
          </p>
          
          <Button
            onClick={handleToggleBan}
            disabled={saving || currentUser?.id === user.id}
            variant="destructive"
            className="w-full"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Обработка...
              </>
            ) : (
              <>
                {isBanned ? (
                  <>
                    <Shield className="w-4 h-4 mr-2" />
                    Разблокировать пользователя
                  </>
                ) : (
                  <>
                    <Ban className="w-4 h-4 mr-2" />
                    Заблокировать пользователя
                  </>
                )}
              </>
            )}
          </Button>
          
          {currentUser?.id === user.id && (
            <p className="text-xs text-muted-foreground mt-2 text-center">
              Вы не можете заблокировать свой собственный аккаунт
            </p>
          )}
        </div>
      </div>
    </div>
  );
}