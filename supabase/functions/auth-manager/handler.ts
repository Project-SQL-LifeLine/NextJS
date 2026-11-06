// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { action, mobile, password, full_name, game_id } = await req.json();
    const email = mobile ? `${mobile}@user.local` : "";

    // ১. সাইনআপ (Signup)
    if (action === "signup") {
      if (!mobile || !password || !full_name || !game_id) {
        throw new Error("Full name, mobile, game_id and password are required");
      }

      // Auth-এ ইউজার তৈরি
      const { data: authData, error: authError } = await supabaseClient.auth.admin.createUser({
        email: email,
        password: password,
        email_confirm: true,
      });

      if (authError) throw authError;

      // profiles টেবিলে ডাটা ইনসার্ট
      const { error: profileError } = await supabaseClient
        .from("profiles")
        .insert([
          {
            id: authData.user.id,
            full_name: full_name,
            mobile: mobile,
            game_id: game_id,
          }
        ]);

      if (profileError) {
        // যদি প্রোফাইল তৈরি ব্যর্থ হয়, তবে Auth ইউজারটাও ডিলিট করে দিবে
        await supabaseClient.auth.admin.deleteUser(authData.user.id);
        throw profileError;
      }

      return new Response(JSON.stringify({ message: "Signup successful" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // ২. লগইন (Login)
    if (action === "login") {
      if (!mobile || !password) throw new Error("Mobile and password are required");
      
      const supabasePublic = createClient(
        Deno.env.get("SUPABASE_URL") ?? "",
        Deno.env.get("SUPABASE_ANON_KEY") ?? ""
      );

      const { data, error } = await supabasePublic.auth.signInWithPassword({
        email: email,
        password: password,
      });

      if (error) throw error;
      return new Response(JSON.stringify({ message: "Login successful", session: data.session, user: data.user }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // ৩. লগআউট (Logout)
    if (action === "logout") {
      const { error } = await supabaseClient.auth.admin.signOut(req.headers.get("Authorization")?.replace("Bearer ", "") || "");
      if (error) throw error;
      return new Response(JSON.stringify({ message: "Logout successful" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // ৪. ইউজার ইনফো (Get User)
    if (action === "get-user") {
      const token = req.headers.get("Authorization")?.replace("Bearer ", "");
      if (!token) throw new Error("No token provided");
      
      const { data: { user }, error } = await supabaseClient.auth.getUser(token);
      if (error) throw error;

      // profiles টেবিল থেকে ইউজারের সম্পূর্ণ ডাটা আনা
      const { data: profile, error: profileError } = await supabaseClient
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (profileError) throw profileError;

      return new Response(JSON.stringify({ user, profile }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    throw new Error("Invalid action");

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
