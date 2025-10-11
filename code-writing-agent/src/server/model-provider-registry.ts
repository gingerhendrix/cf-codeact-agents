import { env } from "cloudflare:workers";
import { createGoogleGenerativeAI, google } from "@ai-sdk/google";
import { createOpenAI } from "@ai-sdk/openai";
import {
  createProviderRegistry,
  customProvider,
  defaultSettingsMiddleware,
  wrapLanguageModel,
} from "ai";

type Provider = Parameters<typeof createProviderRegistry>[0][string];

export const openaiProvider = (): Provider => {
  const originalProvider = createOpenAI({
    baseURL: `${env.GATEWAY_BASE_URL}/openai`,
    apiKey: env.OPENAI_API_KEY,
    headers: {
      "cf-aig-authorization": `Bearer ${env.GATEWAY_TOKEN}`,
    },
  });

  const gpt5 = originalProvider("gpt-5");

  const reasoningEffort = (effort: "minimal" | "low" | "medium" | "high") =>
    defaultSettingsMiddleware({
      settings: {
        providerOptions: {
          openai: {
            reasoningSummary: "auto",
            reasoningEffort: effort,
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

export const googleProvider = (): Provider => {
  const originalProvider = createGoogleGenerativeAI({
    baseURL: `${env.GATEWAY_BASE_URL}/google-ai-studio/v1beta`,
    apiKey: env.GOOGLE_GENERATIVE_AI_API_KEY,
    headers: {
      "cf-aig-authorization": `Bearer ${env.GATEWAY_TOKEN}`,
    },
  });
  const thinkingMiddleware = defaultSettingsMiddleware({
    settings: {
      providerOptions: {
        google: {
          thinkingConfig: {
            thinkingBudget: 8192,
            includeThoughts: true,
          },
        },
      },
    },
  });
  return customProvider({
    languageModels: {
      "gemini-2.5-flash": wrapLanguageModel({
        model: originalProvider("gemini-2.5-flash-preview-09-2025"),
        middleware: [thinkingMiddleware],
      }),
      "gemini-2.5-flash-lite": wrapLanguageModel({
        model: originalProvider("gemini-2.5-flash-lite-preview-09-2025"),
        middleware: [thinkingMiddleware],
      }),
    },
    fallbackProvider: originalProvider,
  });
};

export const registry = createProviderRegistry({
  openai: openaiProvider(),
  google: createGoogleGenerativeAI({
    baseURL: `${env.GATEWAY_BASE_URL}/google-ai-studio/v1beta`,
    apiKey: env.GOOGLE_GENERATIVE_AI_API_KEY,
    headers: {
      "cf-aig-authorization": `Bearer ${env.GATEWAY_TOKEN}`,
    },
  }),
});

export type AvailableModel = Parameters<typeof registry.languageModel>[0];
