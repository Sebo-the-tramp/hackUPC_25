// Type definitions for the application

export type Airport = {
    code: string;
    name: string;
    lat: number;
    lng: number;
  };
  
  export type User = {
    id: string;
    name: string;
    preferences?: string;
    homeAirport?: string | null;
  };
  
  export type Trip = {
    id: string;
    name: string;
    creator: User;
    members: User[];
    createdAt: string;
  };
  
  export type Message = {
    id: string;
    sender: 'user' | 'llm';
    text: string;
    timestamp: Date;
  };
  
  export type Question = {
    id: number;
    text: string;
    options: string[];
  };