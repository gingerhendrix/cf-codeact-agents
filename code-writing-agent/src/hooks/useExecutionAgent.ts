import {
  ClearMessagesCommand,
  InitCommand,
  SendMessageCommand,
  type IncomingMessage,
  type OutgoingMessage,
} from "@/server/messages";
import { useAgent } from "agents/react";
import type { ModelMessage, TextPart } from "ai";
import { useState } from "react";

export type Status = "submitted" | "streaming" | "ready" | "error";

export function useExecutionAgent() {
  const [messages, setMessages] = useState<ModelMessage[]>([]);
  const [streamingMessage, setStreamingMessage] = useState<{
    role: "assistant";
    content: TextPart[];
  }>({
    role: "assistant",
    content: [],
  });
  const [status, setStatus] = useState<Status>("ready");

  const agent = useAgent({
    agent: "execution-chat",
    onMessage: (message) => {
      const msg: OutgoingMessage = JSON.parse(message.data);
      console.log("Received message:", msg);
      if (msg.type === "init") {
        setMessages(msg.messages);
        setStatus("ready");
      } else if (msg.type === "new_message") {
        setMessages((prev) => [...prev, msg.message]);
      } else if (msg.type === "messages_cleared") {
        setMessages([]);
      } else if (msg.type === "StreamEvent") {
        if (msg.event.type === "start") {
          setStatus("streaming");
          setStreamingMessage({
            role: "assistant",
            content: [],
          });
        } else if (msg.event.type === "finish") {
          setStatus("ready");
        } else if (msg.event.type === "text-start") {
          setStreamingMessage((prev) => ({
            ...prev,
            content: [...prev.content, { type: "text", text: "" }],
          }));
        } else if (msg.event.type === "text-delta") {
          const delta = msg.event.text;
          setStreamingMessage((prev) => {
            const newContent = [...prev.content];
            const lastPart = newContent.at(-1);
            lastPart!.text = (lastPart?.text || "") + delta;
            return {
              ...prev,
              content: newContent,
            };
          });
        }
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
  return {
    agent,
    messages:
      status === "streaming" ? [...messages, streamingMessage] : messages,
    status,
    sendMessage,
    clearMessages,
  };
}
