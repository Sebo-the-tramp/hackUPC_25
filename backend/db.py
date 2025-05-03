"""Database setup and configuration."""

import os
import hashlib
import json
from sqlalchemy import create_engine, text, inspect, MetaData
from sqlalchemy.orm import scoped_session, sessionmaker

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


def get_schema_hash():
    """Generate a hash of the current schema definition.
    
    This creates a deterministic representation of the schema structure
    that can be used to detect changes.
    """
    schema_data = {}
    for cls in [Trip, User, Profile, Message]:
        table_info = {}
        for column in cls.__table__.columns:
            col_info = {
                "type": str(column.type),
                "nullable": column.nullable,
                "primary_key": column.primary_key,
                "foreign_keys": [str(fk.target_fullname) for fk in column.foreign_keys]
            }
            table_info[column.name] = col_info
        schema_data[cls.__tablename__] = table_info
    
    # Create a stable string representation
    schema_json = json.dumps(schema_data, sort_keys=True)
    return hashlib.sha256(schema_json.encode()).hexdigest()


def check_schema_version_table_exists():
    """Check if the schema_version table exists."""
    inspector = inspect(engine)
    return "schema_version" in inspector.get_table_names()


def get_current_db_schema_version():
    """Get the current schema version from the database."""
    if not check_schema_version_table_exists():
        return None
    
    try:
        with engine.connect() as conn:
            result = conn.execute(text("SELECT version FROM schema_version"))
            row = result.fetchone()
            return row[0] if row else None
    except Exception:
        return None


def update_schema_version(schema_hash):
    """Update the schema version in the database."""
    try:
        with engine.connect() as conn:
            if check_schema_version_table_exists():
                conn.execute(text("DELETE FROM schema_version"))
            else:
                conn.execute(text("CREATE TABLE schema_version (version VARCHAR(64) PRIMARY KEY)"))
            
            conn.execute(text("INSERT INTO schema_version (version) VALUES (:version)"), 
                        {"version": schema_hash})
            conn.commit()
        print(f"Schema version updated to: {schema_hash}")
    except Exception as e:
        print(f"Error updating schema version: {e}")


def init_db():
    """Initialize database and create tables.
    
    In development mode:
    - If schema has changed since last run, reset the database
    - If schema is unchanged, preserve the data
    
    In production mode:
    - Never reset the database, only create missing tables
    """
    # Check if we're in production mode
    is_prod = os.environ.get("PROD", "").lower() in ("true", "1", "yes")
    force_reset = os.environ.get("FORCE_RESET", "").lower() in ("true", "1", "yes")
    
    # Calculate current schema hash
    current_schema_hash = get_schema_hash()
    
    # Check if we need to reset the database in development mode
    reset_needed = False
    
    if not is_prod:
        if force_reset:
            reset_needed = True
            print("Forced database reset requested.")
        else:
            # Check the stored schema version
            stored_schema_hash = get_current_db_schema_version()
            
            if stored_schema_hash is None:
                print("No previous schema version found or schema_version table doesn't exist.")
                reset_needed = True
            elif stored_schema_hash != current_schema_hash:
                print(f"Schema changed: {stored_schema_hash} -> {current_schema_hash}")
                reset_needed = True
            else:
                print("Schema unchanged, preserving existing data.")
    
    if reset_needed:
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
    
    # Store the current schema version
    update_schema_version(current_schema_hash)
    
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
