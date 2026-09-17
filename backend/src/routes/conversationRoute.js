import express from "express";
import {
    createConversation,
    getConversations,
    getMessages,
    markAsSeen,
    updateConversationTheme,
    toggleMuteConversation,
    deleteConversation,
} from "../controllers/conversationController.js";
import { checkFriendship } from "../middlewares/friendMiddleware.js";

const router = express.Router();

router.post("/", checkFriendship, createConversation);
router.get("/", getConversations);
router.get("/:conversationId/messages", getMessages);
router.patch("/:conversationId/seen", markAsSeen);
router.patch("/:conversationId/theme", updateConversationTheme);
router.patch("/:conversationId/mute", toggleMuteConversation);
router.delete("/:conversationId", deleteConversation);

export default router;
