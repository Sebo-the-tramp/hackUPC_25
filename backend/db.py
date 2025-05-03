"""Database setup and configuration."""

import os
from sqlalchemy import create_engine, text
from sqlalchemy.orm import scoped_session, sessionmaker
from sqlalchemy.ext.declarative import declarative_base

# Database connection from environment variable or use default
DB_URI = os.environ.get(
    "DATABASE_URL", "postgresql+psycopg2://postgres:postgres@localhost:5432/tripdb"
)

# Create engine
engine = create_engine(DB_URI, pool_pre_ping=True)

# Create session factory
db_session = scoped_session(
    sessionmaker(autocommit=False, autoflush=False, bind=engine)
)

# Import models to ensure they are registered with the declarative base
from backend.models import Base, Trip, User, Profile, Message


def init_db():
    """Initialize database and create tables.

    If PROD environment variable is not set, drop all tables first.
    """
    # Check if we're in production mode
    is_prod = os.environ.get("PROD", "").lower() in ("true", "1", "yes")
    
    if not is_prod:
        # In development mode, drop all tables to start fresh
        # Extract username from the DB_URI for permissions
        import re
        
        # Parse username from database URL
        username_match = re.search(r"postgresql(?:\+psycopg2)?:\/\/([^:@]+)(?::[^@]*)?@", DB_URI)
        if username_match:
            db_user = username_match.group(1)
        else:
            db_user = "postgres"  # Default fallback
            
        print(f"Using database user: {db_user}")
            
        # Use raw SQL with CASCADE to handle dependent objects
        try:
            with engine.connect() as conn:
                conn.execute(text("DROP SCHEMA public CASCADE"))
                conn.execute(text("CREATE SCHEMA public"))
                conn.execute(text(f"GRANT ALL ON SCHEMA public TO {db_user}"))
                conn.execute(text("GRANT ALL ON SCHEMA public TO public"))
                conn.commit()
            print("Database schema reset with CASCADE.")
        except Exception as e:
            print(f"Error during schema reset: {e}")
            # Fallback to traditional drop_all
            try:
                Base.metadata.drop_all(bind=engine)
                print("Fallback: Database tables dropped.")
            except Exception as e2:
                print(f"Warning: Could not drop tables: {e2}")
                print("Proceeding with table creation anyway.")

    # Create all tables from the models
    Base.metadata.create_all(bind=engine)
    print("Database tables created.")
    
    # Check if the connection is working
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        print("Database connection verified.")
    except Exception as e:
        print(f"Error connecting to database: {e}")
        raise


def shutdown_session(exception=None):
    """Remove the session on app shutdown."""
    db_session.remove()
