import api from "@/lib/axios";
import type { ConversationResponse, Message } from "@/types/chat";
import type { ChatTheme } from "@/lib/chatThemes";

interface FetchMessageProps {
    messages: Message[];
    cursor?: string;
}

const pageLimit = 50;

export const chatService = {
    async fetchConversations(): Promise<ConversationResponse> {
        const res = await api.get("/conversations");
        return res.data;
    },

    async fetchMessages(id: string, cursor?: string): Promise<FetchMessageProps> {
        const res = await api.get(
            `/conversations/${id}/messages?limit=${pageLimit}&cursor=${cursor}`
        );

        return { messages: res.data.messages, cursor: res.data.nextCursor };
    },

    async sendDirectMessage(
        recipientId: string,
        content: string = "",
        imgUrl?: string,
        conversationId?: string
    ) {
        const res = await api.post("/messages/direct", {
            recipientId,
            content,
            imgUrl,
            conversationId,
        });

        return res.data.message;
    },

    async sendGroupMessage(
        conversationId: string,
        content: string = "",
        imgUrl?: string
    ) {
        const res = await api.post("/messages/group", {
            conversationId,
            content,
            imgUrl,
        });
        return res.data.message;
    },

    async markAsSeen(conversationId: string) {
        const res = await api.patch(`/conversations/${conversationId}/seen`);
        return res.data;
    },

    async updateConversationTheme(conversationId: string, backgroundTheme: ChatTheme) {
        const res = await api.patch(`/conversations/${conversationId}/theme`, {
            backgroundTheme,
        });
        return res.data.conversation;
    },

    async toggleMuteConversation(conversationId: string): Promise<boolean> {
        const res = await api.patch(`/conversations/${conversationId}/mute`);
        return res.data.isMuted;
    },

    async deleteConversation(conversationId: string): Promise<void> {
        await api.delete(`/conversations/${conversationId}`);
    },

    async uploadImage(file: File): Promise<string> {
        const formData = new FormData();
        formData.append("image", file);
        const res = await api.post("/messages/upload", formData, {
            headers: {
                "Content-Type": "multipart/form-data",
            },
        });
        return res.data.imgUrl;
    },

    async createConversation(
        type: "direct" | "group",
        name: string,
        memberIds: string[]
    ) {
        const res = await api.post("/conversations", { type, name, memberIds });
        return res.data.conversation;
    },
};
