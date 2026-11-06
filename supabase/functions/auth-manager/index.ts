import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// CORS হেডার (ফ্রন্টএন্ড থেকে কল করার জন্য)
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // CORS হ্যান্ডলিং
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Supabase ক্লায়েন্ট (Admin privilege)
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // রিকোয়েস্ট বডি থেকে ডাটা নেওয়া
    const { action, mobile, password } = await req.json();

    // মোবাইল নম্বরকে ইমেইল ফরম্যাটে কনভার্ট করা
    const email = mobile ? `${mobile}@user.local` : "";

    // ১. সাইনআপ (Signup)
    if (action === "signup") {
      if (!mobile || !password) {
        throw new Error("Mobile and password are required");
      }
      
      const { data, error } = await supabaseClient.auth.admin.createUser({
        email: email,
        password: password,
        email_confirm: true, // অটো কনফার্ম (OTP বা লিংক লাগবে না)
      });

      if (error) throw error;
      return new Response(JSON.stringify({ message: "Signup successful", user: data.user }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // ২. লগইন (Login)
    if (action === "login") {
      if (!mobile || !password) {
        throw new Error("Mobile and password are required");
      }

      // পাবলিক ক্লায়েন্ট দিয়ে পাসওয়ার্ড লগইন
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
      // সেশন ক্লায়ার করা
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

      return new Response(JSON.stringify({ user }), {
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
