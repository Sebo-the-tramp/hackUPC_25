"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Send, ChevronDown, ChevronRight } from "lucide-react";
import { sendMessage } from "../lib/api";
import { io, Socket } from "socket.io-client";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

type Message = {
  id: string;
  sender: "user" | "llm";
  text: string;
  timestamp: Date;
  senderName?: string;
};

type ChatInterfaceProps = {
  tripId: string;
  initialMessages?: Message[];
};

const DEFAULT_MESSAGE = {
  id: "1",
  sender: "llm",
  text: "Hi there! I'm your trip planning assistant. Ask me anything about your trip or for suggestions!",
  timestamp: new Date(),
  senderName: "AI",
};

const ChatInterface = ({ tripId, initialMessages = [] }: ChatInterfaceProps) => {
  const [messages, setMessages] = useState<Message[]>(initialMessages.length > 0 ? initialMessages : [DEFAULT_MESSAGE]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<Socket | null>(null);

  // Connect to WebSocket server and join trip room
  useEffect(() => {
    // Create socket connection
    socketRef.current = io("localhost:5000/", {
      path: "/socket.io",
      autoConnect: true,
      withCredentials: true,
    });

    const socket = socketRef.current;

    // Handle connection events
    socket.on("connect", () => {
      console.log("Connected to WebSocket server");
      // Join the trip room to receive messages
      socket.emit("join", { trip_id: parseInt(tripId) });
    });

    // Listen for new messages
    socket.on("new_message", (data) => {
      console.log("Received new message:", data);

      // Create the message object from the WebSocket data
      const newMessage: Message = {
        id: data.message_id.toString(),
        sender: data.is_ai ? "llm" : "user",
        text: data.content,
        timestamp: new Date(data.created_at),
        senderName: data.sender?.name,
      };

      // Add the message to our state, but only if:
      // 1. It's from the AI, or
      // 2. It's from another user (not the current user)
      // This prevents duplicate messages from appearing when the current user sends a message
      setMessages((prev) => {
        // Check if this message already exists in our state (avoid duplicates)
        const messageExists = prev.some((msg) => msg.id === newMessage.id);

        // If it's an AI message or a message from another user that we haven't seen before
        // Here we explicitly check sender_id to make sure it's not from our own user
        const messageFromOtherUser =
          data.sender_id &&
          prev.findIndex(
            (msg) =>
              msg.text === data.content &&
              msg.sender === "user" &&
              Math.abs(new Date(msg.timestamp).getTime() - new Date(data.created_at).getTime()) < 5000,
          ) === -1;

        if ((data.is_ai || messageFromOtherUser) && !messageExists) {
          return [...prev, newMessage];
        }

        // Otherwise, don't add the message (we already added it when the user sent it)
        return prev;
      });
    });

    // Listen for streaming message updates
    socket.on("message_stream", (data) => {
      console.log("Received streaming update:", data);
      console.log(data);

      if (data.type === "start") {
        // Start a new AI message for streaming
        const streamingMessage: Message = {
          id: data.message_id.toString(),
          sender: "llm",
          text: "",
          timestamp: new Date(),
          senderName: "AI",
        };
        setMessages((prev) => [...prev, streamingMessage]);
      } else if (data.type === "update") {
        // Update the text of the streaming message
        setMessages((prev) => {
          const updatedMessages = [...prev];
          const lastMessage = updatedMessages[updatedMessages.length - 1];

          // Only update if the message_id matches or if it's the last message and is from AI
          if (
            lastMessage &&
            (lastMessage.id === data.message_id.toString() || (lastMessage.sender === "llm" && !data.message_id))
          ) {
            lastMessage.text += data.content;
          }
          return updatedMessages;
        });
      } else if (data.type === "end") {
        // Message is complete, no action needed as we've been updating it
        // We could update any final metadata if needed
        setMessages((prev) => {
          const updatedMessages = [...prev];
          const lastMessage = updatedMessages[updatedMessages.length - 1];
          if (lastMessage && lastMessage.id === data.message_id.toString()) {
            lastMessage.timestamp = new Date(data.created_at);
          }
          return updatedMessages;
        });
      }
    });

    // Handle errors
    socket.on("connect_error", (err) => {
      console.error("WebSocket connection error:", err);
      setError("Failed to connect to chat server. Please refresh the page.");
    });

    // Cleanup on unmount
    return () => {
      if (socket) {
        socket.off("new_message");
        socket.off("connect");
        socket.off("connect_error");
        socket.disconnect();
      }
    };
  }, [tripId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!input.trim()) return;
    setError(null);

    const userMessage: Message = {
      id: Date.now().toString(), // We'll use a temporary ID until we get the real one from the server
      sender: "user",
      text: input,
      timestamp: new Date(),
      senderName: "You", // Add "You" as the sender name for the local user's messages
    };

    // Only add the user message to the local state
    // WebSocket will handle receiving both user and AI messages
    //setMessages((prev) => [...prev, userMessage]);
    const currentInput = input;
    setInput("");
    setIsLoading(true);

    try {
      // Send the message to the server
      const response = await sendMessage({
        trip_id: Number(tripId),
        content: currentInput,
      });

      if (response.error) {
        setError(response.error);
      }
      // We no longer need to add the AI's response message here
      // as it will come through the WebSocket
    } catch (err) {
      setError("Failed to send message. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col bg-white rounded-lg shadow-md overflow-y-auto h-[700px]">
      <div className="p-3 bg-indigo-600 text-white">
        <h3 className="font-medium">Trip Assistant</h3>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {error && <div className="bg-red-50 border border-red-200 text-red-600 p-3 rounded-lg text-sm">{error}</div>}

        {messages.map((message) => (
          <div key={message.id} className={`flex ${message.sender === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[80%] rounded-lg p-3 ${
                message.sender === "user"
                  ? "bg-indigo-600 text-white rounded-br-none"
                  : "bg-gray-100 text-gray-800 rounded-bl-none"
              }`}
            >
              {message.senderName && (
                <p
                  className={`text-xs ${
                    message.sender === "user" ? "text-indigo-200" : "text-indigo-600"
                  } font-medium mb-1`}
                >
                  {message.senderName}
                </p>
              )}
              {message.sender === "llm" ? (
                <div className="prose prose-sm max-w-none prose-p:text-gray-900 prose-li:text-gray-900 prose-pre:bg-gray-800 prose-pre:text-gray-100 prose-headings:text-gray-900 prose-a:text-indigo-600 break-words">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      // Add custom rendering for think sections
                      p: ({ node, children, ...props }) => {
                        const textContent = node?.children?.[0]?.value || "";

                        // Check if this is a think section opening tag
                        if (textContent.trim().startsWith("<think>")) {
                          const [_, ...rest] = children as React.ReactNode[];
                          const thinkContent = rest.length > 0 ? rest : "Thinking...";

                          // Use state to track if this section is expanded
                          const [isExpanded, setIsExpanded] = useState(false);

                          return (
                            <div className="my-2 border border-gray-200 rounded-md">
                              <button
                                onClick={() => setIsExpanded(!isExpanded)}
                                className="flex items-center justify-between w-full px-3 py-2 text-sm font-medium text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-t-md"
                              >
                                <span>Thinking process</span>
                                {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                              </button>
                              {isExpanded && (
                                <div className="p-3 text-gray-600 text-sm bg-gray-50 rounded-b-md">{thinkContent}</div>
                              )}
                            </div>
                          );
                        }

                        // Check if this is a think section closing tag
                        if (textContent.trim() === "</think>") {
                          return null;
                        }

                        // Regular paragraph
                        return <p {...props}>{children}</p>;
                      },
                    }}
                  >
                    {message.text}
                  </ReactMarkdown>
                </div>
              ) : (
                <p>{message.text}</p>
              )}
              <p className={`text-xs mt-1 ${message.sender === "user" ? "text-indigo-200" : "text-gray-500"}`}>
                {message.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </p>
            </div>
          </div>
        ))}

        {/* Loading indicator for user message being sent */}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 text-gray-800 rounded-lg rounded-bl-none p-3">
              <div className="flex space-x-2">
                <div
                  className="h-2 w-2 bg-gray-400 rounded-full animate-bounce"
                  style={{ animationDelay: "0ms" }}
                ></div>
                <div
                  className="h-2 w-2 bg-gray-400 rounded-full animate-bounce"
                  style={{ animationDelay: "150ms" }}
                ></div>
                <div
                  className="h-2 w-2 bg-gray-400 rounded-full animate-bounce"
                  style={{ animationDelay: "300ms" }}
                ></div>
              </div>
            </div>
          </div>
        )}

        {/* Loading spinner for when AI message is still generating but streaming has started */}
        {messages.length > 0 &&
          messages[messages.length - 1].sender === "llm" &&
          messages[messages.length - 1].text.endsWith("...") && (
            <div className="flex justify-start mt-1 ml-3">
              <div className="flex items-center space-x-1">
                <div className="h-3 w-3 border-t-2 border-r-2 border-indigo-500 rounded-full animate-spin"></div>
                <span className="text-xs text-gray-500">AI is thinking...</span>
              </div>
            </div>
          )}

        <div ref={messagesEndRef}></div>
      </div>

      <div className="border-t border-gray-200 p-4">
        <form onSubmit={handleSendMessage} className="flex space-x-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="flex-1 p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="Send a message..."
            disabled={isLoading}
          />
          <button
            type="submit"
            className="p-2 bg-indigo-600 text-white rounded-lg disabled:bg-indigo-400"
            disabled={isLoading || !input.trim()}
          >
            <Send size={20} />
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatInterface;
