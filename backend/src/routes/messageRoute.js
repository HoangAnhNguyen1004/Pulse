import express from "express";

import {
    sendDirectMessage,
    sendGroupMessage,
    uploadMessageImage,
} from "../controllers/messageController.js";
import {
    checkFriendship,
    checkGroupMembership,
} from "../middlewares/friendMiddleware.js";
import { upload } from "../middlewares/uploadMiddleware.js";

const router = express.Router();

router.post("/upload", upload.single("image"), uploadMessageImage);
router.post("/direct", checkFriendship, sendDirectMessage);
router.post("/group", checkGroupMembership, sendGroupMessage);

export default router;