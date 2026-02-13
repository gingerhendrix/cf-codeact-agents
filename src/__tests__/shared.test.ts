import { describe, expect, it } from "vitest";
import { availableModels, availableAgents } from "../shared";

describe("shared config", () => {
  describe("availableModels", () => {
    it("is a non-empty object", () => {
      expect(Object.keys(availableModels).length).toBeGreaterThan(0);
    });

    it("contains expected model keys", () => {
      expect("openai:gpt-5" in availableModels).toBe(true);
      expect("google:gemini-2.5-flash" in availableModels).toBe(true);
    });

    it("has string display names for all models", () => {
      for (const [key, value] of Object.entries(availableModels)) {
        expect(typeof key).toBe("string");
        expect(typeof value).toBe("string");
        expect(value.length).toBeGreaterThan(0);
      }
    });
  });

  describe("availableAgents", () => {
    it("is a non-empty object", () => {
      expect(Object.keys(availableAgents).length).toBeGreaterThan(0);
    });

    it("contains expected agent keys", () => {
      expect("simple-agent" in availableAgents).toBe(true);
      expect("fetch-agent" in availableAgents).toBe(true);
    });

    it("has string display names for all agents", () => {
      for (const [key, value] of Object.entries(availableAgents)) {
        expect(typeof key).toBe("string");
        expect(typeof value).toBe("string");
        expect(value.length).toBeGreaterThan(0);
      }
    });
  });
});
