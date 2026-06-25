import { SignupForm } from "@/components/auth/signup-form"

const SignUpPage = () => {
  return (
    <div className="min-h-screen bg-gradient-purple flex items-center justify-center p-6">
      <div className="w-full max-w-5xl">
        <SignupForm />
      </div>
    </div>
  )
}

export default SignUpPage