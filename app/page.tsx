import Link from "next/link";
import { auth } from "@/auth";

export default async function LandingPage() {
  const session = await auth();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation Header */}
      <header className="bg-white shadow-sm flex items-center justify-between px-8 py-4">
        <div className="font-bold text-xl text-blue-600">OutreachAI</div>
        <nav className="flex items-center gap-6">
          <Link href="/plans" className="text-gray-600 hover:text-gray-900">Plans & Pricing</Link>
          <Link href="/feedback" className="text-gray-600 hover:text-gray-900">Feedback</Link>
          <Link href="/contact" className="text-gray-600 hover:text-gray-900">Contact Us</Link>
          {session ? (
            <Link href="/dashboard" className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
              Dashboard
            </Link>
          ) : (
            <Link href="/login" className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
              Login
            </Link>
          )}
        </nav>
      </header>

      {/* Hero Content */}
      <main className="flex flex-col items-center justify-center pt-32 text-center px-4">
        <h1 className="text-5xl font-extrabold tracking-tight text-gray-900 mb-6">
          Automate Your Cold Outreach
        </h1>
        <p className="text-xl text-gray-600 mb-8 max-w-2xl">
          Find connections, analyze profiles, and write highly personalized emails in seconds using AI.
        </p>
        {!session && (
          <Link href="/signup" className="bg-blue-600 text-white px-8 py-3 rounded-md text-lg hover:bg-blue-700">
            Sign Up
          </Link>
        )}
      </main>
    </div>
  );
}