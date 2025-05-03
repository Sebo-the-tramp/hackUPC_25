"""SQLAlchemy models for the application."""

from sqlalchemy import Column, Integer, String, ForeignKey, JSON, Boolean, DateTime
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

Base = declarative_base()


class User(Base):
    """User model representing a person with a name who can have multiple profiles."""

    __tablename__ = "users"

    id = Column(Integer, primary_key=True)
    name = Column(String, nullable=False)

    # Define relationship with Profile model (one-to-many)
    profiles = relationship(
        "Profile", back_populates="user", cascade="all, delete-orphan"
    )

    def __repr__(self):
        return f"<User(id={self.id}, name='{self.name}')>"


class Trip(Base):
    """Trip model representing a trip with unique identifier."""

    __tablename__ = "trips"

    id = Column(Integer, primary_key=True)
    name = Column(String, nullable=False)

    # Define relationship with Profile model (one-to-many)
    profiles = relationship(
        "Profile", back_populates="trip", cascade="all, delete-orphan"
    )

    # Define relationship with Message model (one-to-many)
    messages = relationship(
        "Message", back_populates="trip", cascade="all, delete-orphan"
    )

    def __repr__(self):
        return f"<Trip(id={self.id}, name='{self.name}')>"


class Profile(Base):
    """Profile model representing a user's profile for a specific trip with questions/answers."""

    __tablename__ = "profiles"

    id = Column(Integer, primary_key=True)
    # Store questions and answers as JSON
    questions = Column(JSON, nullable=False)

    # Foreign key to establish relationship with Trip
    trip_id = Column(Integer, ForeignKey("trips.id"), nullable=False)
    # Relationship with Trip model
    trip = relationship("Trip", back_populates="profiles")

    # Foreign key to establish relationship with User
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    # Relationship with User model
    user = relationship("User", back_populates="profiles")

    # Define relationship with Message model (one-to-many)
    messages = relationship(
        "Message", back_populates="profile", cascade="all, delete-orphan"
    )

    def __repr__(self):
        return (
            f"<Profile(id={self.id}, user_id={self.user_id}, trip_id={self.trip_id})>"
        )


class Message(Base):
    """Message model representing a message in a trip."""

    __tablename__ = "messages"

    id = Column(Integer, primary_key=True)
    content = Column(String, nullable=False)
    is_ai = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, default=func.now(), nullable=False)

    # Foreign key to establish relationship with Trip
    trip_id = Column(Integer, ForeignKey("trips.id"), nullable=False)
    # Relationship with Trip model
    trip = relationship("Trip", back_populates="messages")

    # Foreign key to establish relationship with Profile (sender)
    profile_id = Column(
        Integer, ForeignKey("profiles.id"), nullable=True
    )  # Nullable for AI messages
    # Relationship with Profile model
    profile = relationship("Profile", back_populates="messages")

    def __repr__(self):
        sender = f"AI" if self.is_ai else f"Profile {self.profile_id}"
        return f"<Message(id={self.id}, sender={sender}, trip_id={self.trip_id})>"

