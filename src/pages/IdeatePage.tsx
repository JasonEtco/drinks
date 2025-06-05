import { useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { PaperPlaneRightIcon, SparkleIcon, XIcon } from "@phosphor-icons/react";
import { useChat } from "@ai-sdk/react";
import { ChatMessage } from "@/components/ChatMessage";
import { useRecipes } from "@/contexts/RecipeContext";
import {
  saveChatHistory,
  loadChatHistory,
  clearChatHistory,
} from "@/lib/storage";
import { isToolCallResult } from "@/lib/utils";

export default function IdeatePage() {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const { addGeneratedRecipe, updateExistingRecipe } = useRecipes();

  const {
    messages,
    input,
    handleSubmit,
    handleInputChange,
    status,
    setMessages,
  } = useChat();

  // Load chat history on component mount
  useEffect(() => {
    const savedHistory = loadChatHistory();
    if (savedHistory.length > 0) {
      setMessages(savedHistory);
    }
  }, [setMessages]);

  // Save chat history whenever messages change
  useEffect(() => {
    if (messages.length > 0) {
      saveChatHistory(messages);
    }
  }, [messages]);

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
      if (latestMessage.role === "assistant" && latestMessage.parts) {
        for (const part of latestMessage.parts) {
          if (isToolCallResult(part)) {
            const result = part.toolInvocation.result;

            // Check if this was a successful recipe creation
            if (
              part.toolInvocation.toolName === "create_recipe" &&
              result.success &&
              result.recipe
            ) {
              addGeneratedRecipe(result.recipe);
            }

            // Check if this was a successful recipe edit (also add to context as it may be a new version)
            if (
              part.toolInvocation.toolName === "edit_recipe" &&
              result.success &&
              result.recipe
            ) {
              updateExistingRecipe(result.recipe);
            }
          }
        }
      }
    }
  }, [messages, addGeneratedRecipe, updateExistingRecipe]);

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
    clearChatHistory();
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (
        input.trim() &&
        input.length <= 1000 &&
        status !== "streaming" &&
        status !== "submitted"
      ) {
        handleSubmit(e as any);
      }
    }
  };

  return (
    <div className="space-y-6 flex-1 flex flex-col overflow-y-auto w-full">
      <div className="flex-1 overflow-y-auto space-y-4 mb-2 mx-auto w-full">
        <div className="container max-w-4xl">
          {messages.length === 0 && (
            <div className="text-center text-muted-foreground py-16">
              <SparkleIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Start a conversation to get cocktail ideas!</p>
              <p className="text-sm mt-2">
                Try asking: "Suggest a refreshing summer cocktail" or "What can
                I make with gin and lime?"
              </p>
            </div>
          )}

          {messages.map((message) => (
            <ChatMessage key={message.id} message={message} status={status} />
          ))}

          {(status === "streaming" || status === "submitted") &&
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
                    <span className="text-sm">
                      {status === "submitted" ? "Sending..." : "Thinking..."}
                    </span>
                  </div>
                </div>
              </div>
            )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      <div className="p-2">
        <form
          onSubmit={handleSubmit}
          className="container sm:max-w-4xl w-full bg-background mx-auto p-4 shadow-md border-2 border-muted ring-1 ring-muted-foreground/20 rounded-md focus-within:ring-primary focus-within:ring-2 transition-all"
        >
          <div className="flex gap-2">
            <textarea
              ref={inputRef}
              value={input}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder="Ask for cocktail ideas..."
              disabled={status === "streaming" || status === "submitted"}
              className="flex-1 text-base border-0 focus:ring-0 focus:border-0 focus:outline-none resize-none"
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
                <XIcon className="h-4 w-4" />
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
