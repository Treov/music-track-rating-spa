"use client"

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Settings, Loader2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import Link from "next/link";

interface Setting {
  id: number;
  key: string;
  value: string;
  updatedAt: string;
}

export default function SettingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [eventName, setEventName] = useState("");
  const [currentUser, setCurrentUser] = useState<{ id: number; role: string } | null>(null);

  useEffect(() => {
    checkAuthAndFetch();
  }, []);

  const checkAuthAndFetch = async () => {
    const sessionData = localStorage.getItem("music_app_session");
    
    if (!sessionData) {
      toast.error("Требуется авторизация");
      router.push("/");
      return;
    }

    try {
      const session = JSON.parse(sessionData);
      const now = Date.now();
      
      if (session.expiresAt && now < session.expiresAt && session.user) {
        // Check if user is super_admin (CEO)
        if (session.user.role !== "super_admin") {
          toast.error("Доступ запрещен. Требуются права CEO.");
          router.push("/");
          return;
        }
        
        setCurrentUser(session.user);
        await fetchSettings();
      } else {
        localStorage.removeItem("music_app_session");
        toast.error("Сессия истекла");
        router.push("/");
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error("Ошибка авторизации");
      router.push("/");
    }
  };

  const fetchSettings = async () => {
    try {
      const response = await fetch("/api/settings/eventName");
      if (!response.ok) throw new Error("Ошибка загрузки настроек");
      
      const data: Setting = await response.json();
      setEventName(data.value);
    } catch (error) {
      console.error("Error fetching settings:", error);
      toast.error("Ошибка загрузки настроек");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!eventName.trim()) {
      toast.error("Название события не может быть пустым");
      return;
    }

    setSaving(true);

    try {
      const response = await fetch("/api/settings/eventName", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          value: eventName,
          authUser: currentUser
        })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Ошибка сохранения");
      }

      toast.success("Настройки успешно сохранены");
    } catch (error) {
      console.error("Error saving settings:", error);
      toast.error(error instanceof Error ? error.message : "Ошибка сохранения");
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

  return (
    <div className="min-h-screen p-6 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Link href="/admin">
            <Button variant="ghost" className="glass-card">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Назад в админпанель
            </Button>
          </Link>
        </div>

        {/* Title */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Settings className="w-8 h-8 text-primary" />
            <h1 className="text-3xl md:text-4xl font-bold gradient-text">
              Настройки сайта
            </h1>
          </div>
          <p className="text-muted-foreground">
            Управление основными настройками приложения
          </p>
        </div>

        {/* Settings Form */}
        <div className="glass-card rounded-xl p-6">
          <div className="space-y-6">
            {/* Event Name Setting */}
            <div className="space-y-3">
              <label className="text-sm font-medium text-foreground">
                Название события
              </label>
              <p className="text-xs text-muted-foreground">
                Это название будет отображаться на главной странице и в форме входа
              </p>
              <Input
                value={eventName}
                onChange={(e) => setEventName(e.target.value)}
                placeholder="Введите название события"
                className="glass-card border-border"
                disabled={saving}
              />
            </div>

            {/* Save Button */}
            <div className="flex justify-end pt-4 border-t border-border/50">
              <Button
                onClick={handleSave}
                disabled={saving}
                className="bg-primary hover:bg-primary/90 glow-purple"
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
          </div>
        </div>

        {/* Info Card */}
        <div className="glass-card rounded-xl p-6 mt-6">
          <h3 className="font-semibold mb-2">ℹ️ Информация</h3>
          <ul className="text-sm text-muted-foreground space-y-2">
            <li>• Изменения применяются сразу после сохранения</li>
            <li>• Название события отображается на всех страницах</li>
            <li>• Только CEO может редактировать настройки</li>
          </ul>
        </div>
      </div>
    </div>
  );
}