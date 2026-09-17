import mongoose from "mongoose";
import Conversation from "../models/Conversation.js";
import Message from "../models/Message.js";
import { io } from "../socket/index.js";

export const createConversation = async (req, res) => {
    try {
        const { type, name, memberIds } = req.body;
        const userId = req.user._id;

        if (
            !type ||
            (type === "group" && !name) ||
            !memberIds ||
            !Array.isArray(memberIds) ||
            memberIds.length === 0
        ) {
            return res
                .status(400)
                .json({ message: "Tên nhóm và danh sách thành viên là bắt buộc" });
        }

        let conversation;

        if (type === "direct") {
            const participantId = memberIds[0];

            conversation = await Conversation.findOne({
                type: "direct",
                "participants.userId": { $all: [userId, participantId] },
            });

            if (!conversation) {
                conversation = new Conversation({
                    type: "direct",
                    participants: [{ userId }, { userId: participantId }],
                    lastMessageAt: new Date(),
                });

                await conversation.save();
            }
        }

        if (type === "group") {
            conversation = new Conversation({
                type: "group",
                participants: [{ userId }, ...memberIds.map((id) => ({ userId: id }))],
                group: {
                    name,
                    createdBy: userId,
                },
                lastMessageAt: new Date(),
            });

            await conversation.save();
        }

        if (!conversation) {
            return res.status(400).json({ message: "Conversation type không hợp lệ" });
        }

        await conversation.populate([
            { path: "participants.userId", select: "displayName avatarUrl" },
            {
                path: "seenBy",
                select: "displayName avatarUrl",
            },
            { path: "lastMessage.senderId", select: "displayName avatarUrl" },
        ]);

        const participants = (conversation.participants || []).map((p) => ({
            _id: p.userId?._id,
            displayName: p.userId?.displayName,
            avatarUrl: p.userId?.avatarUrl ?? null,
            joinedAt: p.joinedAt,
        }));

        const formatted = { ...conversation.toObject(), participants };

        if (type === "group") {
            memberIds.forEach((userId) => {
                io.to(userId).emit("new-group", formatted);
            });
        }

        if (type === "direct") {
            io.to(userId).emit("new-group", formatted);
            io.to(memberIds[0]).emit("new-group", formatted);
        }

        return res.status(201).json({ conversation: formatted });
    } catch (error) {
        console.error("Lỗi khi tạo conversation", error);
        return res.status(500).json({ message: "Lỗi hệ thống" });
    }
};

export const getConversations = async (req, res) => {
    try {
        const userId = req.user._id;
        const conversations = await Conversation.find({
            "participants.userId": userId,
            deletedBy: { $ne: userId },
        })
            .sort({ lastMessageAt: -1, updatedAt: -1 })
            .populate({
                path: "participants.userId",
                select: "displayName avatarUrl",
            })
            .populate({
                path: "lastMessage.senderId",
                select: "displayName avatarUrl",
            })
            .populate({
                path: "seenBy",
                select: "displayName avatarUrl",
            });

        const formatted = conversations.map((convo) => {
            const participants = (convo.participants || []).map((p) => ({
                _id: p.userId?._id,
                displayName: p.userId?.displayName,
                avatarUrl: p.userId?.avatarUrl ?? null,
                joinedAt: p.joinedAt,
            }));

            const isMuted = (convo.mutedBy || []).some(
                (id) => id.toString() === userId.toString()
            );

            return {
                ...convo.toObject(),
                unreadCounts: convo.unreadCounts || {},
                participants,
                isMuted,
            };
        });

        return res.status(200).json({ conversations: formatted });
    } catch (error) {
        console.error("Lỗi xảy ra khi lấy conversations", error);
        return res.status(500).json({ message: "Lỗi hệ thống" });
    }
};

export const getMessages = async (req, res) => {
    try {
        const { conversationId } = req.params;
        const { limit = 50, cursor } = req.query;

        const query = { conversationId };

        if (cursor) {
            query.createdAt = { $lt: new Date(cursor) };
        }

        let messages = await Message.find(query)
            .sort({ createdAt: -1 })
            .limit(Number(limit) + 1);

        let nextCursor = null;

        if (messages.length > Number(limit)) {
            const nextMessage = messages[messages.length - 1];
            nextCursor = nextMessage.createdAt.toISOString();
            messages.pop();
        }

        messages = messages.reverse();

        return res.status(200).json({
            messages,
            nextCursor,
        });
    } catch (error) {
        console.error("Lỗi xảy ra khi lấy messages", error);
        return res.status(500).json({ message: "Lỗi hệ thống" });
    }
};

export const getUserConversationsForSocketIO = async (userId) => {
    try {
        const conversations = await Conversation.find(
            { "participants.userId": userId },
            { _id: 1 },
        );

        return conversations.map((c) => c._id.toString());
    } catch (error) {
        console.error("Lỗi khi fetch conversations: ", error);
        return [];
    }
};

export const markAsSeen = async (req, res) => {
    try {
        const { conversationId } = req.params;
        const userId = req.user._id.toString();

        const conversation = await Conversation.findById(conversationId).lean();

        if (!conversation) {
            return res.status(404).json({ message: "Conversation không tồn tại" });
        }

        const last = conversation.lastMessage;

        if (!last) {
            return res.status(200).json({ message: "Không có tin nhắn để mark as seen" });
        }

        if (last.senderId.toString() === userId) {
            return res.status(200).json({ message: "Sender không cần mark as seen" });
        }

        const updated = await Conversation.findByIdAndUpdate(
            conversationId,
            {
                $addToSet: { seenBy: userId },
                $set: { [`unreadCounts.${userId}`]: 0 },
            },
            {
                new: true,
            },
        );

        io.to(conversationId).emit("read-message", {
            conversation: updated,
            lastMessage: {
                _id: updated?.lastMessage._id,
                content: updated?.lastMessage.content,
                createdAt: updated?.lastMessage.createdAt,
                sender: {
                    _id: updated?.lastMessage.senderId,
                },
            },
        });

        return res.status(200).json({
            message: "Marked as seen",
            seenBy: updated?.sennBy || [],
            myUnreadCount: updated?.unreadCounts[userId] || 0,
        });
    } catch (error) {
        console.error("Lỗi khi mark as seen", error);
        return res.status(500).json({ message: "Lỗi hệ thống" });
    }
};

