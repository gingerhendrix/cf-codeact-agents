import type { ModelMessage, TextStreamPart, ToolSet } from "ai";

export type StreamPart = TextStreamPart<ToolSet>;

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
  messages: ModelMessage[];
  model: string;
};
export function InitResponse(
  messages: ModelMessage[],
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
  message: ModelMessage;
};

export type StreamEvent = {
  type: "StreamEvent";
  event: TextStreamPart<ToolSet>;
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
