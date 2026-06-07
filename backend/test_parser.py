from cv_parser import parse_cv, save_profile_to_supabase

# Your real CV
result = parse_cv("Vuyolwethu_Vincent_Ndolela_CV_.pdf")

# Save to Supabase
profile_id = save_profile_to_supabase(result)

print(f"\nProfile ID in Supabase: {profile_id}")