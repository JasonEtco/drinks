import type { ToolInvocationUIPart } from "@ai-sdk/ui-utils";
import type { UIMessage } from "ai";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

type UIMessagePart = UIMessage["parts"][0];
type ToolInvocationUIPartResult = ToolInvocationUIPart & {
  toolInvocation: {
    state: "result";
  };
};

export function isToolCallResult(
  part: UIMessagePart
): part is ToolInvocationUIPartResult {
  return (
    part.type === "tool-invocation" &&
    part.toolInvocation &&
    part.toolInvocation.state === "result"
  );
}
