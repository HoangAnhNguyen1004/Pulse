import { useChatStore } from "@/stores/useChatStore";
import { getChatTheme } from "@/lib/chatThemes";
import ChatWelcomeScreen from "./ChatWelcomeScreen";
import MessageItem from "./MessageItem";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import InfiniteScroll from "react-infinite-scroll-component";

const ChatWindowBody = () => {
  const { activeConversationId, conversations, messages: allMessages, fetchMessages } =
    useChatStore();
  const [lastMessageStatus, setLastMessageStatus] = useState<"delivered" | "seen">(
    "delivered"
  );

  const messages = allMessages[activeConversationId!]?.items ?? [];
  const reversedMessages = [...messages].reverse();
  const hasMore = allMessages[activeConversationId!]?.hasMore ?? false;
  const selectedConvo = conversations.find((conversation) => conversation._id === activeConversationId);
  const key = `chat-scroll-${activeConversationId}`;
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const seenBy = selectedConvo?.seenBy ?? [];
    setLastMessageStatus(seenBy.length > 0 ? "seen" : "delivered");
  }, [selectedConvo]);

  useLayoutEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [activeConversationId]);

  const fetchMoreMessages = async () => {
    if (activeConversationId) await fetchMessages(activeConversationId);
  };

  const handleScrollSave = () => {
    const container = containerRef.current;
    if (!container || !activeConversationId) return;

    sessionStorage.setItem(
      key,
      JSON.stringify({ scrollTop: container.scrollTop, scrollHeight: container.scrollHeight })
    );
  };

  useLayoutEffect(() => {
    const container = containerRef.current;
    const item = sessionStorage.getItem(key);
    if (!container || !item) return;

    const { scrollTop } = JSON.parse(item);
    requestAnimationFrame(() => {
      container.scrollTop = scrollTop;
    });
  }, [key, messages.length]);

  if (!selectedConvo) return <ChatWelcomeScreen />;

  const theme = getChatTheme(selectedConvo.backgroundTheme ?? "default");
  const imageUrl = "imageUrl" in theme ? theme.imageUrl : undefined;
  const backgroundStyle = imageUrl
    ? {
        backgroundImage: `linear-gradient(rgb(255 255 255 / 18%), rgb(255 255 255 / 18%)), url(${imageUrl})`,
        backgroundPosition: "center",
        backgroundSize: "cover",
      }
    : undefined;

  if (!messages.length) {
    return (
      <div
        style={backgroundStyle}
        className="flex h-full items-center justify-center bg-primary-foreground p-4 text-muted-foreground"
      >
        Chưa có tin nhắn nào trong cuộc trò chuyện này.
      </div>
    );
  }

  return (
    <div
      style={backgroundStyle}
      className="h-full overflow-hidden bg-primary-foreground p-4"
    >
      <div
        id="scrollableDiv"
        ref={containerRef}
        onScroll={handleScrollSave}
        className="flex h-full flex-col-reverse overflow-x-hidden overflow-y-auto beautiful-scrollbar"
      >
        <div ref={messagesEndRef} />
        <InfiniteScroll
          dataLength={messages.length}
          next={fetchMoreMessages}
          hasMore={hasMore}
          scrollableTarget="scrollableDiv"
          loader={<p>Đang tải...</p>}
          inverse
          style={{ display: "flex", flexDirection: "column-reverse", overflow: "visible" }}
        >
          {reversedMessages.map((message, index) => (
            <MessageItem
              key={message._id ?? index}
              message={message}
              index={index}
              messages={reversedMessages}
              selectedConvo={selectedConvo}
              lastMessageStatus={lastMessageStatus}
            />
          ))}
        </InfiniteScroll>
      </div>
    </div>
  );
};

export default ChatWindowBody;
