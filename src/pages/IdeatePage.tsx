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
    <>
      <Header />
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <BrainIcon className="h-8 w-8 text-primary" />
          <div>
            <h2 className="text-2xl font-semibold">Cocktail Ideate</h2>
            <p className="text-muted-foreground">
              Get AI-powered cocktail recipe ideas and inspiration
            </p>
          </div>
        </div>

        <Card className="min-h-[500px] flex flex-col">
          <CardContent className="flex-1 flex flex-col">
            <div className="flex-1 overflow-y-auto space-y-4 mb-4 max-h-96">
              {messages.length === 0 && (
                <div className="text-center text-muted-foreground py-8">
                  <BrainIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Start a conversation to get cocktail ideas!</p>
                  <p className="text-sm mt-2">
                    Try asking: "Suggest a refreshing summer cocktail" or "What
                    can I make with gin and lime?"
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

            <form onSubmit={handleSubmit} className="flex flex-col gap-2">
              <div className="flex gap-2">
                <Input
                  ref={inputRef}
                  value={input}
                  onChange={handleInputChange}
                  placeholder="Ask for cocktail ideas..."
                  disabled={status === "streaming" || status === "submitted"}
                  className="flex-1"
                  maxLength={1000}
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
                  Send
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
          </CardContent>
        </Card>
      </div>
    </>
  );
}
