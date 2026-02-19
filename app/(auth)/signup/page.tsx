import { signIn } from "@/auth";
import Link from "next/link";

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-md">
        <h2 className="text-2xl font-bold text-center mb-6">Create Account</h2>
        
        {/* Mock Email/Password UI (Disabled without DB) */}
        <div className="space-y-4 mb-6 opacity-60 pointer-events-none">
          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <input type="email" disabled className="mt-1 block w-full border border-gray-300 rounded-md py-2 px-3 bg-gray-100" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Password</label>
            <input type="password" disabled className="mt-1 block w-full border border-gray-300 rounded-md py-2 px-3 bg-gray-100" />
          </div>
          <button disabled className="w-full bg-gray-400 text-white py-2 px-4 rounded-md">
            Sign in with Email
          </button>
        </div>

        <div className="relative mb-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="bg-white px-2 text-gray-500">Or continue with</span>
          </div>
        </div>

        {/* Active Google Auth */}
        <form
          action={async () => {
            "use server";
            await signIn("google", { redirectTo: "/onboarding" });
          }}
        >
          <button type="submit" className="w-full border border-gray-300 bg-white text-gray-700 py-2 px-4 rounded-md hover:bg-gray-50 font-medium text-center">
            Log in with Google
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-600">
          Don't have an account?{" "}
          <Link href="/signup" className="text-blue-600 hover:text-blue-500">Sign up</Link>
        </p>
      </div>
    </div>
  );
}