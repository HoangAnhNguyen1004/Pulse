import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {z} from 'zod';
import {useForm} from 'react-hook-form';
import {zodResolver} from '@hookform/resolvers/zod'
import { useAuthStore } from "@/stores/useAuthStore";
import { useNavigate } from "react-router";
const signInSchema = z.object({
  username: z.string().min(3, 'Tên đăng nhập phải có ít nhất 3 kí tự'),
  password: z.string().min(6, "Mật khẩu phải có ít nhất 6 kí tự")
});

type SignInFormValues = z.infer<typeof signInSchema>

export function SigninForm({className,...props}: React.ComponentProps<"div">) {
    const {signIn} = useAuthStore();
    const navigate = useNavigate();
    const {register, handleSubmit, formState: {errors, isSubmitting}} = useForm<SignInFormValues> ({
        resolver: zodResolver(signInSchema)
    });

    const onSubmit = async (data: SignInFormValues) => {
        //call backend for signup
        const {username, password} = data;
        await signIn(username, password);
        navigate("/");
    };

    return (
        <div className={cn("w-full", className)} {...props}>
            <Card className="overflow-hidden border-0 bg-card/80 shadow-2xl backdrop-blur-xl">
                <CardContent className="grid min-h-[700px] p-0 lg:grid-cols-2">

                    {/* LEFT */}
                    <div className="flex flex-col justify-center p-8 md:p-12">
                        <div className="mb-8">
                            <h1 className="text-4xl font-bold tracking-tight">
                                Chào mừng quay lại
                            </h1>

                            <p className="mt-3 text-muted-foreground">
                                Đăng nhập vào tài khoản Pulse của bạn
                            </p>
                        </div>

                        <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>

                            

                            {/* Username */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium">
                                    Tên đăng nhập
                                </label>

                                <Input
                                    type="text"
                                    placeholder="moji"
                                    id="username"
                                    className="h-11 rounded-xl border-border/50 bg-background/50"
                                    {...register("username")}
                                />

                                {errors.username && (
                                    <p className="text-destructive text-sm">
                                        {errors.username.message}
                                    </p>
                                )}


                            </div>


                            {/* Password */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium">
                                    Mật khẩu
                                </label>

                                <Input
                                    type="password"
                                    id="password"
                                    placeholder="••••••••"
                                    className="h-11 rounded-xl border-border/50 bg-background/50"
                                    {...register("password")}
                                />

                                {errors.password && (
                                    <p className="text-destructive text-sm">
                                        {errors.password.message}
                                    </p>
                                )}

                            </div>

                            {/* Submit Đăng nhập */}
                            <Button
                                type="submit"
                                className="h-11 w-full rounded-xl bg-gradient-primary text-sm font-semibold hover:opacity-90"
                                disabled={isSubmitting}
                            >
                                Đăng nhập
                            </Button>

                            {/* Login */}
                            <p className="text-center text-sm text-muted-foreground">
                                Chưa có tài khoản?{" "}
                                <a
                                    href="/signup"
                                    className="font-medium text-primary hover:underline"
                                >
                                    Đăng ký
                                </a>
                            </p>
                        </form>
                    </div>

                    {/* RIGHT */}
                    <div className="relative hidden lg:flex items-center justify-center overflow-hidden bg-gradient-primary">

                        <div className="absolute inset-0 bg-black/10" />

                        <div className="relative z-10 max-w-md px-10 text-white">
                            <div className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-white/20 backdrop-blur">
                                <span className="text-3xl font-bold">P</span>
                            </div>

                            <h2 className="text-4xl font-bold leading-tight">
                                Welcome to Pulse
                            </h2>

                            <p className="mt-5 text-lg text-white/80">
                                Modern messaging platform with beautiful UI and realtime chat experience.
                            </p>
                        </div>

                        <div className="absolute -bottom-20 -right-20 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
                        <div className="absolute -top-20 -left-20 h-72 w-72 rounded-full bg-pink-400/20 blur-3xl" />
                    </div>
                </CardContent>
            </Card>
        </div>
    )


}