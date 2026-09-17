import api from "@/lib/axios";

export const userService = {
    uploadAvatar: async (formData: FormData) => {
        const res = await api.post("/users/uploadAvatar", formData);
        return res.data;
    },
    updateProfile: async (profile: {
        displayName: string;
        email: string;
        phone?: string;
        bio?: string;
    }) => {
        const res = await api.patch("/users/me", profile);
        return res.data;
    },
    changePassword: async (currentPassword: string, newPassword: string) => {
        const res = await api.patch("/users/me/password", {
            currentPassword,
            newPassword,
        });
        return res.data;
    },
};