export const updateConversationTheme = async (req, res) => {
    try {
        const { conversationId } = req.params;
        const { backgroundTheme } = req.body;
        const allowedThemes = ["default", "pink-hearts", "blue-clouds", "green-leaves"];

        if (!allowedThemes.includes(backgroundTheme)) {
            return res.status(400).json({ message: "Hình nền không hợp lệ" });
        }

        if (!mongoose.Types.ObjectId.isValid(conversationId)) {
            return res.status(400).json({ message: "ID cuộc trò chuyện không hợp lệ" });
        }

        const conversation = await Conversation.findOne({
            _id: conversationId,
            "participants.userId": req.user._id,
        });

        if (!conversation) {
            return res.status(404).json({ message: "Không tìm thấy cuộc trò chuyện" });
        }

        conversation.backgroundTheme = backgroundTheme;
        await conversation.save();

        const updatedConversation = {
            _id: conversation._id.toString(),
            backgroundTheme: conversation.backgroundTheme,
        };
        io.to(conversationId).emit("conversation-theme-updated", updatedConversation);

        return res.status(200).json({ conversation: updatedConversation });
    } catch (error) {
        console.error("Lỗi khi cập nhật hình nền cuộc trò chuyện", error);
        return res.status(500).json({ message: "Không thể cập nhật hình nền" });
    }
};

export const toggleMuteConversation = async (req, res) => {
    try {
        const { conversationId } = req.params;
        const userId = req.user._id;

        if (!mongoose.Types.ObjectId.isValid(conversationId)) {
            return res.status(400).json({ message: "ID cuộc trò chuyện không hợp lệ" });
        }

        const conversation = await Conversation.findOne({
            _id: conversationId,
            "participants.userId": userId,
        });

        if (!conversation) {
            return res.status(404).json({ message: "Không tìm thấy cuộc trò chuyện" });
        }

        const userIdStr = userId.toString();
        const isCurrentlyMuted = (conversation.mutedBy || []).some(
            (id) => id.toString() === userIdStr
        );

        if (isCurrentlyMuted) {
            conversation.mutedBy = (conversation.mutedBy || []).filter(
                (id) => id.toString() !== userIdStr
            );
        } else {
            if (!conversation.mutedBy) conversation.mutedBy = [];
            conversation.mutedBy.push(userId);
        }

        await conversation.save();

        const isMuted = !isCurrentlyMuted;

        return res.status(200).json({
            conversationId: conversation._id.toString(),
            isMuted,
            message: isMuted ? "Đã tắt thông báo" : "Đã bật thông báo",
        });
    } catch (error) {
        console.error("Lỗi khi bật/tắt thông báo cuộc trò chuyện", error);
        return res.status(500).json({ message: "Không thể thay đổi trạng thái thông báo" });
    }
};

export const deleteConversation = async (req, res) => {
    try {
        const { conversationId } = req.params;
        const userId = req.user._id;

        if (!mongoose.Types.ObjectId.isValid(conversationId)) {
            return res.status(400).json({ message: "ID cuộc trò chuyện không hợp lệ" });
        }

        const conversation = await Conversation.findOne({
            _id: conversationId,
            "participants.userId": userId,
        });

        if (!conversation) {
            return res.status(404).json({ message: "Không tìm thấy cuộc trò chuyện" });
        }

        const userIdStr = userId.toString();

        // If it's a group chat and the current user is the creator -> delete group entirely
        if (
            conversation.type === "group" &&
            conversation.group?.createdBy?.toString() === userIdStr
        ) {
            await Message.deleteMany({ conversationId: conversation._id });
            await Conversation.findByIdAndDelete(conversation._id);

            io.to(conversationId).emit("conversation-deleted", {
                conversationId: conversation._id.toString(),
                forAll: true,
            });

            return res.status(200).json({
                conversationId: conversation._id.toString(),
                message: "Đã xoá nhóm trò chuyện thành công",
            });
        }

        // Direct conversation or regular group member -> add user to deletedBy
        if (!conversation.deletedBy) conversation.deletedBy = [];
        if (!conversation.deletedBy.some((id) => id.toString() === userIdStr)) {
            conversation.deletedBy.push(userId);
        }

        // Check if all participants deleted the conversation
        const participantUserIds = conversation.participants.map((p) => p.userId.toString());
        const allDeleted = participantUserIds.every((pId) =>
            conversation.deletedBy.some((dId) => dId.toString() === pId)
        );

        if (allDeleted) {
            await Message.deleteMany({ conversationId: conversation._id });
            await Conversation.findByIdAndDelete(conversation._id);
        } else {
            await conversation.save();
        }

        return res.status(200).json({
            conversationId: conversation._id.toString(),
            message: "Đã xoá cuộc trò chuyện thành công",
        });
    } catch (error) {
        console.error("Lỗi khi xoá cuộc trò chuyện", error);
        return res.status(500).json({ message: "Không thể xoá cuộc trò chuyện" });
    }
};