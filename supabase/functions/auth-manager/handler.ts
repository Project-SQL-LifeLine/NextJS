// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // এখানে ref (রেফারেল কোড) রিসিভ করা হচ্ছে
    const { action, mobile, password, game_id, ref } = await req.json();
    const email = mobile ? `${mobile}@user.local` : "";

    // ১. সাইনআপ (Signup)
    if (action === "signup") {
      if (!mobile || !password || !game_id) throw new Error("All fields are required");

      const { data: authData, error: authError } = await supabaseClient.auth.admin.createUser({
        email: email,
        password: password,
        email_confirm: true,
      });
      if (authError) throw authError;

      const { error: profileError } = await supabaseClient
        .from("profiles")
        .insert([{ id: authData.user.id, game_id: game_id, mobile: mobile, full_name: game_id }]);

      if (profileError) {
        await supabaseClient.auth.admin.deleteUser(authData.user.id);
        throw profileError;
      }

      // === নতুন রেফারেল লজিক শুরু ===
      if (ref) {
        try {
          // রেফারকারী ইউজারের আইডি খোঁজা (game_id দিয়ে)
          const { data: referrerData } = await supabaseClient
            .from("profiles")
            .select("id")
            .eq("game_id", ref)
            .single();

          if (referrerData) {
            // রেফারেল টেবিলে Pending স্ট্যাটাসে ডাটা সেভ করা
            await supabaseClient.from("user_invited_friend_referral").insert([{
              referrer_id: referrerData.id,
              referred_user_id: authData.user.id,
              deposit_amount: 0,
              bonus_amount: 0,
              status: 'pending'
            }]);
          }
        } catch (refError) {
          // রেফারেল সেভ করতে সমস্যা হলেও সাইনআপ ফেইল হবে না
          console.error("Referral save error:", refError);
        }
      }
      // === নতুন রেফারেল লজিক শেষ ===

      return new Response(JSON.stringify({ message: "Signup successful" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200,
      });
    }

    // ২. লগইন (Login with Game ID)
    if (action === "login") {
      if (!game_id || !password) throw new Error("Game ID and password are required");

      // Game ID থেকে মোবাইল নম্বর বের করা (কারণ Auth-এ লগইন করতে ইমেইল লাগে)
      const { data: profile, error: profileError } = await supabaseClient
        .from("profiles")
        .select("mobile")
        .eq("game_id", game_id)
        .single();

      if (profileError || !profile) throw new Error("Invalid Game ID or Password");

      const loginEmail = `${profile.mobile}@user.local`;

      const supabasePublic = createClient(
        Deno.env.get("SUPABASE_URL") ?? "",
        Deno.env.get("SUPABASE_ANON_KEY") ?? ""
      );

      const { data, error } = await supabasePublic.auth.signInWithPassword({
        email: loginEmail,
        password: password,
      });

      if (error) throw new Error("Invalid Game ID or Password");
      
      return new Response(JSON.stringify({ message: "Login successful", session: data.session, user: data.user }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200,
      });
    }

    throw new Error("Invalid action");
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400,
    });
  }
});
