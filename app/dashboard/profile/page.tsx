import { createClient } from "@/lib/supabase-server";
import ProfileForm from "./profile-form";

export default async function ProfilePage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser(); 

  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  return (
    <div className="flex-1 overflow-y-auto bg-gray-50">
      <div className="max-w-3xl mx-auto px-6 py-10">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Profile Settings
          </h1>
          <p className="text-gray-500 mt-2">
            Manage your account information and preferences.
          </p>
        </div>

        <ProfileForm
          user={user}
          profile={profile}
        />
      </div>
    </div>
  );
}