import type { ToolInvocation, ToolInvocationUIPart } from "@ai-sdk/ui-utils";
import type { ToolResult, UIMessage } from "ai";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { RecipeToolCallResult } from "./mcp-tools";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

type UIMessagePart = UIMessage["parts"][0];
type ToolInvocationUIPartResult = ToolInvocationUIPart & {
  toolInvocation: {
    state: "result";
    step?: number;
  };
};

export function isToolCallResult(
  part: UIMessagePart
): part is ToolInvocationUIPart {
  return (
    part.type === "tool-invocation" &&
    part.toolInvocation &&
    part.toolInvocation.state === "result"
  );
}

export type RecipeToolCallInvocationResult = ToolResult<
  "created_recipe" | "edited_recipe",
  any,
  RecipeToolCallResult
>;

export type RecipeToolInvocationUIPart = Omit<ToolInvocationUIPart, 'toolInvocation'> & {
  toolInvocation: {
    state: "result";
    step?: number;
  } & RecipeToolCallInvocationResult;
};

export function isRecipeToolCallResult(
  part: ToolInvocationUIPart
): part is RecipeToolInvocationUIPart {
  return (
    part.toolInvocation.state === "result" &&
    (part.toolInvocation.toolName === "created_recipe" ||
      part.toolInvocation.toolName === "edited_recipe")
  );
}
