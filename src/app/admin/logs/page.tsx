"use client"

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Activity, Loader2, Calendar, User, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import Link from "next/link";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ActivityLog {
  id: number;
  userId: number;
  action: string;
  targetType: string | null;
  targetId: number | null;
  details: string | null;
  ipAddress: string | null;
  createdAt: string;
  username: string;
  displayName: string | null;
}

export default function ActivityLogsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  
  // Filters
  const [actionFilter, setActionFilter] = useState<string>("");
  const [userIdFilter, setUserIdFilter] = useState<string>("");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  useEffect(() => {
    checkAuthAndFetch();
  }, []);

  useEffect(() => {
    if (currentUser) {
      fetchLogs();
    }
  }, [actionFilter, userIdFilter, startDate, endDate, currentUser]);

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

      if (session.user.role !== "super_admin") {
        toast.error("Доступ запрещён");
        router.push("/");
        return;
      }

      setCurrentUser(session.user);
    } catch (error) {
      console.error("Error:", error);
      toast.error("Ошибка авторизации");
      router.push("/");
    }
  };

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.append("authUser", JSON.stringify(currentUser));
      params.append("limit", "100");
      
      if (actionFilter) params.append("action", actionFilter);
      if (userIdFilter) params.append("userId", userIdFilter);
      if (startDate) params.append("startDate", new Date(startDate).toISOString());
      if (endDate) params.append("endDate", new Date(endDate).toISOString());

      const response = await fetch(`/api/activity-logs?${params}`);
      if (!response.ok) {
        toast.error("Ошибка загрузки логов");
        return;
      }

      const data = await response.json();
      setLogs(data);
    } catch (error) {
      console.error("Error:", error);
      toast.error("Ошибка загрузки");
    } finally {
      setLoading(false);
    }
  };

  const getActionLabel = (action: string) => {
    const labels: Record<string, string> = {
      rated_track: "Оценил трек",
      added_track: "Добавил трек",
      verified_artist: "Верифицировал артиста",
      edited_rating: "Отредактировал оценку",
      deleted_rating: "Удалил оценку",
      assigned_award: "Присвоил награду",
      revoked_award: "Отозвал награду",
      verified_user: "Верифицировал пользователя",
      banned_user: "Забанил пользователя",
      created_user: "Создал пользователя",
    };
    return labels[action] || action;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("ru-RU", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    }).format(date);
  };

  if (loading && !currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Link href="/admin">
            <Button variant="ghost" className="glass-card">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Назад к админпанели
            </Button>
          </Link>
        </div>

        {/* Title & Filters */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Activity className="w-8 h-8 text-primary" />
            <h1 className="text-3xl md:text-4xl font-bold gradient-text">
              Логи активности
            </h1>
          </div>
          <p className="text-muted-foreground mb-6">
            Отслеживание всех действий оценщиков
          </p>

          {/* Filters */}
          <div className="glass-card rounded-xl p-4 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="text-sm text-muted-foreground mb-2 block">Действие</label>
                <Select value={actionFilter} onValueChange={setActionFilter}>
                  <SelectTrigger className="glass-card border-border">
                    <SelectValue placeholder="Все действия" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Все действия</SelectItem>
                    <SelectItem value="rated_track">Оценил трек</SelectItem>
                    <SelectItem value="added_track">Добавил трек</SelectItem>
                    <SelectItem value="verified_artist">Верифицировал артиста</SelectItem>
                    <SelectItem value="assigned_award">Присвоил награду</SelectItem>
                    <SelectItem value="verified_user">Верифицировал пользователя</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="text-sm text-muted-foreground mb-2 block">ID пользователя</label>
                <Input
                  type="number"
                  value={userIdFilter}
                  onChange={(e) => setUserIdFilter(e.target.value)}
                  className="glass-card border-border"
                  placeholder="Все пользователи"
                />
              </div>

              <div>
                <label className="text-sm text-muted-foreground mb-2 block">Дата от</label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="glass-card border-border"
                />
              </div>

              <div>
                <label className="text-sm text-muted-foreground mb-2 block">Дата до</label>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="glass-card border-border"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Logs Table */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : logs.length === 0 ? (
          <div className="glass-card rounded-xl p-12 text-center">
            <Activity className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Нет логов</h3>
            <p className="text-muted-foreground">
              Логи активности пока не найдены
            </p>
          </div>
        ) : (
          <div className="glass-card rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b border-border">
                  <tr className="bg-muted/20">
                    <th className="text-left p-4 font-semibold">ID</th>
                    <th className="text-left p-4 font-semibold">Пользователь</th>
                    <th className="text-left p-4 font-semibold">Действие</th>
                    <th className="text-left p-4 font-semibold">Цель</th>
                    <th className="text-left p-4 font-semibold">IP</th>
                    <th className="text-left p-4 font-semibold">Дата</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log, index) => (
                    <tr
                      key={log.id}
                      className={`border-b border-border/50 hover:bg-muted/10 transition-colors ${
                        index % 2 === 0 ? "bg-muted/5" : ""
                      }`}
                    >
                      <td className="p-4 text-sm text-muted-foreground">#{log.id}</td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-primary" />
                          <div>
                            <p className="text-sm font-medium">
                              {log.displayName || log.username}
                            </p>
                            <p className="text-xs text-muted-foreground">ID: {log.userId}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="inline-block px-3 py-1 rounded-full text-xs font-medium bg-primary/20 text-primary">
                          {getActionLabel(log.action)}
                        </span>
                      </td>
                      <td className="p-4 text-sm">
                        {log.targetType && log.targetId ? (
                          <div className="flex items-center gap-2">
                            <Target className="w-4 h-4 text-muted-foreground" />
                            <span className="text-muted-foreground">
                              {log.targetType} #{log.targetId}
                            </span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="p-4 text-sm text-muted-foreground">
                        {log.ipAddress || "—"}
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">
                            {formatDate(log.createdAt)}
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Stats */}
        {logs.length > 0 && (
          <div className="mt-6 glass-card rounded-xl p-4">
            <p className="text-sm text-muted-foreground text-center">
              Показано записей: <span className="font-semibold text-foreground">{logs.length}</span>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
