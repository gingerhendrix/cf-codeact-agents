import { useExecutionAgent } from "@/hooks/useExecutionAgent";
import { useState } from "react";
import type { PromptInputMessage } from "./ai-elements/prompt-input";
import { Conversation } from "./conversation";

export function AgentChat({ name, agent }: { name: string; agent: string }) {
  const [agentInput, setAgentInput] = useState("");
  const handleAgentSubmit = async (_input: PromptInputMessage) => {
    if (!agentInput.trim()) return;

    const message = agentInput;
    setAgentInput("");

    // Send message to agent
    sendMessage(message);
  };

  const models = [
    {
      name: "GPT-5",
      value: "openai:gpt-5",
    },
  ];

  const setModel = (model: string) => {
    console.log("Model set to:", model);
  };

  const {
    messages: agentMessages,
    status,
    sendMessage,
    clearMessages,
  } = useExecutionAgent({ name, agent });

  return (
    <Conversation
      messages={agentMessages}
      onSubmit={handleAgentSubmit}
      input={agentInput}
      onInputChange={setAgentInput}
      status={status}
      clearMessages={clearMessages}
      models={models}
      selectedModel="openai:gpt-5"
      onModelChange={setModel}
    />
  );
}
