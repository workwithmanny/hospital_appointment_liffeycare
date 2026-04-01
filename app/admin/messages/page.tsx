"use client";

import { useEffect, useState } from "react";
import {
  Mail,
  MessageSquare,
  CheckCircle,
  Clock,
  Search,
  Filter,
  Eye,
  Archive,
  ExternalLink,
  Loader2,
  Trash2,
} from "lucide-react";
import { getSupabaseClient } from "@/lib/supabase/client";
import { toast } from "@/components/ui/toast";

interface ContactMessage {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  category: string;
  is_read: boolean;
  is_resolved: boolean;
  admin_notes: string | null;
  created_at: string;
  read_at: string | null;
  resolved_at: string | null;
  handled_by: string | null;
}

const categoryColors: Record<string, string> = {
  general: "bg-blue-100 text-blue-700",
  appointment: "bg-green-100 text-green-700",
  billing: "bg-amber-100 text-amber-700",
  technical: "bg-purple-100 text-purple-700",
  feedback: "bg-pink-100 text-pink-700",
  partnership: "bg-teal-100 text-teal-700",
};

const categoryLabels: Record<string, string> = {
  general: "General",
  appointment: "Appointment",
  billing: "Billing",
  technical: "Technical",
  feedback: "Feedback",
  partnership: "Partnership",
};

