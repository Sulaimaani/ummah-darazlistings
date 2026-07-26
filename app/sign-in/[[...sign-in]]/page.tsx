import { SignIn } from "@clerk/nextjs";
import Navbar from "@/components/Navbar";

export default function SignInPage() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />
      <main className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-slate-900">Welcome Back</h1>
            <p className="text-sm text-slate-600">Sign in to access your Daraz listing generator</p>
          </div>
          <div className="flex justify-center">
            <SignIn path="/sign-in" routing="path" signUpUrl="/sign-up" forceRedirectUrl="/dashboard" />
          </div>
        </div>
      </main>
    </div>
  );
}
