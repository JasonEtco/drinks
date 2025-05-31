import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PaperPlaneRightIcon, BrainIcon } from "@phosphor-icons/react";
import { toast } from "sonner";
import Header from "@/components/Header";
import { ApiService } from "@/lib/api";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

export default function IdeatePage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!input.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const data = await ApiService.chat(userMessage.content);
      
      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.response,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Chat error:", error);
      toast.error(error instanceof Error ? error.message : "Failed to get response");
    } finally {
      setIsLoading(false);
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
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
          <CardHeader>
            <CardTitle>Chat with our cocktail expert</CardTitle>
          </CardHeader>
          
          <CardContent className="flex-1 flex flex-col">
            <div className="flex-1 overflow-y-auto space-y-4 mb-4 max-h-96">
              {messages.length === 0 && (
                <div className="text-center text-muted-foreground py-8">
                  <BrainIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Start a conversation to get cocktail ideas!</p>
                  <p className="text-sm mt-2">
                    Try asking: "Suggest a refreshing summer cocktail" or "What can I make with gin and lime?"
                  </p>
                </div>
              )}
              
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg px-4 py-2 ${
                      message.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{message.content}</p>
                    <p className="text-xs opacity-70 mt-1">
                      {formatTime(message.timestamp)}
                    </p>
                  </div>
                </div>
              ))}
              
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-muted text-muted-foreground rounded-lg px-4 py-2">
                    <div className="flex items-center gap-2">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-current rounded-full animate-pulse"></div>
                        <div className="w-2 h-2 bg-current rounded-full animate-pulse" style={{animationDelay: '0.2s'}}></div>
                        <div className="w-2 h-2 bg-current rounded-full animate-pulse" style={{animationDelay: '0.4s'}}></div>
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
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask for cocktail ideas..."
                  disabled={isLoading}
                  className="flex-1"
                  maxLength={1000}
                />
                <Button type="submit" disabled={isLoading || !input.trim() || input.length > 1000}>
                  <PaperPlaneRightIcon className="h-4 w-4" />
                  Send
                </Button>
              </div>
              {input.length > 900 && (
                <p className={`text-xs text-right ${input.length > 1000 ? 'text-destructive' : 'text-muted-foreground'}`}>
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