export default function AdminMessagesPage() {
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMessage, setSelectedMessage] = useState<ContactMessage | null>(null);
  const [filter, setFilter] = useState<"all" | "unread" | "resolved">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [adminNotes, setAdminNotes] = useState("");

  const supabase = getSupabaseClient();

  useEffect(() => {
    fetchMessages();
  }, [filter, categoryFilter]);

  const fetchMessages = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from("contact_messages")
        .select("*")
        .order("created_at", { ascending: false });

      if (filter === "unread") {
        query = query.eq("is_read", false);
      } else if (filter === "resolved") {
        query = query.eq("is_resolved", true);
      }

      if (categoryFilter !== "all") {
        query = query.eq("category", categoryFilter);
      }

      const { data, error } = await query;

      if (error) throw error;
      setMessages(data || []);
    } catch (error) {
      console.error("Error fetching messages:", error);
      toast({
        title: "Error",
        description: "Failed to load messages",
        variant: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id: string) => {
    try {
      const { error } = await supabase
        .from("contact_messages")
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq("id", id);

      if (error) throw error;

      setMessages((prev) =>
        prev.map((m) =>
          m.id === id ? { ...m, is_read: true, read_at: new Date().toISOString() } : m
        )
      );

      if (selectedMessage?.id === id) {
        setSelectedMessage((prev) =>
          prev ? { ...prev, is_read: true, read_at: new Date().toISOString() } : null
        );
      }
    } catch (error) {
      console.error("Error marking as read:", error);
    }
  };

  const markAsResolved = async (id: string) => {
    try {
      const { error } = await supabase
        .from("contact_messages")
        .update({
          is_resolved: true,
          resolved_at: new Date().toISOString(),
          admin_notes: adminNotes || null,
        })
        .eq("id", id);

      if (error) throw error;

      setMessages((prev) =>
        prev.map((m) =>
          m.id === id
            ? { ...m, is_resolved: true, resolved_at: new Date().toISOString(), admin_notes: adminNotes }
            : m
        )
      );

      if (selectedMessage?.id === id) {
        setSelectedMessage((prev) =>
          prev
            ? { ...prev, is_resolved: true, resolved_at: new Date().toISOString(), admin_notes: adminNotes }
            : null
        );
      }

      toast({
        title: "Success",
        description: "Message marked as resolved",
        variant: "success",
      });
    } catch (error) {
      console.error("Error resolving message:", error);
      toast({
        title: "Error",
        description: "Failed to resolve message",
        variant: "error",
      });
    }
  };

  const deleteMessage = async (id: string) => {
    if (!confirm("Are you sure you want to delete this message?")) return;

    try {
      const { error } = await supabase.from("contact_messages").delete().eq("id", id);
      if (error) throw error;

      setMessages((prev) => prev.filter((m) => m.id !== id));
      if (selectedMessage?.id === id) setSelectedMessage(null);

      toast({
        title: "Success",
        description: "Message deleted",
        variant: "success",
      });
    } catch (error) {
      console.error("Error deleting message:", error);
      toast({
        title: "Error",
        description: "Failed to delete message",
        variant: "error",
      });
    }
  };

  const filteredMessages = messages.filter(
    (m) =>
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.message.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const unreadCount = messages.filter((m) => !m.is_read).length;

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <MessageSquare className="w-6 h-6" />
              Contact Messages
            </h1>
            <p className="text-gray-500 mt-1">
              Manage and respond to contact form submissions
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
              {unreadCount} unread
            </span>
            <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm font-medium">
              {messages.length} total
            </span>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6 flex flex-wrap gap-4">
        <div className="flex items-center gap-2 bg-white rounded-lg border border-gray-200 p-1">
          <button
            onClick={() => setFilter("all")}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              filter === "all" ? "bg-blue-50 text-blue-600" : "text-gray-600 hover:bg-gray-50"
            }`}
          >
            All Messages
          </button>
          <button
            onClick={() => setFilter("unread")}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              filter === "unread" ? "bg-blue-50 text-blue-600" : "text-gray-600 hover:bg-gray-50"
            }`}
          >
            Unread
          </button>
          <button
            onClick={() => setFilter("resolved")}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              filter === "resolved" ? "bg-blue-50 text-blue-600" : "text-gray-600 hover:bg-gray-50"
            }`}
          >
            Resolved
          </button>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Categories</option>
            <option value="general">General</option>
            <option value="appointment">Appointment</option>
            <option value="billing">Billing</option>
            <option value="technical">Technical</option>
            <option value="feedback">Feedback</option>
            <option value="partnership">Partnership</option>
          </select>
        </div>

        <div className="flex-1 min-w-[300px]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search messages..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <button
          onClick={fetchMessages}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Message List */}
        <div className="lg:col-span-1 bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="p-4 border-b border-gray-200 bg-gray-50">
            <h2 className="font-semibold text-gray-900">Inbox</h2>
          </div>
          <div className="max-h-[600px] overflow-y-auto">
            {loading ? (
              <div className="p-8 text-center">
                <Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-600" />
                <p className="text-gray-500 mt-2">Loading messages...</p>
              </div>
            ) : filteredMessages.length === 0 ? (
              <div className="p-8 text-center">
                <Mail className="w-12 h-12 mx-auto text-gray-300" />
                <p className="text-gray-500 mt-2">No messages found</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {filteredMessages.map((message) => (
                  <button
                    key={message.id}
                    onClick={() => {
                      setSelectedMessage(message);
                      setAdminNotes(message.admin_notes || "");
                      if (!message.is_read) markAsRead(message.id);
                    }}
                    className={`w-full p-4 text-left hover:bg-gray-50 transition-colors ${
                      selectedMessage?.id === message.id ? "bg-blue-50 border-l-4 border-blue-500" : ""
                    } ${!message.is_read ? "bg-blue-50/30" : ""}`}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`w-2 h-2 rounded-full mt-2 ${
                          !message.is_read ? "bg-blue-500" : "bg-gray-300"
                        }`}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-gray-900 truncate">
                            {message.name}
                          </span>
                          {message.is_resolved && (
                            <CheckCircle className="w-4 h-4 text-green-500" />
                          )}
                        </div>
                        <p className="text-sm text-gray-600 truncate">{message.subject}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <span
                            className={`px-2 py-0.5 rounded text-xs font-medium ${
                              categoryColors[message.category] || "bg-gray-100 text-gray-600"
                            }`}
                          >
                            {categoryLabels[message.category] || message.category}
                          </span>
                          <span className="text-xs text-gray-400">
                            {new Date(message.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Message Detail */}
        <div className="lg:col-span-2">
          {selectedMessage ? (
            <div className="bg-white rounded-xl border border-gray-200">
              {/* Header */}
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">
                      {selectedMessage.subject}
                    </h2>
                    <div className="flex items-center gap-2 mt-2">
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          categoryColors[selectedMessage.category] || "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {categoryLabels[selectedMessage.category] || selectedMessage.category}
                      </span>
                      <span className="text-sm text-gray-500">
                        {new Date(selectedMessage.created_at).toLocaleString()}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {!selectedMessage.is_resolved && (
                      <button
                        onClick={() => markAsResolved(selectedMessage.id)}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors flex items-center gap-2"
                      >
                        <CheckCircle className="w-4 h-4" />
                        Mark Resolved
                      </button>
                    )}
                    <button
                      onClick={() => deleteMessage(selectedMessage.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Sender Info */}
                <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-blue-600 font-semibold">
                      {selectedMessage.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{selectedMessage.name}</p>
                    <a
                      href={`mailto:${selectedMessage.email}`}
                      className="text-sm text-blue-600 hover:underline"
                    >
                      {selectedMessage.email}
                    </a>
                  </div>
                </div>
              </div>

              {/* Message Content */}
              <div className="p-6">
                <div className="prose max-w-none">
                  <p className="text-gray-700 whitespace-pre-wrap">{selectedMessage.message}</p>
                </div>
              </div>

              {/* Admin Notes */}
              <div className="p-6 border-t border-gray-200 bg-gray-50">
                <h3 className="font-medium text-gray-900 mb-3">Admin Notes</h3>
                <textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Add notes about this message..."
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <div className="flex justify-end mt-3">
                  <button
                    onClick={() => markAsResolved(selectedMessage.id)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                  >
                    Save Notes & Resolve
                  </button>
                </div>
              </div>

              {/* Actions */}
              <div className="p-4 border-t border-gray-200 flex items-center justify-between">
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  {selectedMessage.is_read && (
                    <span className="flex items-center gap-1">
                      <Eye className="w-4 h-4" />
                      Read {selectedMessage.read_at && new Date(selectedMessage.read_at).toLocaleDateString()}
                    </span>
                  )}
                  {selectedMessage.is_resolved && (
                    <span className="flex items-center gap-1 text-green-600">
                      <CheckCircle className="w-4 h-4" />
                      Resolved {selectedMessage.resolved_at && new Date(selectedMessage.resolved_at).toLocaleDateString()}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <a
                    href={`mailto:${selectedMessage.email}?subject=Re: ${selectedMessage.subject}`}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors flex items-center gap-2"
                  >
                    <Mail className="w-4 h-4" />
                    Reply via Email
                  </a>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
              <MessageSquare className="w-16 h-16 mx-auto text-gray-300" />
              <h3 className="text-lg font-medium text-gray-900 mt-4">Select a message</h3>
              <p className="text-gray-500 mt-2">
                Click on a message from the inbox to view its details
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
