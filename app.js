// EDIT these:
export const SUPABASE_URL = "https://dgiakdurpdjtlpwudhif.supabase.co";
export const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRnaWFrZHVycGRqdGxwd3VkaGlmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE4NDEwNDcsImV4cCI6MjA3NzQxNzA0N30.L9hRV4sJc4IP8dnZ8EGCCzcWCv7v7zUlfQzXIASKhA4";

// Social links shown in sidebar
export const SOCIALS = {
  tg:  "https://t.me/shanmau",
  fb:  "https://www.facebook.com/aiaxcarttt/",
  ig:  "https://instagram.com/YOURIG"
};

// QR images
export const PAYMENT = {
  gcash:{label:"GCash",qr:"img/gcash-qr.png"},
  maya:{label:"Maya", qr:"img/maya-qr.png"}
};

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
