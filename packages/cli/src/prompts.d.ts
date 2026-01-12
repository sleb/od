declare module "prompts" {
  export interface PromptObject {
    type: string;
    name: string;
    message: string;
    initial?: string | boolean | number;
    validate?: (value: string) => boolean | string;
    mask?: string;
    choices?: Array<{
      title: string;
      value: string | number | boolean;
      description?: string;
    }>;
  }

  export interface PromptResponse {
    [key: string]: string | boolean | number | undefined;
  }

  export default function prompts(
    questions: PromptObject | PromptObject[],
  ): Promise<PromptResponse>;
}
