import { userService } from "@/services/userService";
import type { UserState } from "@/types/store";
import { create } from "zustand";
import { useAuthStore } from "./useAuthStore";
import { toast } from "sonner";
import { useChatStore } from "./useChatStore";

export const useUserStore = create<UserState>((set, get) => ({
    updateAvatarUrl: async (formData) => {
        try {
            const { user, setUser } = useAuthStore.getState();
            const data = await userService.uploadAvatar(formData);

            if (user) {
                setUser({
                    ...user,
                    avatarUrl: data.avatarUrl,
                });

                useChatStore.getState().fetchConversations();
            }
        } catch (error) {
            console.error("Lỗi khi updateAvatarUrl", error);
            toast.error("Upload avatar không thành công!");
        }
    },
    updateProfile: async (profile) => {
        try {
            const { user, setUser } = useAuthStore.getState();
            const { user: updatedUser } = await userService.updateProfile(profile);

            if (user && updatedUser) {
                setUser(updatedUser);
            }
            toast.success("Cập nhật thông tin cá nhân thành công!");
        } catch (error) {
            console.error("Lỗi khi cập nhật hồ sơ", error);
            toast.error("Cập nhật thông tin cá nhân không thành công!");
            throw error;
        }
    },
    changePassword: async (currentPassword, newPassword) => {
        try {
            await userService.changePassword(currentPassword, newPassword);
            toast.success("Đổi mật khẩu thành công!");
        } catch (error) {
            console.error("Lỗi khi đổi mật khẩu", error);
            toast.error("Đổi mật khẩu không thành công!");
            throw error;
        }
    },
}));
