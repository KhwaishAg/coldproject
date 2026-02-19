import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export default function OnboardingPage() {
  // 1. Define the Server Action
  async function completeProfile() {
    "use server"; // This is the magic line

    // Now you can safely use .set()
    const cookieStore = await cookies(); 
    cookieStore.set("has_onboarded", "true", { 
      secure: true,
      httpOnly: true, // Recommended for security
      path: "/", 
    });

    // 2. Redirect after setting the cookie
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-xl w-full bg-white p-8 rounded-lg shadow-md">
        <h2 className="text-2xl font-bold text-center mb-6">Complete Your Profile</h2>
        
        <form action={completeProfile} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700">Your Role</label>
            <select name="role" required className="mt-1 block w-full border border-gray-300 rounded-md py-2 px-3">
              <option value="">Select a role...</option>
              <option value="ug">UG Student</option>
              <option value="pg">PG Student</option>
              <option value="research">Research Student</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Institution / College</label>
            <input type="text" name="institution" required placeholder="e.g. Vellore Institute of Technology" className="mt-1 block w-full border border-gray-300 rounded-md py-2 px-3" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Academic Year</label>
            <select name="year" required className="mt-1 block w-full border border-gray-300 rounded-md py-2 px-3">
              <option value="">Select year...</option>
              <option value="1">1st Year</option>
              <option value="2">2nd Year</option>
              <option value="3">3rd Year</option>
              <option value="4">4th Year</option>
            </select>
          </div>

          <button type="submit" className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 font-medium">
            Save and Go to Dashboard
          </button>
        </form>
      </div>
    </div>
  );
}