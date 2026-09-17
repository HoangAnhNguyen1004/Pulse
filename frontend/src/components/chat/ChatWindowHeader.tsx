import { useState } from "react";
import { ImageIcon, MoreVertical } from "lucide-react";
import { toast } from "sonner";
import { useChatStore } from "@/stores/useChatStore";
import { getChatTheme, CHAT_THEMES, type ChatTheme } from "@/lib/chatThemes";
import type { Conversation } from "@/types/chat";
import { SidebarTrigger } from "../ui/sidebar";
import { useAuthStore } from "@/stores/useAuthStore";
import { Separator } from "../ui/separator";
import { Button } from "../ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import UserAvatar from "./UserAvatar";
import StatusBadge from "./StatusBadge";
import GroupChatAvatar from "./GroupChatAvatar";
import { useSocketStore } from "@/stores/useSocketStore";

const ChatWindowHeader = ({ chat }: { chat?: Conversation }) => {
  const { conversations, activeConversationId, updateConversationTheme } = useChatStore();
  const { user } = useAuthStore();
  const { onlineUsers } = useSocketStore();
  const [themeDialogOpen, setThemeDialogOpen] = useState(false);
  const [changingTheme, setChangingTheme] = useState<ChatTheme | null>(null);

  const selectedChat = chat ?? conversations.find((item) => item._id === activeConversationId);

  if (!selectedChat) {
    return (
      <header className="md:hidden sticky top-0 z-10 flex items-center gap-2 px-4 py-2 w-full">
        <SidebarTrigger className="-ml-1 text-foreground" />
      </header>
    );
  }

  const otherUser =
    selectedChat.type === "direct"
      ? selectedChat.participants.find((participant) => participant._id !== user?._id)
      : null;

  const handleThemeChange = async (theme: ChatTheme) => {
    setChangingTheme(theme);
    try {
      await updateConversationTheme(selectedChat._id, theme);
      setThemeDialogOpen(false);
      toast.success(`Đã đổi hình nền thành ${getChatTheme(theme).label}`);
    } catch {
      toast.error("Không thể đổi hình nền. Vui lòng thử lại.");
    } finally {
      setChangingTheme(null);
    }
  };

  const currentTheme = selectedChat.backgroundTheme ?? "default";

  return (
    <>
      <header className="sticky top-0 z-10 px-4 py-2 flex items-center bg-background">
        <div className="flex items-center gap-2 w-full">
          <SidebarTrigger className="-ml-1 text-foreground" />
          <Separator
            orientation="vertical"
            className="mr-2 data-[orientation=vertical]:h-4"
          />

          <div className="p-2 w-full flex items-center gap-3">
            <div className="relative">
              {selectedChat.type === "direct" ? (
                <>
                  <UserAvatar
                    type="sidebar"
                    name={otherUser?.displayName || "Pulse"}
                    avatarUrl={otherUser?.avatarUrl || undefined}
                  />
                  <StatusBadge
                    status={onlineUsers.includes(otherUser?._id ?? "") ? "online" : "offline"}
                  />
                </>
              ) : (
                <GroupChatAvatar participants={selectedChat.participants} type="sidebar" />
              )}
            </div>

            <h2 className="flex-1 font-semibold text-foreground truncate">
              {selectedChat.type === "direct" ? otherUser?.displayName : selectedChat.group?.name}
            </h2>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="Tùy chọn cuộc trò chuyện">
                  <MoreVertical className="size-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onSelect={() => setThemeDialogOpen(true)}>
                  <ImageIcon className="mr-2 size-4" />
                  Thay đổi hình nền
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <Dialog open={themeDialogOpen} onOpenChange={setThemeDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Thay đổi hình nền</DialogTitle>
            <DialogDescription>Hình nền sẽ được áp dụng cho tất cả thành viên trong cuộc trò chuyện.</DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-3">
            {CHAT_THEMES.map((theme) => {
              const imageUrl = "imageUrl" in theme ? theme.imageUrl : undefined;
              const selected = currentTheme === theme.id;

              return (
                <button
                  key={theme.id}
                  type="button"
                  onClick={() => handleThemeChange(theme.id)}
                  disabled={changingTheme !== null}
                  className={`relative overflow-hidden rounded-lg border-2 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60 ${
                    selected ? "border-primary" : "border-transparent hover:border-primary/50"
                  }`}
                >
                  <div
                    className="h-24 bg-muted bg-cover bg-center"
                    style={imageUrl ? { backgroundImage: `url(${imageUrl})` } : undefined}
                  />
                  <span className="block bg-background px-3 py-2 text-sm font-medium">
                    {changingTheme === theme.id ? "Đang áp dụng..." : theme.label}
                  </span>
                </button>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ChatWindowHeader;
