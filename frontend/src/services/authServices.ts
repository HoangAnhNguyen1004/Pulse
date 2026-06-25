import api from '@/lib/axios';

export const authService = {
    signUp: async (
        username: String,
        password: String, 
        email: String, 
        firstName: String, 
        lastName: String
    ) => {
        const res = await api.post(
            "/auth/signup", 
            {username, password, email, firstName, lastName}, 
            {withCredentials: true}
        );
        
        return res.data;
    },


    signIn: async (username: string, password: string) => {
        const res = await api.post(
            "/auth/signin",
            { username, password }
        );

        // lưu access token
        localStorage.setItem("accessToken", res.data.accessToken);

        return res.data;
    },

    signOut: async () => {
        return api.post('/auth/signOut', {}, {withCredentials: true});
    },

    fetchMe: async () => {
        const res = await api.get("/users/me", {withCredentials:true});
        return res.data.user;
    },

    refresh: async () => {
        const res = await api.post("/auth/refresh", {withCredentials:true});
        return res.data.accessToken;
    },
 
};