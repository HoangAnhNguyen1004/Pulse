import { SigninForm } from "@/components/auth/signin-form"

const SignInPage = () => {
  return (
    <div className="min-h-screen bg-gradient-purple flex items-center justify-center p-6">
      <div className="w-full max-w-5xl">
        <SigninForm />
      </div>
    </div>
  )
}

export default SignInPage