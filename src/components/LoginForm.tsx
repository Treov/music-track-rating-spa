"use client"

import { useState, useEffect } from "react";
import { Music2, Loader2, LogIn, ArrowLeft } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface LoginFormProps {
  onLoginSuccess: () => void;
  onBack?: () => void;
}

export default function LoginForm({ onLoginSuccess, onBack }: LoginFormProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [eventName, setEventName] = useState("HOSPITAL TOURNAMENT");

  useEffect(() => {
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!username || !password) {
      toast.error("Пожалуйста, заполните все поля");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password })
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.code === "ACCOUNT_BANNED") {
          toast.error("Ваш аккаунт заблокирован");
        } else if (data.code === "INVALID_CREDENTIALS") {
          toast.error("Неверный логин или пароль");
        } else {
          toast.error(data.error || "Ошибка входа");
        }
        setLoading(false);
        return;
      }

      // Save session with full user data including permissions
      const sessionData = {
        user: data.user,
        loginTime: Date.now()
      };
      
      localStorage.setItem("music_app_session", JSON.stringify(sessionData));
      toast.success(`Добро пожаловать, ${data.user.displayName || data.user.username}!`);
      onLoginSuccess();
    } catch (error) {
      console.error("Login error:", error);
      toast.error("Ошибка соединения с сервером");
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        {/* Back Button */}
        {onBack && (
          <Button
            variant="ghost"
            onClick={onBack}
            className="mb-6 glass-card transition-all duration-200 hover:scale-105"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Назад
          </Button>
        )}

        {/* Logo & Title */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Music2 className="w-12 h-12 text-primary animate-pulse" />
            <h1 className="text-4xl font-bold gradient-text">
              Soundcore
            </h1>
          </div>
          <p className="text-muted-foreground">
            {eventName}
          </p>
        </div>

        {/* Login Card */}
        <div className="glass-card rounded-2xl p-8 border-2">
          <h2 className="text-2xl font-bold text-center mb-6 gradient-text">
            Вход в систему
          </h2>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Username Input */}
            <div className="space-y-2">
              <label htmlFor="username" className="text-sm font-medium text-foreground">
                Логин
              </label>
              <Input
                id="username"
                type="text"
                placeholder="Введите логин"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={loading}
                className="glass-card border-border h-11 text-base"
                autoComplete="username"
              />
            </div>

            {/* Password Input */}
            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium text-foreground">
                Пароль
              </label>
              <Input
                id="password"
                type="password"
                placeholder="Введите пароль"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                className="glass-card border-border h-11 text-base"
                autoComplete="current-password"
              />
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={loading}
              className="w-full h-11 text-base font-semibold bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-opacity"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Вход...
                </>
              ) : (
                <>
                  <LogIn className="w-5 h-5 mr-2" />
                  Войти
                </>
              )}
            </Button>
          </form>
        </div>

        {/* Bottom Text */}
        <p className="text-center text-sm text-muted-foreground mt-6">
          Developed by VENTO ANDA
        </p>
      </div>
    </div>
  );
}