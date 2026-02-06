import { useAgent } from "agents/react";
import type { UIMessage, UIMessageChunk } from "ai";
import { useRef, useState } from "react";
import {
  ClearMessagesCommand,
  type IncomingMessage,
  InitCommand,
  type OutgoingMessage,
  SendMessageCommand,
} from "@/server/messages";

export type Status = "submitted" | "streaming" | "ready" | "error";

type Parts = UIMessage["parts"];
type Part = Parts[number];

export function useExecutionAgent({
  name,
  agent: agentName,
}: {
  name: string;
  agent: string;
}) {
  const [messages, setMessages] = useState<UIMessage[]>([]);
  const [streamingMessage, setStreamingMessage] = useState<UIMessage>({
    id: "",
    role: "assistant",
    parts: [],
  });
  const [status, setStatus] = useState<Status | null>(null);
  const [model, setModel] = useState<string>("");

  const currentTextIdRef = useRef<string | null>(null);
  const currentReasoningIdRef = useRef<string | null>(null);

  const updateParts = (
    updater: (parts: Parts) => Parts,
  ) => {
    setStreamingMessage((prev) => ({
      ...prev,
      parts: updater(prev.parts),
    }));
  };

  const handleStreamEvent = (event: UIMessageChunk) => {
    if (event.type === "start") {
      setStatus("streaming");
      setStreamingMessage({
        id: event.messageId ?? "",
        role: "assistant",
        parts: [],
      });
      currentTextIdRef.current = null;
      currentReasoningIdRef.current = null;
    } else if (event.type === "finish") {
      setStatus("ready");
    } else if (event.type === "text-start") {
      currentTextIdRef.current = event.id;
      updateParts((parts) => [
        ...parts,
        { type: "text" as const, text: "" },
      ]);
    } else if (event.type === "text-delta") {
      updateParts((parts) => {
        const newParts = [...parts];
        for (let i = newParts.length - 1; i >= 0; i--) {
          const p = newParts[i];
          if (p.type === "text") {
            newParts[i] = { type: "text" as const, text: p.text + event.delta };
            break;
          }
        }
        return newParts;
      });
    } else if (event.type === "reasoning-start") {
      currentReasoningIdRef.current = event.id;
      updateParts((parts) => [
        ...parts,
        { type: "reasoning" as const, text: "", state: "streaming" as const },
      ]);
    } else if (event.type === "reasoning-delta") {
      updateParts((parts) => {
        const newParts = [...parts];
        for (let i = newParts.length - 1; i >= 0; i--) {
          const p = newParts[i];
          if (p.type === "reasoning") {
            newParts[i] = { ...p, text: p.text + event.delta };
            break;
          }
        }
        return newParts;
      });
    } else if (event.type === "reasoning-end") {
      updateParts((parts) => {
        const newParts = [...parts];
        for (let i = newParts.length - 1; i >= 0; i--) {
          const p = newParts[i];
          if (p.type === "reasoning") {
            newParts[i] = { ...p, state: "done" as const };
            break;
          }
        }
        return newParts;
      });
    } else if (event.type === "tool-input-start") {
      updateParts((parts) => [
        ...parts,
        {
          type: "dynamic-tool",
          toolName: event.toolName,
          toolCallId: event.toolCallId,
          state: "input-streaming",
          input: undefined,
        } as Part,
      ]);
    } else if (event.type === "tool-input-available") {
      updateParts((parts) =>
        parts.map((p) =>
          "toolCallId" in p && p.toolCallId === event.toolCallId
            ? ({
                ...p,
                state: "input-available",
                input: event.input,
              } as Part)
            : p,
        ),
      );
    } else if (event.type === "tool-output-available") {
      updateParts((parts) =>
        parts.map((p) =>
          "toolCallId" in p && p.toolCallId === event.toolCallId
            ? ({
                ...p,
                state: "output-available",
                output: event.output,
              } as Part)
            : p,
        ),
      );
    } else if (event.type === "tool-output-error") {
      updateParts((parts) =>
        parts.map((p) =>
          "toolCallId" in p && p.toolCallId === event.toolCallId
            ? ({
                ...p,
                state: "output-error",
                errorText: event.errorText,
              } as Part)
            : p,
        ),
      );
    }
  };

  const agent = useAgent({
    name,
    agent: agentName,
    onMessage: (message) => {
      const msg: OutgoingMessage = JSON.parse(message.data);
      if (msg.type === "init") {
        setMessages(msg.messages);
        setModel(msg.model);
        setStatus("ready");
      } else if (msg.type === "new_message") {
        setMessages((prev) => [...prev, msg.message]);
      } else if (msg.type === "messages_cleared") {
        setMessages([]);
      } else if (msg.type === "model_changed") {
        setModel(msg.model);
      } else if (msg.type === "StreamEvent") {
        handleStreamEvent(msg.event);
      }
    },
    onOpen: () => send(InitCommand()),
    onClose: () => console.log("Connection closed"),
  });

  const send = (message: IncomingMessage) => {
    agent.send(JSON.stringify(message));
  };
  const sendMessage = (message: string) => {
    send(SendMessageCommand(message));
    setStatus("submitted");
  };

  const clearMessages = () => {
    send(ClearMessagesCommand());
  };

  const handleSetModel = (model: string) => {
    agent.send(JSON.stringify({ type: "set_model", model }));
  };

  return {
    agent,
    messages:
      status === "streaming"
        ? [...messages, streamingMessage]
        : messages,
    status,
    sendMessage,
    clearMessages,
    model,
    setModel: handleSetModel,
  };
}
