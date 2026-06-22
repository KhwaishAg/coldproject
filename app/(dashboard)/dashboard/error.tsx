"use client";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const isSupabase = error.message.includes("Supabase");

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
      <div className="max-w-lg w-full bg-white rounded-lg shadow-md p-8">
        <h2 className="text-xl font-bold text-gray-800 mb-2">
          {isSupabase ? "Supabase not configured" : "Something went wrong"}
        </h2>
        <p className="text-sm text-gray-600 mb-4">{error.message}</p>
        {isSupabase && (
          <ol className="text-sm text-gray-600 list-decimal ml-4 space-y-2 mb-6">
            <li>Create a free project at supabase.com</li>
            <li>Run <code className="bg-gray-100 px-1 rounded">supabase/migrations/001_initial.sql</code> in the SQL Editor</li>
            <li>Copy URL and keys to <code className="bg-gray-100 px-1 rounded">.env.local</code> (see <code className="bg-gray-100 px-1 rounded">.env.local.example</code>)</li>
            <li>Restart <code className="bg-gray-100 px-1 rounded">npm run dev</code></li>
          </ol>
        )}
        <button
          type="button"
          onClick={reset}
          className="bg-[#C0534F] text-white px-4 py-2 rounded text-sm"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
