from job_matcher import get_profile_from_supabase, build_profile_text

# Load profile
profile = get_profile_from_supabase()

# Build the text
profile_text = build_profile_text(profile)

print("👤 Profile text being used for matching:")
print("=" * 50)
print(profile_text)
print("=" * 50)
print(f"\nTotal characters: {len(profile_text)}")
print(f"Skills count: {len(profile.get('skills', []))}")
print("\nSkills found:")
for s in profile.get("skills", []):
    print(f"  - {s['skill']}")