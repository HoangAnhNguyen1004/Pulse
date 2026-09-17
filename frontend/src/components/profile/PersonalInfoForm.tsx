import { Heart } from "lucide-react";
import {
    Card,
    CardHeader,
    CardTitle,
    CardDescription,
    CardContent,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { useUserStore } from "@/stores/useUserStore";
import type { User } from "@/types/user";

type Props = {
    userInfo: User | null;
};

const PersonalInfoForm = ({ userInfo }: Props) => {
    const { updateProfile } = useUserStore();
    const [form, setForm] = useState({
        displayName: userInfo?.displayName ?? "",
        email: userInfo?.email ?? "",
        phone: userInfo?.phone ?? "",
        bio: userInfo?.bio ?? "",
    });
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        setForm({
            displayName: userInfo?.displayName ?? "",
            email: userInfo?.email ?? "",
            phone: userInfo?.phone ?? "",
            bio: userInfo?.bio ?? "",
        });
    }, [userInfo]);

    if (!userInfo) return null;

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setSaving(true);
        try {
            await updateProfile(form);
        } finally {
            setSaving(false);
        }
    };

    return (
        <Card className="glass-strong border-border/30">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Heart className="size-5 text-primary" />
                    Thông tin cá nhân
                </CardTitle>
                <CardDescription>
                    Cập nhật chi tiết cá nhân và thông tin hồ sơ của bạn
                </CardDescription>
            </CardHeader>

            <CardContent>
                <form className="space-y-4" onSubmit={handleSubmit}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="username">Tên người dùng</Label>
                            <Input
                                id="username"
                                value={userInfo.username}
                                disabled
                                className="glass-light border-border/30 opacity-70"
                            />
                            <p className="text-xs text-muted-foreground">
                                Tên người dùng không thể thay đổi.
                            </p>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="displayName">Tên hiển thị</Label>
                            <Input
                                id="displayName"
                                value={form.displayName}
                                onChange={(event) =>
                                    setForm((current) => ({
                                        ...current,
                                        displayName: event.target.value,
                                    }))
                                }
                                required
                                className="glass-light border-border/30"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                value={form.email}
                                onChange={(event) =>
                                    setForm((current) => ({ ...current, email: event.target.value }))
                                }
                                required
                                className="glass-light border-border/30"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="phone">Số điện thoại</Label>
                            <Input
                                id="phone"
                                type="tel"
                                value={form.phone}
                                onChange={(event) =>
                                    setForm((current) => ({ ...current, phone: event.target.value }))
                                }
                                className="glass-light border-border/30"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="bio">Giới thiệu</Label>
                        <Textarea
                            id="bio"
                            rows={3}
                            value={form.bio}
                            maxLength={500}
                            onChange={(event) =>
                                setForm((current) => ({ ...current, bio: event.target.value }))
                            }
                            className="glass-light border-border/30 resize-none"
                        />
                    </div>

                    <Button
                        type="submit"
                        disabled={saving}
                        className="w-full md:w-auto bg-gradient-primary hover:opacity-90 transition-opacity"
                    >
                        {saving ? "Đang lưu..." : "Lưu thay đổi"}
                    </Button>
                </form>
            </CardContent>
        </Card>
    );
};

export default PersonalInfoForm;
