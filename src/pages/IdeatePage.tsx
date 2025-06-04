import { useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  PaperPlaneRightIcon,
  BrainIcon,
  TrashIcon,
} from "@phosphor-icons/react";
import Header from "@/components/Header";
import { useChat } from "@ai-sdk/react";
import { ChatMessage } from "@/components/ChatMessage";

export default function IdeatePage() {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const {
    messages,
    input,
    handleSubmit,
    handleInputChange,
    status,
    setMessages,
  } = useChat();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Focus input on component mount and after submission
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (status === "ready" && messages.length > 0) {
      inputRef.current?.focus();
    }
  }, [status, messages.length]);

  const handleClearChat = () => {
    setMessages([]);
    inputRef.current?.focus();
  };

  return (
    <div className="space-y-6 pb-16">
      <div className="flex-1 overflow-y-auto space-y-4 mb-4 max-w-[800px] mx-auto">
        {messages.length === 0 && (
          <div className="text-center text-muted-foreground py-16">
            <BrainIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Start a conversation to get cocktail ideas!</p>
            <p className="text-sm mt-2">
              Try asking: "Suggest a refreshing summer cocktail" or "What can I
              make with gin and lime?"
            </p>
          </div>
        )}

        {messages.map((message) => (
          <ChatMessage message={message} status={status} />
        ))}

        {status === "streaming" &&
          messages.length > 0 &&
          messages[messages.length - 1].role === "user" && (
            <div className="flex justify-start">
              <div className="bg-muted text-muted-foreground rounded-lg px-4 py-2">
                <div className="flex items-center gap-2">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-current rounded-full animate-pulse"></div>
                    <div
                      className="w-2 h-2 bg-current rounded-full animate-pulse"
                      style={{ animationDelay: "0.2s" }}
                    ></div>
                    <div
                      className="w-2 h-2 bg-current rounded-full animate-pulse"
                      style={{ animationDelay: "0.4s" }}
                    ></div>
                  </div>
                  <span className="text-sm">Thinking...</span>
                </div>
              </div>
            </div>
          )}

        <div ref={messagesEndRef} />
      </div>

      <div className="fixed z-50 bg-background bottom-6 left-0 right-0">
        <form
          onSubmit={handleSubmit}
          className="w-[768px] max-w-full mx-auto p-6 shadow-md border-2 border-muted ring-1 ring-muted-foreground/20 rounded-md focus-within:ring-accent focus-within:ring-2 transition-all"
        >
          <div className="flex gap-2">
            <input
              ref={inputRef}
              value={input}
              onChange={handleInputChange}
              placeholder="Ask for cocktail ideas..."
              disabled={status === "streaming" || status === "submitted"}
              className="flex-1 text-lg border-0 focus:ring-0 focus:border-0 focus:outline-none"
              maxLength={1000}
              autoFocus
            />
            <Button
              type="submit"
              disabled={
                status === "streaming" ||
                status === "submitted" ||
                !input.trim() ||
                input.length > 1000
              }
            >
              <PaperPlaneRightIcon className="h-4 w-4" />
            </Button>
            {messages.length > 0 && (
              <Button
                type="button"
                variant="outline"
                onClick={handleClearChat}
                disabled={status === "streaming" || status === "submitted"}
              >
                <TrashIcon className="h-4 w-4" />
              </Button>
            )}
          </div>
          {input.length > 900 && (
            <p
              className={`text-xs text-right ${
                input.length > 1000
                  ? "text-destructive"
                  : "text-muted-foreground"
              }`}
            >
              {input.length}/1000 characters
            </p>
          )}
        </form>
      </div>
    </div>
  );
}
