import React, { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate, useSearchParams } from "react-router-dom";
import api from "../config/api";
import { useAuth } from "../contexts/AuthContext";

const formatParticipantName = (participant) => {
  if (!participant) return "Host";
  const fullName = [participant.firstName, participant.lastName].filter(Boolean).join(" ").trim();
  return fullName || participant.username || "Host";
};

const formatTime = (value) => {
  if (!value) return "";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  return date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
};

const formatConversationTime = (value) => {
  if (!value) return "";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const now = new Date();
  const isSameDay = date.toDateString() === now.toDateString();

  if (isSameDay) {
    return formatTime(value);
  }

  return date.toLocaleDateString([], {
    day: "numeric",
    month: "short",
  });
};

const Messages = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const messagesEndRef = useRef(null);

  const [conversations, setConversations] = useState([]);
  const [activeConversationId, setActiveConversationId] = useState(null);
  const [activeConversation, setActiveConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [conversationLoading, setConversationLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [mobileListOpen, setMobileListOpen] = useState(true);

  const propertyIdFromQuery = searchParams.get("property");
  const receiverIdFromQuery = searchParams.get("receiver");
  const isHostAccount = currentUser?.role === "host";

  const filteredConversations = useMemo(() => {
    return conversations.filter((conversation) => {
      const participant = conversation.participants?.find(
        (item) => String(item._id) !== String(currentUser?._id)
      );

      const participantName = formatParticipantName(participant).toLowerCase();
      const propertyTitle = conversation.property?.title?.toLowerCase() || "";
      const lastMessage = conversation.lastMessage?.content?.toLowerCase() || "";
      const term = searchTerm.toLowerCase();

      return (
        participantName.includes(term) ||
        propertyTitle.includes(term) ||
        lastMessage.includes(term)
      );
    });
  }, [conversations, currentUser?._id, searchTerm]);

  const currentPartner = useMemo(() => {
    return activeConversation?.participants?.find(
      (item) => String(item._id) !== String(currentUser?._id)
    );
  }, [activeConversation, currentUser?._id]);

  const syncConversationList = (conversationData, latestMessage) => {
    setConversations((prev) => {
      const partner = conversationData.participants?.find(
        (item) => String(item._id) !== String(currentUser?._id)
      );
      const unreadCounts = conversationData.unreadCounts || {};
      const updatedConversation = {
        ...conversationData,
        participants: conversationData.participants || [],
        property: conversationData.property || null,
        lastMessage: latestMessage
          ? {
              content: latestMessage.content,
              sender: latestMessage.sender?._id || latestMessage.sender,
              createdAt: latestMessage.createdAt,
            }
          : conversationData.lastMessage,
        contactPhone: partner?.phone || conversationData.contactPhone,
        unreadBadge: unreadCounts[currentUser?._id] || 0,
      };

      const withoutCurrent = prev.filter((item) => String(item._id) !== String(updatedConversation._id));
      return [updatedConversation, ...withoutCurrent];
    });
  };

  const fetchConversations = async () => {
    const response = await api.get("/api/messages/conversations");
    const normalized = response.data.map((conversation) => ({
      ...conversation,
      unreadBadge: conversation.unreadCounts?.[currentUser?._id] || 0,
    }));

    setConversations(normalized);
    return normalized;
  };

  const fetchConversationDetail = async (conversationId, keepListVisible = false) => {
    if (!conversationId) return;

    setConversationLoading(true);
    setError("");

    try {
      const response = await api.get(`/api/messages/conversations/${conversationId}`);
      setActiveConversation(response.data.conversation);
      setMessages(response.data.messages || []);
      setActiveConversationId(response.data.conversation._id);
      syncConversationList(response.data.conversation);

      if (!keepListVisible) {
        setMobileListOpen(false);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Unable to load conversation");
    } finally {
      setConversationLoading(false);
    }
  };

  useEffect(() => {
    if (!currentUser) return;

    let isMounted = true;

    const bootstrap = async () => {
      try {
        setLoading(true);
        let existingConversations = await fetchConversations();

        if (!isMounted) return;

        let targetConversation = null;

        if (propertyIdFromQuery && receiverIdFromQuery) {
          targetConversation = existingConversations.find((conversation) => {
            const hasProperty = String(conversation.property?._id) === String(propertyIdFromQuery);
            const hasReceiver = conversation.participants?.some(
              (participant) => String(participant._id) === String(receiverIdFromQuery)
            );
            return hasProperty && hasReceiver;
          });

          if (!targetConversation && !isHostAccount) {
            let createResponse;
            try {
              createResponse = await api.post("/api/messages/conversations", {
                receiverId: receiverIdFromQuery,
                propertyId: propertyIdFromQuery,
              });
            } catch (createError) {
              createResponse = await api.post("/api/messages/conversations", {
                receiverId: receiverIdFromQuery,
              });
            }

            targetConversation = createResponse.data;
            existingConversations = [targetConversation, ...existingConversations];
            setConversations((prev) => [targetConversation, ...prev]);
          }
        } else if (receiverIdFromQuery) {
          targetConversation = existingConversations.find((conversation) =>
            conversation.participants?.some(
              (participant) => String(participant._id) === String(receiverIdFromQuery)
            )
          );

          if (!targetConversation && !isHostAccount) {
            const createResponse = await api.post("/api/messages/conversations", {
              receiverId: receiverIdFromQuery,
            });

            targetConversation = createResponse.data;
            existingConversations = [targetConversation, ...existingConversations];
            setConversations((prev) => [targetConversation, ...prev]);
          }
        } else if (propertyIdFromQuery) {
          targetConversation = existingConversations.find(
            (conversation) => String(conversation.property?._id) === String(propertyIdFromQuery)
          );
        }

        const fallbackConversation = targetConversation || existingConversations[0];

        if (fallbackConversation?._id) {
          await fetchConversationDetail(fallbackConversation._id, true);
        } else {
          setMessages([]);
          setActiveConversation(null);
          setActiveConversationId(null);
        }
      } catch (err) {
        setError(err.response?.data?.message || "Unable to load messages");
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    bootstrap();

    return () => {
      isMounted = false;
    };
  }, [currentUser, isHostAccount, propertyIdFromQuery, receiverIdFromQuery]);

  useEffect(() => {
    if (!currentUser) return undefined;

    const conversationInterval = setInterval(() => {
      fetchConversations().catch(() => {});
    }, 12000);

    return () => clearInterval(conversationInterval);
  }, [currentUser]);

  useEffect(() => {
    if (!activeConversationId) return undefined;

    const detailInterval = setInterval(() => {
      fetchConversationDetail(activeConversationId, true).catch(() => {});
    }, 5000);

    return () => clearInterval(detailInterval);
  }, [activeConversationId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleConversationClick = async (conversationId) => {
    await fetchConversationDetail(conversationId);
  };

  const handleSendMessage = async (event) => {
    event.preventDefault();

    if (!newMessage.trim() || !activeConversation || !currentPartner?._id) {
      return;
    }

    if (isHostAccount) {
      setError("Host accounts cannot send new messages from this inbox.");
      return;
    }

    try {
      setSending(true);

      const response = await api.post("/api/messages/messages", {
        conversation: activeConversation._id,
        receiver: currentPartner._id,
        content: newMessage.trim(),
      });

      setMessages((prev) => [...prev, response.data]);
      setNewMessage("");
      syncConversationList(activeConversation, response.data);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to send the message");
    } finally {
      setSending(false);
    }
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50">
        <div className="text-center">
          <h1 className="mb-4 text-2xl font-bold text-neutral-800">You must be logged in to view messages</h1>
          <button
            onClick={() => navigate("/login")}
            className="rounded-md bg-primary-600 px-4 py-2 text-white hover:bg-primary-700"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 rounded-full border-4 border-primary-100 border-t-primary-600 animate-spin" />
          <p className="text-neutral-600">Loading messages...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(251,113,133,0.14),_transparent_28%),linear-gradient(180deg,_#fff7f8_0%,_#f8fafc_44%,_#ffffff_100%)] py-6 md:py-8">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-6 overflow-hidden rounded-[28px] border border-white/70 bg-white/85 p-5 shadow-[0_24px_60px_-34px_rgba(15,23,42,0.32)] backdrop-blur"
        >
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <span className="inline-flex rounded-full bg-primary-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-primary-700">
                {isHostAccount ? "Host inbox" : "Direct chat"}
              </span>
              <h1 className="mt-3 text-3xl font-bold text-neutral-900 md:text-4xl">
                {isHostAccount ? "Receive tenant enquiries in one place" : "Tenant and host can negotiate here"}
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-neutral-600 md:text-base">
                {isHostAccount
                  ? "Hosts can review incoming tenant conversations here. Starting or sending new messages from the host side is disabled."
                  : "Use this conversation to discuss availability, advance payment, move-in date, amenities, and other room details."}
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setMobileListOpen((prev) => !prev)}
                className="rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm font-medium text-neutral-700 transition hover:border-primary-200 hover:text-primary-700 md:hidden"
              >
                {mobileListOpen ? "Open Chat" : "Open Inbox"}
              </button>
            </div>
          </div>
        </motion.div>

        {error && (
          <div className="mb-4 rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </div>
        )}

        <div className="overflow-hidden rounded-[30px] border border-white/70 bg-white/90 shadow-[0_24px_60px_-34px_rgba(15,23,42,0.33)] backdrop-blur">
          <div className="grid min-h-[72vh] grid-cols-1 md:grid-cols-[340px,minmax(0,1fr)]">
            <aside className={`${mobileListOpen ? "block" : "hidden"} border-r border-neutral-100 md:block`}>
              <div className="border-b border-neutral-100 p-4">
                <input
                  type="text"
                  placeholder="Search conversations"
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  className="w-full rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm outline-none transition focus:border-primary-300 focus:bg-white focus:ring-4 focus:ring-primary-100"
                />
              </div>

              <div className="max-h-[72vh] overflow-y-auto">
                {filteredConversations.length === 0 ? (
                  <div className="p-6 text-sm text-neutral-500">
                    No conversations yet. Start a chat from a property details page to begin.
                  </div>
                ) : (
                  filteredConversations.map((conversation) => {
                    const partner = conversation.participants?.find(
                      (item) => String(item._id) !== String(currentUser?._id)
                    );

                    return (
                      <button
                        key={conversation._id}
                        onClick={() => handleConversationClick(conversation._id)}
                        className={`w-full border-b border-neutral-100 px-4 py-4 text-left transition hover:bg-neutral-50 ${
                          String(activeConversationId) === String(conversation._id)
                            ? "bg-rose-50/70"
                            : "bg-transparent"
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className="relative shrink-0">
                            {partner?.profileImage ? (
                              <img
                                src={partner.profileImage}
                                alt={formatParticipantName(partner)}
                                className="h-12 w-12 rounded-2xl object-cover"
                              />
                            ) : (
                              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-neutral-100 text-neutral-500">
                                <i className="fas fa-user" />
                              </div>
                            )}
                            <span className="absolute -bottom-1 -right-1 h-3.5 w-3.5 rounded-full border-2 border-white bg-emerald-400" />
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <h3 className="truncate text-sm font-semibold text-neutral-900">
                                  {formatParticipantName(partner)}
                                </h3>
                                <p className="truncate text-xs text-neutral-500">
                                  {conversation.property?.title || "General chat"}
                                </p>
                              </div>
                              <span className="shrink-0 text-xs text-neutral-400">
                                {formatConversationTime(
                                  conversation.lastMessage?.createdAt || conversation.updatedAt
                                )}
                              </span>
                            </div>

                            <div className="mt-2 flex items-center justify-between gap-3">
                              <p className="truncate text-xs text-neutral-500">
                                {conversation.lastMessage?.content || "Start the conversation"}
                              </p>
                              {conversation.unreadBadge > 0 && (
                                <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-primary-600 px-2 text-xs font-semibold text-white">
                                  {conversation.unreadBadge}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </aside>

            <section className={`${mobileListOpen ? "hidden" : "flex"} min-h-[72vh] flex-col md:flex`}>
              {activeConversation ? (
                <>
                  <div className="border-b border-neutral-100 bg-white/80 p-4 md:p-5">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => setMobileListOpen(true)}
                          className="rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-600 md:hidden"
                        >
                          Back
                        </button>

                        {currentPartner?.profileImage ? (
                          <img
                            src={currentPartner.profileImage}
                            alt={formatParticipantName(currentPartner)}
                            className="h-12 w-12 rounded-2xl object-cover"
                          />
                        ) : (
                          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-neutral-100 text-neutral-500">
                            <i className="fas fa-user" />
                          </div>
                        )}

                        <div>
                          <h2 className="text-base font-semibold text-neutral-900">
                            {formatParticipantName(currentPartner)}
                          </h2>
                          <p className="text-sm text-neutral-500">
                            {activeConversation.property?.title || "Direct chat"}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {currentPartner?.phone && (
                          <a
                            href={`tel:${currentPartner.phone}`}
                            className="rounded-2xl border border-neutral-200 bg-white px-4 py-2 text-sm font-medium text-neutral-700 transition hover:border-primary-200 hover:text-primary-700"
                          >
                            <i className="fas fa-phone-alt mr-2" />
                            {currentPartner.phone}
                          </a>
                        )}
                        <button
                          onClick={() =>
                            navigate(
                              activeConversation.property?._id
                                ? `/properties/${activeConversation.property._id}`
                                : "/listings"
                            )
                          }
                          className="rounded-2xl bg-primary-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-primary-700"
                        >
                          View Room
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="flex-1 overflow-y-auto bg-[linear-gradient(180deg,_rgba(255,247,248,0.85)_0%,_rgba(255,255,255,0.95)_30%,_#ffffff_100%)] px-4 py-5 md:px-6">
                    {conversationLoading ? (
                      <div className="flex h-full items-center justify-center">
                        <div className="h-10 w-10 rounded-full border-4 border-primary-100 border-t-primary-600 animate-spin" />
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {messages.map((message) => {
                          const isMine = String(message.sender?._id || message.sender) === String(currentUser?._id);

                          return (
                            <motion.div
                              key={message._id}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              className={`flex ${isMine ? "justify-end" : "justify-start"}`}
                            >
                              <div
                                className={`max-w-[85%] rounded-[24px] px-4 py-3 shadow-sm md:max-w-[70%] ${
                                  isMine
                                    ? "rounded-br-md bg-primary-600 text-white"
                                    : "rounded-bl-md bg-white text-neutral-800"
                                }`}
                              >
                                <p className="text-sm leading-6">{message.content}</p>
                                <div
                                  className={`mt-2 text-right text-[11px] ${
                                    isMine ? "text-primary-100" : "text-neutral-400"
                                  }`}
                                >
                                  {formatTime(message.createdAt)}
                                </div>
                              </div>
                            </motion.div>
                          );
                        })}
                        <div ref={messagesEndRef} />
                      </div>
                    )}
                  </div>

                  <div className="border-t border-neutral-100 bg-white/90 p-4 md:p-5">
                    <div className="mb-3 rounded-2xl bg-amber-50 px-4 py-3 text-xs leading-5 text-amber-700">
                      {isHostAccount
                        ? "This inbox is currently receive-only for host accounts. Tenants can initiate the conversation from listings and property pages."
                        : "Negotiate rent, ask about advance, food, curfew, amenities, and move-in timing directly with the host."}
                    </div>
                    <form onSubmit={handleSendMessage} className="flex items-end gap-3">
                      <textarea
                        placeholder={isHostAccount ? "Receive-only inbox for host accounts" : "Type your message..."}
                        className="min-h-[54px] flex-1 resize-none rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm outline-none transition focus:border-primary-300 focus:bg-white focus:ring-4 focus:ring-primary-100"
                        rows={2}
                        value={newMessage}
                        onChange={(event) => setNewMessage(event.target.value)}
                        disabled={isHostAccount}
                      />
                      <button
                        type="submit"
                        disabled={isHostAccount || sending || !newMessage.trim()}
                        className="rounded-2xl bg-primary-600 px-5 py-3 text-sm font-medium text-white transition hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {isHostAccount ? "Receive Only" : sending ? "Sending..." : "Send"}
                      </button>
                    </form>
                  </div>
                </>
              ) : (
                <div className="flex h-full flex-1 items-center justify-center p-8 text-center">
                  <div>
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary-50 text-primary-600">
                      <i className="fas fa-comments text-2xl" />
                    </div>
                    <h2 className="text-xl font-semibold text-neutral-900">No conversation selected</h2>
                    <p className="mt-2 text-sm text-neutral-500">
                      Start a host conversation from a listing or property details page.
                    </p>
                  </div>
                </div>
              )}
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Messages;
