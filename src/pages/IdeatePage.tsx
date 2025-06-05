import { useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  PaperPlaneRightIcon,
  SparkleIcon,
  TrashIcon,
} from "@phosphor-icons/react";
import Header from "@/components/Header";
import { useChat } from "@ai-sdk/react";
import { ChatMessage } from "@/components/ChatMessage";
import { useRecipes } from "@/contexts/RecipeContext";

export default function IdeatePage() {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const { addGeneratedRecipe } = useRecipes();

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

  // Monitor messages for successful recipe creation/editing via tool calls
  useEffect(() => {
    // Check the latest message for tool call results
    if (messages.length > 0) {
      const latestMessage = messages[messages.length - 1];
      
      // Only process assistant messages that have parts with tool invocations
      if (latestMessage.role === 'assistant' && latestMessage.parts) {
        for (const part of latestMessage.parts) {
          if (part.toolInvocation && part.toolInvocation.result) {
            const result = part.toolInvocation.result;
            
            // Check if this was a successful recipe creation
            if (part.toolInvocation.toolName === 'create_recipe' && result.success && result.recipe) {
              addGeneratedRecipe(result.recipe);
            }
            
            // Check if this was a successful recipe edit (also add to context as it may be a new version)
            if (part.toolInvocation.toolName === 'edit_recipe' && result.success && result.recipe) {
              addGeneratedRecipe(result.recipe);
            }
          }
        }
      }
    }
  }, [messages, addGeneratedRecipe]);

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
            <SparkleIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
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
          className="container max-w-2xl mx-auto p-4 shadow-md border-2 border-muted ring-1 ring-muted-foreground/20 rounded-md focus-within:ring-primary focus-within:ring-2 transition-all"
        >
          <div className="flex gap-2">
            <textarea
              ref={inputRef}
              value={input}
              onChange={handleInputChange}
              placeholder="Ask for cocktail ideas..."
              disabled={status === "streaming" || status === "submitted"}
              className="flex-1 text-lg border-0 focus:ring-0 focus:border-0 focus:outline-none resize-none"
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
