import type { UIMessage } from "ai";
import { MemoizedMarkdown } from "./MemoizedMarkdown";
import type { UseChatHelpers } from "@ai-sdk/react";

const formatTime = (date: Date) => {
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
};

export function ChatMessage({
  message,
  status,
}: {
  message: UIMessage;
  status: UseChatHelpers["status"];
}) {
  return (
    <div
      key={message.id}
      className={`flex ${
        message.role === "user" ? "justify-end" : "justify-start"
      }`}
    >
      <div
        className={` rounded-lg px-6 py-4 ${
          message.role === "user"
            ? "max-w-[80%] bg-muted text-muted-foregroud"
            : "w-full"
        }`}
      >
        <div className="prose space-y-2">
          <MemoizedMarkdown id={message.id} content={message.content} />
        </div>

        {message.role === "assistant" &&
          status === "streaming" &&
          message.content && (
            <span className="inline-block w-2 h-4 bg-current opacity-70 animate-pulse ml-1">
              |
            </span>
          )}
        <p className="text-xs opacity-70 mt-1">
          {formatTime(message.createdAt)}
        </p>
      </div>
    </div>
  );
}
