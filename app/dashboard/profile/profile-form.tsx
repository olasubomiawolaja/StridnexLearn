"use client";

import React,  { useState } from "react";
import { createClient } from "@/lib/supabase";

export default function ProfileForm({
  user,
  profile,
}: any) {
  const supabase = createClient();

  const [fullName, setFullName] = useState(
    profile?.full_name || user.user_metadata?.full_name || ""
  );

  const [nickname, setNickname] = useState(
    profile?.nickname || ""
  );

  const [bio, setBio] = useState(
    profile?.bio || ""
  );

  const [avatarUrl, setAvatarUrl] = useState(
    profile?.avatar_url || ""
  );

  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    setLoading(true);

    const {
      data: { user: currentUser },
    } = await supabase.auth.getUser();

    if (!currentUser) return;

    const { error } = await supabase
  .from("profiles")
  .upsert({
    id: currentUser.id,
    full_name: fullName,
    nickname,
    bio,
    avatar_url: avatarUrl,
  });

if (error) {
  console.log(error);
  alert(error.message);
  setLoading(false);
  return;
}

await supabase.auth.updateUser({
  data: {
    full_name: fullName,
  },
});

alert("Profile updated!");

    setLoading(false);
  };

  const handleImageUpload = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];

    if (!file) return;

    const fileExt = file.name.split(".").pop();

    const fileName = `${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(fileName, file);

    //if (error) {
    //  alert("Upload failed");
    //  return;
    //}

    if (uploadError) {
      console.log(uploadError);
      alert(uploadError.message);
      return;
    }

    const {
      data: { publicUrl },
    } = supabase.storage
      .from("avatars")
      .getPublicUrl(fileName);

    setAvatarUrl(publicUrl);
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 space-y-8">
      <div className="flex items-center gap-6">
        <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt="Avatar"
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="text-2xl font-bold text-gray-600">
              {fullName?.charAt(0)}
            </span>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Upload profile picture
          </label>

          <input
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="text-sm"
          />
        </div>
      </div>

      <div className="grid gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Full Name
          </label>

          <input
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-gray-900"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Nickname
          </label>

          <input
            type="text"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-gray-900"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Email Address
          </label>

          <input
            type="email"
            value={user.email}
            disabled
            className="w-full bg-gray-100 border border-gray-200 rounded-xl px-4 py-3 text-gray-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Bio
          </label>

          <textarea
            rows={4}
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-gray-900"
          />
        </div>
      </div>

      <button
        onClick={handleSave}
        disabled={loading}
        className="px-6 py-3 bg-gray-900 text-white rounded-xl hover:bg-gray-800 transition"
      >
        {loading ? "Saving..." : "Save Changes"}
      </button>
    </div>
  );
}