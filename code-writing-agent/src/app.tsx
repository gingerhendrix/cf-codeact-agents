/** biome-ignore-all lint/correctness/useUniqueElementIds: it's alright */
import { useCallback, useEffect, useState } from "react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./components/ui/select";
import { AgentChat } from "./components/agent-chat";

export default function Chat() {
  const [theme, setTheme] = useState<"dark" | "light">(() => {
    // Check localStorage first, default to dark if not found
    const savedTheme = localStorage.getItem("theme");
    return (savedTheme as "dark" | "light") || "dark";
  });
  useEffect(() => {
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
      document.documentElement.classList.remove("light");
    } else {
      document.documentElement.classList.remove("dark");
      document.documentElement.classList.add("light");
    }
    localStorage.setItem("theme", theme);
  }, [theme]);

  const agents = [
    {
      name: "Code Execution Agent",
      value: "execution-chat",
    },
    {
      name: "Simple Execution Agent",
      value: "simple-agent",
    },
  ];
  const [agent, setAgent] = useState<string>("execution-chat");
  const [name, setName] = useState<string>(crypto.randomUUID());
  const handleAgentChange = useCallback(
    (newAgent: string) => {
      setAgent(newAgent);
      setName(crypto.randomUUID()); // Reset name to a new UUID when agent changes
    },
    [setAgent, setName],
  );

  return (
    <div className="h-[100vh] w-full p-4 flex flex-col justify-center items-center bg-fixed overflow-hidden">
      <div className="bg-background w-full max-w-4xl m-4 p-4 rounded-md flex justify-between items-center">
        <h1 className="text-2xl font-bold">Code Act Agents</h1>
        <Select
          value={agent}
          onValueChange={(agent: string) => handleAgentChange(agent)}
        >
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Select Agent" />
          </SelectTrigger>
          <SelectContent>
            {agents.map((agent) => (
              <SelectItem key={agent.value} value={agent.value}>
                {agent.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={theme}
          onValueChange={(theme: "dark" | "light") => setTheme(theme)}
        >
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Select Theme" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="light">Light Theme</SelectItem>
            <SelectItem value="dark">Dark Theme</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="max-w-4xl mx-auto p-6 relative h-[calc(100vh-200px)] w-full">
        <AgentChat agent={agent} name={name} key={name} />
      </div>
    </div>
  );
}
