import os
from supabase import create_client
from dotenv import load_dotenv

# This reads your .env file and loads the variables
load_dotenv("../.env")

# Grab the values from .env
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

# Create the Supabase client (this is our database connection)
supabase = create_client(SUPABASE_URL, SUPABASE_KEY)