"use client"

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, UserPlus, Loader2, Shield, User as UserIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import Link from "next/link";

interface CurrentUser {
  id: number;
  username: string;
  role: string;
}

export default function AdminPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  
  // Form state
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [role, setRole] = useState<string>("admin");

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
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

      // Check if user is super_admin
      if (session.user.role !== "super_admin") {
        toast.error("Доступ запрещен");
        router.push("/");
        return;
      }

      setCurrentUser(session.user);
    } catch (error) {
      console.error("Error:", error);
      router.push("/");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!username.trim() || !password.trim()) {
      toast.error("Заполните все обязательные поля");
      return;
    }

    if (username.length < 3 || username.length > 50) {
      toast.error("Логин должен быть от 3 до 50 символов");
      return;
    }

    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      toast.error("Логин может содержать только буквы, цифры и подчеркивание");
      return;
    }

    if (password.length < 8) {
      toast.error("Пароль должен быть не менее 8 символов");
      return;
    }

    if (password !== confirmPassword) {
      toast.error("Пароли не совпадают");
      return;
    }

    setCreating(true);

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: username.trim(),
          password,
          displayName: displayName.trim() || null,
          role,
          authUser: currentUser
        })
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.code === "DUPLICATE_USERNAME") {
          toast.error("Пользователь с таким логином уже существует");
        } else if (data.code === "INVALID_USERNAME") {
          toast.error("Некорректный формат логина");
        } else if (data.code === "WEAK_PASSWORD") {
          toast.error("Слишком слабый пароль");
        } else {
          toast.error(data.error || "Ошибка создания пользователя");
        }
        setCreating(false);
        return;
      }

      toast.success(`Пользователь ${username} успешно создан!`);
      
      // Reset form
      setUsername("");
      setPassword("");
      setConfirmPassword("");
      setDisplayName("");
      setRole("admin");
    } catch (error) {
      console.error("Create error:", error);
      toast.error("Ошибка соединения");
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 md:p-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Link href="/">
            <Button variant="ghost" className="glass-card">
              <ArrowLeft className="mr-2 h-4 w-4" />
              На главную
            </Button>
          </Link>
        </div>

        {/* Title */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Shield className="w-8 h-8 text-yellow-500" />
            <h1 className="text-3xl md:text-4xl font-bold gradient-text">
              Админпанель
            </h1>
          </div>
          <p className="text-muted-foreground">
            Создание новых аккаунтов для участников проекта
          </p>
        </div>

        {/* Create User Form */}
        <div className="glass-card rounded-2xl p-8">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <UserPlus className="w-6 h-6 text-primary" />
            Создать нового пользователя
          </h2>

          <form onSubmit={handleCreateUser} className="space-y-6">
            {/* Username */}
            <div className="space-y-2">
              <Label htmlFor="username">Логин *</Label>
              <Input
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="username"
                className="glass-card border-border"
                disabled={creating}
                required
                maxLength={50}
              />
              <p className="text-xs text-muted-foreground">
                От 3 до 50 символов. Только буквы, цифры и подчеркивание.
              </p>
            </div>

            {/* Display Name */}
            <div className="space-y-2">
              <Label htmlFor="displayName">Отображаемое имя</Label>
              <Input
                id="displayName"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Иван Иванов"
                className="glass-card border-border"
                disabled={creating}
                maxLength={100}
              />
              <p className="text-xs text-muted-foreground">
                Необязательно. Будет показано вместо логина.
              </p>
            </div>

            {/* Role */}
            <div className="space-y-2">
              <Label>Роль *</Label>
              <Select value={role} onValueChange={setRole} disabled={creating}>
                <SelectTrigger className="glass-card border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">
                    <div className="flex items-center gap-2">
                      <Shield className="w-4 h-4 text-primary" />
                      <span>Администратор</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="moderator">
                    <div className="flex items-center gap-2">
                      <UserIcon className="w-4 h-4 text-muted-foreground" />
                      <span>Модератор</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="super_admin">
                    <div className="flex items-center gap-2">
                      <Shield className="w-4 h-4 text-yellow-500" />
                      <span>Главный администратор</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Password */}
            <div className="space-y-2">
              <Label htmlFor="password">Пароль *</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="glass-card border-border"
                disabled={creating}
                required
                minLength={8}
                autoComplete="new-password"
              />
              <p className="text-xs text-muted-foreground">
                Минимум 8 символов
              </p>
            </div>

            {/* Confirm Password */}
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Подтвердите пароль *</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="glass-card border-border"
                disabled={creating}
                required
                minLength={8}
                autoComplete="new-password"
              />
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={creating}
              className="w-full h-12 text-base font-semibold bg-gradient-to-r from-primary to-accent hover:opacity-90"
            >
              {creating ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Создание...
                </>
              ) : (
                <>
                  <UserPlus className="w-5 h-5 mr-2" />
                  Создать пользователя
                </>
              )}
            </Button>
          </form>
        </div>

        {/* Quick Access */}
        <div className="mt-6 flex gap-4">
          <Link href="/evaluators" className="flex-1">
            <Button variant="outline" className="w-full glass-card">
              <UserIcon className="w-4 h-4 mr-2" />
              Все оценщики
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
