// Server component wrapper: fetch user on the server and pass it to the client
import { createClient } from "@/lib/supabase/server";
import { HomeClientSuspense } from "./home-client";

export default async function AIInterviewPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const initialUser = user ?? null;
  return <HomeClientSuspense initialUser={initialUser} />;
}
