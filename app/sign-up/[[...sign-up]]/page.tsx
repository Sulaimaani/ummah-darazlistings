import { SignUp } from "@clerk/nextjs";
import Navbar from "@/components/Navbar";

export default function SignUpPage() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />
      <main className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-slate-900">Create Free Account</h1>
            <p className="text-sm text-slate-600">Start generating SEO listings for your Daraz store</p>
          </div>
          <div className="flex justify-center">
            <SignUp path="/sign-up" routing="path" signInUrl="/sign-in" forceRedirectUrl="/dashboard" />
          </div>
        </div>
      </main>
    </div>
  );
}
