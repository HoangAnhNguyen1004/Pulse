import api from "@/lib/axios";

export const userService = {
    uploadAvatar: async (formData: FormData) => {
        const res = await api.post("/users/uploadAvatar", formData);
        return res.data;
    },
};