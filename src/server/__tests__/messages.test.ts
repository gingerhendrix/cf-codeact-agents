import { describe, expect, it } from "vitest";
import {
  InitCommand,
  InitResponse,
  SetModelCommand,
  SendMessageCommand,
  ClearMessagesCommand,
  ModelChangedEvent,
} from "../messages";

describe("message constructors", () => {
  describe("InitCommand", () => {
    it("returns an object with type 'init'", () => {
      expect(InitCommand()).toEqual({ type: "init" });
    });
  });

  describe("InitResponse", () => {
    it("returns correct shape with messages and model", () => {
      const messages = [
        { id: "1", role: "user" as const, parts: [{ type: "text" as const, text: "hello" }] },
      ];
      const result = InitResponse(messages, "gpt-5");
      expect(result).toEqual({
        type: "init",
        messages,
        model: "gpt-5",
      });
    });

    it("handles empty messages array", () => {
      const result = InitResponse([], "gpt-5");
      expect(result).toEqual({
        type: "init",
        messages: [],
        model: "gpt-5",
      });
    });
  });

  describe("SetModelCommand", () => {
    it("returns correct shape with model", () => {
      expect(SetModelCommand("gpt-5")).toEqual({
        type: "set_model",
        model: "gpt-5",
      });
    });
  });

  describe("ModelChangedEvent", () => {
    it("returns correct shape with model", () => {
      expect(ModelChangedEvent("gpt-5")).toEqual({
        type: "model_changed",
        model: "gpt-5",
      });
    });
  });

  describe("SendMessageCommand", () => {
    it("returns correct shape with message", () => {
      expect(SendMessageCommand("hello world")).toEqual({
        type: "send_message",
        message: "hello world",
      });
    });
  });

  describe("ClearMessagesCommand", () => {
    it("returns an object with type 'clear_messages'", () => {
      expect(ClearMessagesCommand()).toEqual({ type: "clear_messages" });
    });
  });
});
