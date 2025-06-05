import type { UIMessage } from "ai";
import { MemoizedMarkdown } from "./MemoizedMarkdown";
import type { UseChatHelpers } from "@ai-sdk/react";
import { isToolCallResult } from "@/lib/utils";

function formatTime(date: Date | string): string {
  if (typeof date === "string") {
    date = new Date(date);
  }
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export function ChatMessage({
  message,
  status,
}: {
  message: UIMessage;
  status: UseChatHelpers["status"];
}) {
  let content = message.content;

  if (content === "") {
    for (const part of message.parts) {
      // If part is a tool invocation result, use its message content
      if (isToolCallResult(part)) {
        content = part.toolInvocation?.result?.message || "";
        break; // Use the first valid tool invocation result
      }
    }
  }

  return (
    <div
      key={message.id}
      className={`${message.role === "user" ? "flex justify-end" : "w-full"}`}
    >
      <div
        className={` rounded-lg px-6 py-4 ${
          message.role === "user"
            ? "max-w-[80%] bg-muted text-muted-foregroud"
            : "w-full flex-1"
        }`}
      >
        <div className="prose w-full">
          <MemoizedMarkdown id={message.id} content={content} />
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
