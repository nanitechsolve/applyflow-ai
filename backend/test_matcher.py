from job_matcher import match_job

# Run directly with the new job ID
result = match_job("21f4c556-2479-4973-bf9b-50736abfaaa4")

if result:
    print(f"\n📊 Result:")
    print(f"  Score:   {result['score']}/100")
    print(f"  Missing: {result['missing_skills']}")
    print(f"  Summary: {result['explanation']}")
else:
    print("❌ Match failed")