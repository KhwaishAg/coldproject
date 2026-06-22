import { completeOnboarding } from "@/app/actions";

const DOMAINS = [
  "Software Engineering",
  "Finance",
  "Data Science",
  "Marketing",
  "Product Management",
  "Design",
  "Consulting",
  "Other",
];

export default function OnboardingPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-10">
      <div className="max-w-2xl w-full bg-white p-8 rounded-lg shadow-md">
        <h2 className="text-2xl font-bold text-center mb-2">Complete Your Profile</h2>
        <p className="text-center text-gray-500 text-sm mb-6">
          Tell us about your goals so we can match you with the right internships.
        </p>

        <form action={completeOnboarding} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Target Domain</label>
              <select name="target_domain" required className="mt-1 block w-full border border-gray-300 rounded-md py-2 px-3">
                <option value="">Select domain...</option>
                {DOMAINS.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Internship Type</label>
              <select name="internship_type" required className="mt-1 block w-full border border-gray-300 rounded-md py-2 px-3">
                <option value="">Select type...</option>
                <option value="summer">Summer Internship</option>
                <option value="winter">Winter Internship</option>
                <option value="part-time">Part-time</option>
                <option value="research">Research</option>
              </select>
            </div>
          </div>

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

          <div>
            <label className="block text-sm font-medium text-gray-700">Skills (comma-separated)</label>
            <input type="text" name="skills" placeholder="React, Python, Financial Modeling" className="mt-1 block w-full border border-gray-300 rounded-md py-2 px-3" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Bio / About You</label>
            <textarea name="bio" rows={3} placeholder="Brief intro about your background and interests" className="mt-1 block w-full border border-gray-300 rounded-md py-2 px-3" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Resume Text (paste for now)</label>
            <textarea name="resume_text" rows={4} placeholder="Paste resume text so AI can personalize emails" className="mt-1 block w-full border border-gray-300 rounded-md py-2 px-3" />
          </div>

          <button type="submit" className="w-full bg-[#C0534F] text-white py-3 px-4 rounded-md hover:bg-[#a84542] font-medium">
            Save and Go to Dashboard
          </button>
        </form>
      </div>
    </div>
  );
}
