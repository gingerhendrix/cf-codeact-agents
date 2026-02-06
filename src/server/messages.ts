import type { UIMessage, UIMessageChunk } from "ai";

export type InitCommand = {
  type: "init";
};
export function InitCommand(): InitCommand {
  return {
    type: "init",
  };
}

export type InitResponse = {
  type: "init";
  messages: UIMessage[];
  model: string;
};
export function InitResponse(
  messages: UIMessage[],
  model: string,
): InitResponse {
  return {
    type: "init",
    messages,
    model,
  };
}

export type SetModelCommand = {
  type: "set_model";
  model: string;
};

export function SetModelCommand(model: string): SetModelCommand {
  return {
    type: "set_model",
    model,
  };
}

export type ModelChangedEvent = {
  type: "model_changed";
  model: string;
};
export function ModelChangedEvent(model: string): ModelChangedEvent {
  return {
    type: "model_changed",
    model,
  };
}

export type SendMessageCommand = {
  type: "send_message";
  message: string;
};
export function SendMessageCommand(message: string): SendMessageCommand {
  return {
    type: "send_message",
    message,
  };
}

export type ClearMessagesCommand = {
  type: "clear_messages";
};
export function ClearMessagesCommand(): ClearMessagesCommand {
  return {
    type: "clear_messages",
  };
}

export type NewMessageEvent = {
  type: "new_message";
  message: UIMessage;
};

export type StreamEvent = {
  type: "StreamEvent";
  event: UIMessageChunk;
};

export type MessagesClearedEvent = {
  type: "messages_cleared";
};

export type IncomingMessage =
  | InitCommand
  | SetModelCommand
  | SendMessageCommand
  | ClearMessagesCommand;

export type OutgoingMessage =
  | InitResponse
  | NewMessageEvent
  | ModelChangedEvent
  | StreamEvent
  | MessagesClearedEvent;
