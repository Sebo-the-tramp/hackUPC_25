"""SQLAlchemy models for the application."""
from sqlalchemy import Column, Integer, String, ForeignKey, JSON, Boolean, DateTime
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

Base = declarative_base()

class Trip(Base):
    """Trip model representing a trip with unique identifier."""
    __tablename__ = 'trips'

    id = Column(Integer, primary_key=True)
    name = Column(String, nullable=False)
    
    # Define relationship with User model (one-to-many)
    users = relationship("User", back_populates="trip", cascade="all, delete-orphan")
    
    # Define relationship with Message model (one-to-many)
    messages = relationship("Message", back_populates="trip", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Trip(id={self.id}, name='{self.name}')>"

class User(Base):
    """User model representing a user with name and questions data."""
    __tablename__ = 'users'

    id = Column(Integer, primary_key=True)
    name = Column(String, nullable=False)
    # Store questions and answers as JSON
    questions = Column(JSON, nullable=False)
    
    # Foreign key to establish relationship with Trip
    trip_id = Column(Integer, ForeignKey('trips.id'), nullable=False)
    # Relationship with Trip model
    trip = relationship("Trip", back_populates="users")
    
    # Define relationship with Message model (one-to-many)
    messages = relationship("Message", back_populates="user", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<User(id={self.id}, name='{self.name}', trip_id={self.trip_id})>"
        
        
class Message(Base):
    """Message model representing a message in a trip."""
    __tablename__ = 'messages'
    
    id = Column(Integer, primary_key=True)
    content = Column(String, nullable=False)
    is_ai = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, default=func.now(), nullable=False)
    
    # Foreign key to establish relationship with Trip
    trip_id = Column(Integer, ForeignKey('trips.id'), nullable=False)
    # Relationship with Trip model
    trip = relationship("Trip", back_populates="messages")
    
    # Foreign key to establish relationship with User (sender)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=True)  # Nullable for AI messages
    # Relationship with User model
    user = relationship("User", back_populates="messages")
    
    def __repr__(self):
        sender = f"AI" if self.is_ai else f"User {self.user_id}"
        return f"<Message(id={self.id}, sender={sender}, trip_id={self.trip_id})>"