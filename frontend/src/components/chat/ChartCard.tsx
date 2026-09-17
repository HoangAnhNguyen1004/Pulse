import { Card } from "@/components/ui/card";
import { formatOnlineTime, cn } from "@/lib/utils";
import { MoreHorizontal, Bell, BellOff, Trash2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useChatStore } from "@/stores/useChatStore";
import { useState } from "react";
import { toast } from "sonner";

interface ChatCardProps {
  convoId: string;
  name: string;
  timestamp?: Date;
  isActive: boolean;
  onSelect: (id: string) => void;
  unreadCount?: number;
  leftSection: React.ReactNode;
  subtitle: React.ReactNode;
  isMuted?: boolean;
}

const ChatCard = ({
  convoId,
  name,
  timestamp,
  isActive,
  onSelect,
  unreadCount,
  leftSection,
  subtitle,
  isMuted = false,
}: ChatCardProps) => {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const { toggleMuteConversation, deleteConversation } = useChatStore();

  const handleToggleMute = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const newMuted = await toggleMuteConversation(convoId);
      toast.success(newMuted ? "Đã tắt thông báo" : "Đã bật thông báo");
    } catch {
      toast.error("Không thể thay đổi trạng thái thông báo");
    }
  };

  const handleOpenDeleteDialog = (e: React.MouseEvent) => {
    e.stopPropagation();
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteConversation(convoId);
      toast.success("Đã xoá cuộc trò chuyện thành công");
      setDeleteDialogOpen(false);
    } catch {
      toast.error("Không thể xoá cuộc trò chuyện");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <Card
        key={convoId}
        className={cn(
          "group relative border-none p-3 cursor-pointer transition-smooth glass hover:bg-muted/30",
          isActive &&
            "ring-2 ring-primary/50 bg-gradient-to-tr from-primary-glow/10 to-primary-foreground"
        )}
        onClick={() => onSelect(convoId)}
      >
        <div className="flex items-center gap-3">
          <div className="relative shrink-0">{leftSection}</div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-1.5 min-w-0 flex-1 mr-2">
                <h3
                  className={cn(
                    "font-semibold text-sm truncate",
                    unreadCount && unreadCount > 0 && "text-foreground"
                  )}
                >
                  {name}
                </h3>
                {isMuted && (
                  <BellOff
                    className="size-3.5 text-muted-foreground shrink-0"
                    title="Đã tắt thông báo"
                  />
                )}
              </div>

              <span className="text-xs text-muted-foreground shrink-0">
                {timestamp ? formatOnlineTime(timestamp) : ""}
              </span>
            </div>

            <div className="flex items-center justify-between gap-1">
              <div className="flex items-center gap-1 flex-1 min-w-0">
                {subtitle}
              </div>

              <div
                className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                onClick={(e) => e.stopPropagation()}
              >
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-7 hover:bg-background/80 text-muted-foreground hover:text-foreground"
                      aria-label="Tùy chọn cuộc trò chuyện"
                    >
                      <MoreHorizontal className="size-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem
                      onClick={handleToggleMute}
                      className="cursor-pointer"
                    >
                      {isMuted ? (
                        <>
                          <Bell className="size-4 mr-2" />
                          Bật thông báo
                        </>
                      ) : (
                        <>
                          <BellOff className="size-4 mr-2" />
                          Tắt thông báo
                        </>
                      )}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={handleOpenDeleteDialog}
                      className="cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10"
                    >
                      <Trash2 className="size-4 mr-2" />
                      Xoá cuộc trò chuyện
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>
        </div>
      </Card>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent
          onClick={(e) => e.stopPropagation()}
          className="sm:max-w-md"
        >
          <DialogHeader>
            <DialogTitle>Xoá cuộc trò chuyện</DialogTitle>
            <DialogDescription>
              Bạn có chắc chắn muốn xoá cuộc trò chuyện với{" "}
              <span className="font-semibold text-foreground">{name}</span> không?
              Hành động này không thể hoàn tác.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0 mt-4">
            <Button
              type="button"
              variant="outline"
              disabled={isDeleting}
              onClick={(e) => {
                e.stopPropagation();
                setDeleteDialogOpen(false);
              }}
            >
              Huỷ
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={isDeleting}
              onClick={(e) => {
                e.stopPropagation();
                handleConfirmDelete();
              }}
            >
              {isDeleting ? "Đang xoá..." : "Xoá"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ChatCard;