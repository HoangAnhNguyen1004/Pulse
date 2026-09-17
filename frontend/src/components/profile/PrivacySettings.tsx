import { Bell, Shield, ShieldBan } from "lucide-react";
import { useState } from "react";
import {
    Card,
    CardHeader,
    CardTitle,
    CardDescription,
    CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useUserStore } from "@/stores/useUserStore";

const PrivacySettings = () => {
    const { changePassword } = useUserStore();
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [saving, setSaving] = useState(false);

    const passwordsMatch = !confirmPassword || newPassword === confirmPassword;

    const handleChangePassword = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!passwordsMatch) return;

        setSaving(true);
        try {
            await changePassword(currentPassword, newPassword);
            setCurrentPassword("");
            setNewPassword("");
            setConfirmPassword("");
        } finally {
            setSaving(false);
        }
    };

    return (
        <Card className="glass-strong border-border/30">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5 text-primary" />
                    Quyền riêng tư & Bảo mật
                </CardTitle>
                <CardDescription>
                    Quản lý cài đặt quyền riêng tư và bảo mật của bạn
                </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6">
                <form className="space-y-4" onSubmit={handleChangePassword}>
                    <h4 className="font-medium">Đổi mật khẩu</h4>

                    <div className="space-y-2">
                        <Label htmlFor="current-password">Mật khẩu hiện tại</Label>
                        <Input
                            id="current-password"
                            type="password"
                            value={currentPassword}
                            onChange={(event) => setCurrentPassword(event.target.value)}
                            autoComplete="current-password"
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="new-password">Mật khẩu mới</Label>
                        <Input
                            id="new-password"
                            type="password"
                            value={newPassword}
                            onChange={(event) => setNewPassword(event.target.value)}
                            autoComplete="new-password"
                            minLength={6}
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="confirm-password">Xác nhận mật khẩu mới</Label>
                        <Input
                            id="confirm-password"
                            type="password"
                            value={confirmPassword}
                            onChange={(event) => setConfirmPassword(event.target.value)}
                            autoComplete="new-password"
                            minLength={6}
                            required
                        />
                        {!passwordsMatch && (
                            <p className="text-sm text-destructive">
                                Mật khẩu xác nhận không khớp.
                            </p>
                        )}
                    </div>

                    <Button type="submit" disabled={saving || !passwordsMatch}>
                        {saving ? "Đang đổi..." : "Đổi mật khẩu"}
                    </Button>
                </form>

                <div className="space-y-4">
                    <Button
                        variant="outline"
                        className="w-full justify-start glass-light border-border/30 hover:text-info"
                    >
                        <Bell className="h-4 w-4 mr-2" />
                        Cài đặt thông báo
                    </Button>

                    <Button
                        variant="outline"
                        className="w-full justify-start glass-light border-border/30 hover:text-destructive"
                    >
                        <ShieldBan className="size-4 mr-2" />
                        Chặn & Báo cáo
                    </Button>
                </div>

                <div className="pt-4 border-t border-border/30">
                    <h4 className="font-medium mb-3 text-destructive">Khu vực nguy hiểm</h4>
                    <Button variant="destructive" className="w-full">
                        Xoá tài khoản
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
};

export default PrivacySettings;
