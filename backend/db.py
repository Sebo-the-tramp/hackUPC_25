"""Database setup and configuration."""

import os
from sqlalchemy import create_engine
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
from backend.models.models import Base, Trip, User, Message


def init_db():
    """Initialize database and create tables.
    
    If PROD environment variable is not set, drop all tables first.
    """
    # Check if we're in production mode
    is_prod = os.environ.get('PROD', '').lower() in ('true', '1', 'yes')
    
    if not is_prod:
        # In development mode, drop all tables before recreating
        Base.metadata.drop_all(bind=engine)
        print("Development mode: Cleared all database tables")
    
    # Create all tables
    Base.metadata.create_all(bind=engine)
    print(f"{'Production' if is_prod else 'Development'} mode: Created all database tables")


def shutdown_session(exception=None):
    """Remove the session on app shutdown."""
    db_session.remove()

