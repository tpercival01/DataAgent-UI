"use client";

import React, { useState, useRef, useEffect } from "react";

interface DatasetInfo {
  session_id: string;
  remote_path: string;
  schema: Record<string, string>;
  filename: string;
}

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  stdout?: string;
  images?: string[];
  code?: string;
}

export default function Home() {
  const [datasetInfo, setDatasetInfo] = useState<DatasetInfo | null>(null);
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({behavior: "smooth"});
  }, [messages]);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    try {
      setIsLoading(true);
      const endpoint = `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/upload`;
      const response = await fetch(endpoint, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Backend error detail:", errorData);
        throw new Error(`Upload failed with status: ${response.status}. Detail: ${errorData.detail}`);
      }

      const data = await response.json();
      setDatasetInfo(data);
      setMessages([
        {
          id: "greeting",
          role: "assistant",
          content: `Successfully loaded ${data.filename}. I have analysed the schema and I am ready. What would you like to know about your data?`
        }
      ]);
      console.log("Upload success:", data);
    } catch (err){
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }

  const handleQuerySubmit = async () => {
    if (!datasetInfo || !input.trim() || isLoading){
      console.error("Missing dataset info or query");
      return;
    }

    const userQuery = input.trim();
    setInput("");

    const newUserMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      content: userQuery
    };

    setMessages((prev) => [...prev, newUserMsg]);
    setIsLoading(true);

    const chatHistoryPayload = messages.filter((msg) => msg.id !== "greeting").map((msg) => ({
      role: msg.role,
      content: msg.content + (msg.stdout ? `\n\nOutput:\n${msg.stdout}` : ""),
    }));

    try{
      const endpoint = `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/query`;
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({
          session_id: datasetInfo.session_id,
          query: userQuery,
          schema_dict: datasetInfo.schema,
          remote_path: datasetInfo.remote_path,
          filename: datasetInfo.filename,
          chat_history: chatHistoryPayload
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `Server error: ${response.status}`);
      }

      const data = await response.json();
      if (data.new_session_id){
        setDatasetInfo(prev => prev ? {...prev, session_id: data.new_session_id} : null);
      }

      if (data.status === "error") {
        setMessages((prev) => [...prev, {
          id: Date.now().toString(),
          role: "assistant",
          content: data.message
        }]);
        setIsLoading(false);
        return;
      }

      const newAssistantMsg: Message = {
        id: Date.now().toString(),
        role: "assistant",
        content: "Here are the results of your query:",
        stdout: data.stdout,
        images: data.images,
        code: data.generated_code
      };

      setMessages((prev) => [...prev, newAssistantMsg]);

    } catch (err){
      console.error(err, "An error occured when querying");
      setMessages((prev) => [...prev, {
        id: Date.now().toString(),
        role: "assistant",
        content: "A fatal error occurred while processing your request.",
      }]);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="flex flex-col h-screen bg-zinc-50 dark:bg-black font-sans">
      {/* Header */}
      <header className="bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 p-4 shrink-0 flex items-center justify-between">
        <h1 className="text-xl font-bold text-zinc-900 dark:text-white">
          AutoAnalyst
        </h1>
        {datasetInfo && (
          <div className="text-sm text-zinc-500 dark:text-zinc-400">
            Active Dataset:{" "}
            <span className="text-blue-500 font-mono">
              {datasetInfo.filename}
            </span>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-4 md:p-8 flex flex-col items-center">
        {!datasetInfo ? (
          // Upload State
          <div className="flex flex-col items-center justify-center h-full w-full max-w-md">
            <div className="bg-white dark:bg-zinc-900 p-8 rounded-xl shadow-lg border border-zinc-200 dark:border-zinc-800 w-full text-center">
              <h2 className="text-xl font-semibold text-zinc-900 dark:text-white mb-4">
                Upload Dataset
              </h2>
              <p className="text-zinc-500 dark:text-zinc-400 mb-6 text-sm">
                Upload a CSV file to begin analysis.
              </p>
              <label className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-md cursor-pointer transition-colors font-medium">
                {isLoading ? "Uploading..." : "Select CSV File"}
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleFileUpload}
                  className="hidden"
                  disabled={isLoading}
                />
              </label>
            </div>
          </div>
        ) : (
          // Chat State
          <div className="w-full max-w-4xl flex flex-col gap-6 pb-24">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col w-full max-w-3xl ${
                  msg.role === "user"
                    ? "self-end items-end"
                    : "self-start items-start"
                }`}
              >
                {/* Text Content Bubble */}
                <div
                  className={`px-4 py-3 rounded-2xl shadow-sm ${
                    msg.role === "user"
                      ? "bg-blue-600 text-white rounded-br-none"
                      : "bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 rounded-bl-none"
                  }`}
                >
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                </div>

                {/* Assistant Payload (Outputs & Charts) */}
                {msg.role === "assistant" &&
                  (msg.stdout ||
                    (msg.images && msg.images.length > 0) ||
                    msg.code) && (
                    <div className="mt-2 w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden shadow-sm flex flex-col">
                      {msg.stdout && (
                        <div className="p-4 bg-zinc-50 dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-800">
                          <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2 block">
                            Terminal Output
                          </span>
                          <pre className="text-sm font-mono text-zinc-800 dark:text-zinc-300 whitespace-pre-wrap">
                            {msg.stdout}
                          </pre>
                        </div>
                      )}

                      {msg.images && msg.images.length > 0 && (
                        <div className="p-4 flex flex-col gap-4 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-black">
                          {msg.images.map((img, idx) => (
                            <img
                              key={idx}
                              src={`data:image/png;base64,${img}`}
                              alt="Generated Chart"
                              className="rounded border border-zinc-200 dark:border-zinc-800 max-w-full object-contain bg-white"
                            />
                          ))}
                        </div>
                      )}

                      {msg.code && (
                        <details className="p-2 group">
                          <summary className="cursor-pointer text-xs font-medium text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 select-none p-2 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors inline-block">
                            View Generated Python Code
                          </summary>
                          <div className="p-4 bg-zinc-900 mt-2 rounded">
                            <pre className="text-xs font-mono text-blue-300 overflow-x-auto">
                              {msg.code}
                            </pre>
                          </div>
                        </details>
                      )}
                    </div>
                  )}
              </div>
            ))}
            {isLoading && (
              <div className="self-start px-4 py-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl rounded-bl-none shadow-sm flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce delay-75"></div>
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce delay-150"></div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </main>

      {/* Input Area */}
      {datasetInfo && (
        <div className="bg-white dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800 p-4 shrink-0">
          <div className="w-full max-w-4xl mx-auto flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) =>
                e.key === "Enter" && handleQuerySubmit()
              }
              placeholder="Ask a question about your data..."
              disabled={isLoading}
              className="flex-1 px-4 py-3 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            />
            <button
              onClick={handleQuerySubmit}
              disabled={isLoading || !input.trim()}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center justify-center min-w-[100px]"
            >
              {isLoading ? "Thinking..." : "Send"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
