"""SQLAlchemy models for the application."""

from typing import List, Optional, Dict, Any
from datetime import datetime
from sqlalchemy import String, ForeignKey, JSON, Boolean, DateTime, Integer, inspect
from sqlalchemy.orm import DeclarativeBase, MappedAsDataclass, relationship, Mapped, mapped_column
from sqlalchemy.sql import func
from sqlalchemy_serializer import SerializerMixin

class Base(DeclarativeBase, SerializerMixin):
    """Base class for all models with advanced serialization control."""
    pass
    

class User(Base):
    serialize_only = ("id",)
    """User model representing a person with a name who can have multiple profiles."""

    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True, )
    name: Mapped[str] = mapped_column(String, nullable=False)

    profiles: Mapped[List["Profile"]] = relationship(
        back_populates="user", cascade="all, delete-orphan", 
    )
    
    trips: Mapped[List["Trip"]] = relationship(
        "Trip",
        secondary="profiles",
        primaryjoin="User.id == Profile.user_id",
        secondaryjoin="and_(Trip.id == Profile.trip_id, Profile.deleted == False)",
        viewonly=True,
        
    )

    def __repr__(self) -> str:
        return f"<User(id={self.id}, name='{self.name}')>"


class Trip(Base):
    """Trip model representing a trip with unique identifier."""

    __tablename__ = "trips"

    id: Mapped[int] = mapped_column(primary_key=True, )
    name: Mapped[str] = mapped_column(String, nullable=False)

    profiles: Mapped[List["Profile"]] = relationship(
        back_populates="trip", cascade="all, delete-orphan", 
    )

    messages: Mapped[List["Message"]] = relationship(
        back_populates="trip", cascade="all, delete-orphan", 
    )

    users: Mapped[List["User"]] = relationship(
        "User",
        secondary="profiles",
        viewonly=True,
        primaryjoin="Trip.id == Profile.trip_id",
        secondaryjoin="and_(User.id == Profile.user_id, Profile.deleted == False)",
        
    )

    def __repr__(self) -> str:
        return f"<Trip(id={self.id}, name='{self.name}')>"


class Profile(Base):
    """Profile model representing a user's profile for a specific trip with questions/answers."""

    __tablename__ = "profiles"

    id: Mapped[int] = mapped_column(primary_key=True, )
    trip_id: Mapped[int] = mapped_column(ForeignKey("trips.id"), nullable=False)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    questions: Mapped[Dict[str, Any]] = mapped_column(JSON, nullable=False)
    deleted: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    trip: Mapped["Trip"] = relationship(back_populates="profiles", )
    user: Mapped["User"] = relationship(back_populates="profiles", )

    messages: Mapped[List["Message"]] = relationship(
        back_populates="profile", cascade="all, delete-orphan", 
    )

    def __repr__(self) -> str:
        return f"<Profile(id={self.id}, user_id={self.user_id}, trip_id={self.trip_id}, deleted={self.deleted})>"


class Message(Base):
    """Message model representing a message in a trip."""

    __tablename__ = "messages"

    id: Mapped[int] = mapped_column(primary_key=True, )
    trip_id: Mapped[int] = mapped_column(ForeignKey("trips.id"), nullable=False)
    profile_id: Mapped[Optional[int]] = mapped_column(
        ForeignKey("profiles.id"), nullable=True
    )
    content: Mapped[str] = mapped_column(String, nullable=False)
    is_ai: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=func.now(), nullable=False
    )
    
    trip: Mapped["Trip"] = relationship(back_populates="messages", )
    profile: Mapped[Optional["Profile"]] = relationship(back_populates="messages", )

    user: Mapped[Optional["User"]] = relationship(
        "User",
        secondary="profiles",
        viewonly=True,
        uselist=False,
        primaryjoin="Message.profile_id == Profile.id",
        secondaryjoin="Profile.user_id == User.id",
        
    )

    def __repr__(self) -> str:
        sender = f"AI" if self.is_ai else f"Profile {self.profile_id}"
        return f"<Message(id={self.id}, sender={sender}, trip_id={self.trip_id})>"
