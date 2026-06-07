from db import supabase

# Get the job we just saved
result = supabase.table("jobs").select("*").eq("id", "cd4a5f65-8831-4cac-a445-c6b48a9fb725").execute()

job = result.data[0]
print(f"Title:   {job['title']}")
print(f"Company: {job['company']}")
print(f"\nDescription preview:")
print(job['description_raw'][:500])