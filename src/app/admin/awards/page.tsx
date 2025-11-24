"use client"

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Award, Loader2, Plus, Edit2, Trash2, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import Link from "next/link";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface AwardType {
  id: number;
  name: string;
  description: string | null;
  iconUrl: string | null;
  color: string | null;
  createdAt: string;
  updatedAt: string;
}

interface User {
  id: number;
  username: string;
  displayName: string | null;
}

export default function AwardsManagementPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [awards, setAwards] = useState<AwardType[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  
  // Create/Edit Dialog
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingAward, setEditingAward] = useState<AwardType | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    iconUrl: "",
    color: "#9333ea",
  });

  // Assign Dialog
  const [isAssignOpen, setIsAssignOpen] = useState(false);
  const [selectedAwardForAssign, setSelectedAwardForAssign] = useState<AwardType | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<string>("");

  useEffect(() => {
    checkAuthAndFetch();
  }, []);

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

      if (session.user.role !== "super_admin") {
        toast.error("Доступ запрещён");
        router.push("/");
        return;
      }

      setCurrentUser(session.user);
      await Promise.all([fetchAwards(), fetchUsers()]);
    } catch (error) {
      console.error("Error:", error);
      toast.error("Ошибка авторизации");
      router.push("/");
    } finally {
      setLoading(false);
    }
  };

  const fetchAwards = async () => {
    try {
      const response = await fetch("/api/awards");
      if (!response.ok) throw new Error("Ошибка загрузки");
      const data = await response.json();
      setAwards(data);
    } catch (error) {
      console.error("Error:", error);
      toast.error("Ошибка загрузки наград");
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await fetch("/api/users");
      if (!response.ok) throw new Error("Ошибка загрузки");
      const data = await response.json();
      setUsers(data);
    } catch (error) {
      console.error("Error:", error);
      toast.error("Ошибка загрузки пользователей");
    }
  };

  const handleCreate = async () => {
    if (!formData.name.trim()) {
      toast.error("Введите название награды");
      return;
    }

    try {
      const response = await fetch("/api/awards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          authUser: currentUser,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        toast.error(error.error || "Ошибка создания награды");
        return;
      }

      toast.success("Награда создана");
      setIsCreateOpen(false);
      setFormData({ name: "", description: "", iconUrl: "", color: "#9333ea" });
      fetchAwards();
    } catch (error) {
      console.error("Error:", error);
      toast.error("Ошибка создания");
    }
  };

  const handleEdit = async () => {
    if (!editingAward || !formData.name.trim()) return;

    try {
      const response = await fetch(`/api/awards/${editingAward.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          authUser: currentUser,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        toast.error(error.error || "Ошибка обновления");
        return;
      }

      toast.success("Награда обновлена");
      setIsEditOpen(false);
      setEditingAward(null);
      setFormData({ name: "", description: "", iconUrl: "", color: "#9333ea" });
      fetchAwards();
    } catch (error) {
      console.error("Error:", error);
      toast.error("Ошибка обновления");
    }
  };

  const handleDelete = async (awardId: number) => {
    if (!confirm("Удалить эту награду?")) return;

    try {
      const response = await fetch(`/api/awards/${awardId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ authUser: currentUser }),
      });

      if (!response.ok) {
        const error = await response.json();
        toast.error(error.error || "Ошибка удаления");
        return;
      }

      toast.success("Награда удалена");
      fetchAwards();
    } catch (error) {
      console.error("Error:", error);
      toast.error("Ошибка удаления");
    }
  };

  const handleAssign = async () => {
    if (!selectedAwardForAssign || !selectedUserId) {
      toast.error("Выберите пользователя");
      return;
    }

    try {
      const response = await fetch(`/api/awards/${selectedAwardForAssign.id}/assign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: parseInt(selectedUserId),
          authUser: currentUser,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        toast.error(error.error || "Ошибка присвоения награды");
        return;
      }

      toast.success("Награда присвоена");
      setIsAssignOpen(false);
      setSelectedAwardForAssign(null);
      setSelectedUserId("");
    } catch (error) {
      console.error("Error:", error);
      toast.error("Ошибка присвоения");
    }
  };

  const openEditDialog = (award: AwardType) => {
    setEditingAward(award);
    setFormData({
      name: award.name,
      description: award.description || "",
      iconUrl: award.iconUrl || "",
      color: award.color || "#9333ea",
    });
    setIsEditOpen(true);
  };

  const openAssignDialog = (award: AwardType) => {
    setSelectedAwardForAssign(award);
    setIsAssignOpen(true);
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
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Link href="/admin">
            <Button variant="ghost" className="glass-card">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Назад к админпанели
            </Button>
          </Link>

          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-primary/90">
                <Plus className="w-4 h-4 mr-2" />
                Создать награду
              </Button>
            </DialogTrigger>
            <DialogContent className="glass-card border-border">
              <DialogHeader>
                <DialogTitle>Создать награду</DialogTitle>
                <DialogDescription>
                  Заполните информацию о новой награде
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Название*</label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="glass-card border-border"
                    placeholder="Топ оценщик"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Описание</label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="glass-card border-border"
                    placeholder="Описание награды..."
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">URL иконки</label>
                  <Input
                    value={formData.iconUrl}
                    onChange={(e) => setFormData({ ...formData, iconUrl: e.target.value })}
                    className="glass-card border-border"
                    placeholder="https://..."
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Цвет (hex)</label>
                  <Input
                    type="color"
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    className="glass-card border-border h-12"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                  Отмена
                </Button>
                <Button onClick={handleCreate} className="bg-primary hover:bg-primary/90">
                  Создать
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Title */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Award className="w-8 h-8 text-primary" />
            <h1 className="text-3xl md:text-4xl font-bold gradient-text">
              Управление наградами
            </h1>
          </div>
          <p className="text-muted-foreground">
            Создавайте награды и присваивайте их оценщикам
          </p>
        </div>

        {/* Awards Grid */}
        {awards.length === 0 ? (
          <div className="glass-card rounded-xl p-12 text-center">
            <Award className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Нет наград</h3>
            <p className="text-muted-foreground mb-6">
              Создайте первую награду для оценщиков
            </p>
            <Button onClick={() => setIsCreateOpen(true)} className="bg-primary hover:bg-primary/90">
              <Plus className="w-4 h-4 mr-2" />
              Создать награду
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {awards.map((award) => (
              <div key={award.id} className="glass-card rounded-xl p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    {award.iconUrl ? (
                      <img
                        src={award.iconUrl}
                        alt={award.name}
                        className="w-12 h-12 rounded-lg object-cover"
                      />
                    ) : (
                      <div
                        className="w-12 h-12 rounded-lg flex items-center justify-center"
                        style={{ backgroundColor: award.color || "#9333ea" }}
                      >
                        <Award className="w-6 h-6 text-white" />
                      </div>
                    )}
                    <div>
                      <h3 className="font-semibold">{award.name}</h3>
                      {award.description && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {award.description}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 glass-card"
                    onClick={() => openAssignDialog(award)}
                  >
                    <UserPlus className="w-4 h-4 mr-2" />
                    Присвоить
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="glass-card"
                    onClick={() => openEditDialog(award)}
                  >
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="glass-card text-destructive hover:text-destructive"
                    onClick={() => handleDelete(award.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Edit Dialog */}
        <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
          <DialogContent className="glass-card border-border">
            <DialogHeader>
              <DialogTitle>Редактировать награду</DialogTitle>
              <DialogDescription>
                Измените информацию о награде
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Название*</label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="glass-card border-border"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Описание</label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="glass-card border-border"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">URL иконки</label>
                <Input
                  value={formData.iconUrl}
                  onChange={(e) => setFormData({ ...formData, iconUrl: e.target.value })}
                  className="glass-card border-border"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Цвет (hex)</label>
                <Input
                  type="color"
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  className="glass-card border-border h-12"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditOpen(false)}>
                Отмена
              </Button>
              <Button onClick={handleEdit} className="bg-primary hover:bg-primary/90">
                Сохранить
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Assign Dialog */}
        <Dialog open={isAssignOpen} onOpenChange={setIsAssignOpen}>
          <DialogContent className="glass-card border-border">
            <DialogHeader>
              <DialogTitle>Присвоить награду</DialogTitle>
              <DialogDescription>
                Выберите пользователя для присвоения награды "{selectedAwardForAssign?.name}"
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <label className="text-sm font-medium mb-2 block">Пользователь</label>
              <select
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value)}
                className="w-full glass-card border border-border rounded-lg px-3 py-2 bg-background"
              >
                <option value="">Выберите пользователя</option>
                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.displayName || user.username} (#{user.id})
                  </option>
                ))}
              </select>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAssignOpen(false)}>
                Отмена
              </Button>
              <Button onClick={handleAssign} className="bg-primary hover:bg-primary/90">
                Присвоить
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}