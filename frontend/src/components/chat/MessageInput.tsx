import { useAuthStore } from "@/stores/useAuthStore";
import type { Conversation } from "@/types/chat";
import { useRef, useState } from "react";
import { Button } from "../ui/button";
import { ImagePlus, Loader2, Send, X } from "lucide-react";
import { Input } from "../ui/input";
import EmojiPicker from "./EmojiPicker";
import { useChatStore } from "@/stores/useChatStore";
import { chatService } from "@/services/chatService";
import { toast } from "sonner";

const MessageInput = ({ selectedConvo }: { selectedConvo: Conversation }) => {
  const { user } = useAuthStore();
  const { sendDirectMessage, sendGroupMessage } = useChatStore();
  const [value, setValue] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!user) return null;

  const handleFileChange = (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Vui lòng chọn file hình ảnh hợp lệ (PNG, JPG, WebP...)");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error("Kích thước ảnh tối đa là 10MB");
      return;
    }

    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileChange(file);
    }
    // reset input so the same file can be selected again if needed
    e.target.value = "";
  };

  const removeSelectedImage = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setSelectedFile(null);
    setPreviewUrl(null);
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
      if (items[i].type.startsWith("image/")) {
        const file = items[i].getAsFile();
        if (file) {
          e.preventDefault();
          handleFileChange(file);
          break;
        }
      }
    }
  };

  const sendMessage = async () => {
    const trimmed = value.trim();
    if (!trimmed && !selectedFile) return;

    setIsSending(true);
    let uploadedImgUrl: string | undefined = undefined;

    try {
      if (selectedFile) {
        uploadedImgUrl = await chatService.uploadImage(selectedFile);
      }

      if (selectedConvo.type === "direct") {
        const participants = selectedConvo.participants;
        const otherUser = participants.filter((p) => p._id !== user._id)[0];
        await sendDirectMessage(otherUser._id, trimmed, uploadedImgUrl);
      } else {
        await sendGroupMessage(selectedConvo._id, trimmed, uploadedImgUrl);
      }

      setValue("");
      removeSelectedImage();
    } catch (error) {
      console.error("Lỗi khi gửi tin nhắn:", error);
      toast.error("Không thể gửi tin nhắn. Vui lòng thử lại!");
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="flex flex-col bg-background border-t border-border/40">
      {/* Image Preview Banner */}
      {previewUrl && (
        <div className="flex items-center gap-3 px-4 pt-3 pb-1">
          <div className="relative group size-16 rounded-md overflow-hidden border border-border shadow-sm">
            <img
              src={previewUrl}
              alt="Xem trước ảnh"
              className="size-full object-cover"
            />
            <button
              type="button"
              onClick={removeSelectedImage}
              disabled={isSending}
              className="absolute top-1 right-1 bg-black/60 hover:bg-black/80 text-white rounded-full p-0.5 transition"
              title="Xoá ảnh"
            >
              <X className="size-3.5" />
            </button>
          </div>
          <div className="flex flex-col text-xs text-muted-foreground">
            <span className="font-medium text-foreground truncate max-w-[200px]">
              {selectedFile?.name}
            </span>
            <span>
              {selectedFile ? `${(selectedFile.size / (1024 * 1024)).toFixed(2)} MB` : ""}
            </span>
          </div>
        </div>
      )}

      <div className="flex items-center gap-2 p-3 min-h-[56px]">
        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileInputChange}
        />

        <Button
          type="button"
          variant="ghost"
          size="icon"
          disabled={isSending}
          onClick={() => fileInputRef.current?.click()}
          className="hover:bg-primary/10 transition-smooth shrink-0"
          title="Gửi hình ảnh"
        >
          <ImagePlus className="size-4" />
        </Button>

        <div className="flex-1 relative">
          <Input
            onKeyPress={handleKeyPress}
            onPaste={handlePaste}
            value={value}
            disabled={isSending}
            onChange={(e) => setValue(e.target.value)}
            placeholder={
              selectedFile
                ? "Thêm lời nhắn cho hình ảnh (hoặc Enter để gửi)..."
                : "Soạn tin nhắn..."
            }
            className="pr-20 h-9 bg-white border-border/50 focus:border-primary/50 transition-smooth resize-none"
          />
          <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
            <Button
              asChild
              variant="ghost"
              size="icon"
              disabled={isSending}
              className="size-8 hover:bg-primary/10 transition-smooth"
            >
              <div>
                <EmojiPicker
                  onChange={(emoji: string) => setValue(`${value}${emoji}`)}
                />
              </div>
            </Button>
          </div>
        </div>

        <Button
          type="button"
          onClick={sendMessage}
          disabled={(!value.trim() && !selectedFile) || isSending}
          className="bg-gradient-chat hover:shadow-glow transition-smooth hover:scale-105 shrink-0"
        >
          {isSending ? (
            <Loader2 className="size-4 text-white animate-spin" />
          ) : (
            <Send className="size-4 text-white" />
          )}
        </Button>
      </div>
    </div>
  );
};

export default MessageInput;