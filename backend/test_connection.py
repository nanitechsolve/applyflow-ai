from db import supabase

# Try to fetch from our audit_log table
result = supabase.table("audit_log").select("*").limit(1).execute()

print("✅ Supabase connected successfully!")
print("Tables are ready to use.")