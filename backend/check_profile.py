from db import supabase

# Get the most recent profile
profile = supabase.table("profile").select("*").order("created_at", desc=True).limit(1).execute()
profile_id = profile.data[0]["id"]

print(f"Name:    {profile.data[0]['name']}")
print(f"Email:   {profile.data[0]['email']}")
print(f"Summary: {profile.data[0]['summary']}")

# Get skills
skills = supabase.table("skills").select("*").eq("profile_id", profile_id).execute()
print(f"\n📋 Skills saved ({len(skills.data)} total):")
for s in skills.data:
    print(f"   - {s['skill']}")

# Get experience
exp = supabase.table("experience").select("*").eq("profile_id", profile_id).execute()
print(f"\n💼 Experience ({len(exp.data)} entries):")
for e in exp.data:
    print(f"   - {e['role']} at {e['company']}")