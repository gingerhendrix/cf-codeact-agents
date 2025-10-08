import { createOpenAI } from "@ai-sdk/openai";
import {
  createProviderRegistry,
  customProvider,
  defaultSettingsMiddleware,
  wrapLanguageModel,
} from "ai";
import { google } from "@ai-sdk/google";
import { env } from "cloudflare:workers";

type Provider = Parameters<typeof createProviderRegistry>[0][string];

export const openaiProvider = (): Provider => {
  const originalProvider = createOpenAI({
    apiKey: env.OPENAI_API_KEY,
  });

  const gpt5 = originalProvider("gpt-5");

  const reasoningEffort = (effort: "minimal" | "low" | "medium" | "high") =>
    defaultSettingsMiddleware({
      settings: {
        providerOptions: {
          openai: {
            reasoning_effort: effort,
          },
        },
      },
    });

  return customProvider({
    languageModels: {
      "gpt-5": wrapLanguageModel({
        model: gpt5,
        middleware: [reasoningEffort("medium")],
      }),
      "gpt-5-high": wrapLanguageModel({
        model: gpt5,
        middleware: [reasoningEffort("high")],
      }),
      "gpt-5-low": wrapLanguageModel({
        model: gpt5,
        middleware: [reasoningEffort("low")],
      }),
    },
    fallbackProvider: originalProvider,
  });
};

export const registry = createProviderRegistry({
  openai: createOpenAI({
    apiKey: env.OPENAI_API_KEY,
  }),
  google,
});

export type AvailableModel = Parameters<typeof registry.languageModel>[0];
