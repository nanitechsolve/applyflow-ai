from cv_generator import generate_documents

# Use the FACILITIES & IT SUPPORT job - our best match
job_id = "21f4c556-2479-4973-bf9b-50736abfaaa4"

result = generate_documents(job_id)

if result:
    print("\n📄 TAILORED CV PREVIEW:")
    print("=" * 50)
    print(result["cv_content"][:500])
    print("...")
    
    print("\n📝 COVER LETTER PREVIEW:")
    print("=" * 50)
    print(result["cl_content"][:500])
    print("...")
else:
    print("❌ Generation failed")