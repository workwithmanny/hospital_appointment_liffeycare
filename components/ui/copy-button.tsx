"use client";
import { useState } from "react";
import { Copy, Check } from "lucide-react";
export function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy: ", err);
    }
  }
  return (
    <button
      onClick={handleCopy}
      className="ml-2 inline-flex items-center justify-center rounded-md p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
      title="Copy to clipboard"
    >
      {" "}
      {copied ? (
        <Check className="h-3.5 w-3.5 text-emerald-600" />
      ) : (
        <Copy className="h-3.5 w-3.5" />
      )}{" "}
    </button>
  );
}
