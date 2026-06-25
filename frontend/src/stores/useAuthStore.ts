import {create} from 'zustand';
import {toast} from 'sonner';
import { authService } from '@/services/authServices';
import type { AuthState } from '@/types/store';
import { fa } from 'zod/v4/locales';
export const useAuthStore = create<AuthState>((set , get) => ({
    accessToken: null,
    user: null,
    loading: false,

    setAccessToken: (accessToken) => {
        set({accessToken});
    },

    clearState: () => {
        set({accessToken: null, user: null, loading: false})
    },

    signUp: async (username, password, email, firstName, lastName) => {
        try {
            set({loading: true});

            //gọi api
            await authService.signUp(username, password, email, firstName, lastName);
        } catch (error) {
          console.error(error);
          toast.error("Đăng kí không thành công");
        } finally {
            set({loading: false})
        }

    },
    signIn: async (username, password) => {
       try {
            set({loading: true})
            const {accessToken} = await authService.signIn(username, password);

            get().setAccessToken(accessToken);

            await get().fetchMe();
            toast.success('Chào mừng bạn quay trở lại Pulse');

        
       } catch (error) {
            console.error(error);
            toast.error('Đăng nhập không thành công!')
       } finally {
            set({loading: false})
       }
    },

    signOut: async () => {
        try {
            get().clearState();
            await authService.signOut();
            toast.success('Đăng xuất thành công');

        } catch (error) {
            console.error(error);
            toast.error("lỗi xảy ra khi logout, hãy thử lại")
        }
    },

    fetchMe: async () => {
        try {
            set({loading: true});
            const user = await authService.fetchMe();

            set({user});
        } catch (error) {
            console.error(error);
            set({ user: null, accessToken: null });
            toast.error("Lỗi xảy ra khi lấy dữ liệu người dùng. Hãy thử lại")

        } finally {
            set({loading: false})
        }
    },

    refresh: async () => {
        try {
            set({loading: true});
            const {user, fetchMe, setAccessToken} = get();
            const accessToken = await authService.refresh();

            setAccessToken(accessToken)

            if (!user) {
                await fetchMe();
            }
        } catch (error) {
            console.error(error);
            toast.error("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại")
            get().clearState();
        } finally {
            set({loading:false})
        }
    }



}))