declare module "prompts" {
  interface PromptObject {
    type: string;
    name: string;
    message: string;
    initial?: string | boolean;
    validate?: (value: string) => boolean | string;
    mask?: string;
  }

  interface PromptResponse {
    [key: string]: string | boolean;
  }

  function prompts(
    questions: PromptObject | PromptObject[],
  ): Promise<PromptResponse>;

  export default prompts;
}
