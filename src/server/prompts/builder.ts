import fs from "fs";
import path from "path";
import * as yaml from "js-yaml";
import { JSONSchemaToZod } from "@dmitryrechkin/json-schema-to-zod";
import { fileURLToPath } from "url";
import { dirname } from "path";
import { z } from "zod";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

type PromptFile = {
  messages: Array<{
    role: "system" | "user" | "assistant";
    content: string;
  }>;
  model: string;
  responseFormat: string;
  jsonSchema: string;
};

export class PromptBuilder {
  constructor(private prompts: Record<string, PromptFile>) {}

  async readFile(name: string): Promise<Prompt> {
    if (this.prompts[name]) {
      return new Prompt(this.prompts[name]);
    }
    const file = await fs.promises.readFile(
      path.join(__dirname, name + ".prompt.yml"),
      "utf8"
    );
    const r = yaml.load(file) as PromptFile;
    this.prompts[name] = r;
    return new Prompt(r);
  }
}

export class Prompt {
  private memoizedSchema: z.ZodType<any, z.ZodTypeDef, any>;

  constructor(public prompt: PromptFile) {
  }

  get schema() {
    if (this.memoizedSchema) {
      return this.memoizedSchema;
    }
    const parsed = JSON.parse(this.prompt.jsonSchema) as { schema: object };
    this.memoizedSchema = JSONSchemaToZod.convert(parsed.schema);
    return this.memoizedSchema;
  }

  messages(variables: Record<string, any> = {}): Array<{
    role: "system" | "user" | "assistant";
    content: string;
  }> {
    return this.prompt.messages.map((msg) => {
      let content = msg.content;
      for (const [key, value] of Object.entries(variables)) {
        content = content.replace(new RegExp(`{{${key}}}`, "g"), value);
      }
      return { ...msg, content };
    });
  }
}
