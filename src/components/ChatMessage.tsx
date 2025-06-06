import type { UIMessage } from "ai";
import { MemoizedMarkdown } from "./MemoizedMarkdown";
import type { UseChatHelpers } from "@ai-sdk/react";
import { isRecipeToolCallResult, isToolCallResult } from "@/lib/utils";
import { WarningIcon } from "@phosphor-icons/react";
import { Link } from "react-router-dom";
import { RecipeListItem } from "./RecipeListItem";

function formatTime(date: Date | string): string {
  if (typeof date === "string") {
    date = new Date(date);
  }
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function BasicChatMessage({
  message,
  status,
}: {
  message: UIMessage;
  status: UseChatHelpers["status"];
}) {
  return (
    <div
      key={message.id}
      className={`${message.role === "user" ? "flex justify-end" : "w-full"}`}
    >
      <div
        className={`rounded-lg px-6 py-4 ${
          message.role === "user"
            ? "max-w-[80%] bg-muted text-muted-foregroud"
            : "w-full flex-1"
        }`}
      >
        <div className="prose max-w-full w-full">
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

export function ChatMessage({
  message,
  status,
}: {
  message: UIMessage;
  status: UseChatHelpers["status"];
}) {
  if (message.role === "assistant") {
    for (const part of message.parts) {
      // If part is a tool invocation result, use its message content
      if (isToolCallResult(part)) {
        if (isRecipeToolCallResult(part)) {
          if (!part.toolInvocation.result.success) {
            return (
              <div>
                <WarningIcon /> Something bad happened!
              </div>
            );
          }

          const recipe = part.toolInvocation.result.recipe;
          return (
            <Link
              to={`/recipes/${recipe.id}`}
              className="block rounded-lg border mt-6 mb-2 shadow-md border-muted hover:border-primary transition-colors"
            >
              <RecipeListItem recipe={recipe} isLast />
            </Link>
          );
        }
      }
    }
  }

  return <BasicChatMessage message={message} status={status} />;
}
