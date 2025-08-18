"use client";

import { useAuth } from "@/hooks/use-auth";

export default function TestAuthPage() {
  const { user, loading, initialized } = useAuth();

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Auth Test Page</h1>
      
      <div className="space-y-2">
        <p><strong>Initialized:</strong> {initialized ? "Yes" : "No"}</p>
        <p><strong>Loading:</strong> {loading ? "Yes" : "No"}</p>
        <p><strong>User:</strong> {user ? user.email : "No user"}</p>
        <p><strong>User ID:</strong> {user?.id || "No ID"}</p>
      </div>

      {user && (
        <div className="mt-4 p-4 bg-green-100 rounded">
          <p>✅ User is authenticated!</p>
          <pre>{JSON.stringify(user, null, 2)}</pre>
        </div>
      )}

      {!user && initialized && !loading && (
        <div className="mt-4 p-4 bg-red-100 rounded">
          <p>❌ No user found</p>
        </div>
      )}
    </div>
  );
}
