import { useExecutionAgent } from "@/hooks/useExecutionAgent";
import { useState } from "react";
import type { PromptInputMessage } from "./ai-elements/prompt-input";
import { Conversation } from "./conversation";
import { availableModels } from "@/shared";

export function AgentChat({ name, agent }: { name: string; agent: string }) {
  const [agentInput, setAgentInput] = useState("");
  const handleAgentSubmit = async (_input: PromptInputMessage) => {
    if (!agentInput.trim()) return;

    const message = agentInput;
    setAgentInput("");

    // Send message to agent
    sendMessage(message);
  };

  const models = Object.entries(availableModels).map(([value, name]) => ({
    name,
    value,
  }));

  const {
    messages: agentMessages,
    status,
    sendMessage,
    clearMessages,
    setModel,
    model: selectedModel,
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
      selectedModel={selectedModel}
      onModelChange={setModel}
    />
  );
}
