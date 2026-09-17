import { uploadImageFromBuffer } from "../middlewares/uploadMiddleware.js";
import User from "../models/User.js";
import bcrypt from "bcrypt";
import Session from "../models/Session.js";

export const authMe = async (req, res) => {
    try {
        const user = req.user; // lấy từ authMiddleware

        return res.status(200).json({
            user,
        });
    } catch (error) {
        console.error("Lỗi khi gọi authMe", error);
        return res.status(500).json({ message: "Lỗi hệ thống" });
    }
};

export const searchUserByUsername = async (req, res) => {
    try {
        const { username } = req.query;

        if (!username || username.trim() === "") {
            return res.status(400).json({ message: "Cần cung cấp username trong query." });
        }

        const user = await User.findOne({ username }).select(
            "_id displayName username avatarUrl"
        );

        return res.status(200).json({ user });
    } catch (error) {
        console.error("Lỗi xảy ra khi searchUserByUsername", error);
        return res.status(500).json({ message: "Lỗi hệ thống" });
    }
};

export const uploadAvatar = async (req, res) => {
    try {
        const file = req.file;
        const userId = req.user._id;

        if (!file) {
            return res.status(400).json({ message: "No file uploaded" });
        }

        const result = await uploadImageFromBuffer(file.buffer);

        const updatedUser = await User.findByIdAndUpdate(
            userId,
            {
                avatarUrl: result.secure_url,
                avatarId: result.public_id,
            },
            {
                new: true,
            }
        ).select("avatarUrl");

        if (!updatedUser.avatarUrl) {
            return res.status(400).json({ message: "Avatar trả về null" });
        }

        return res.status(200).json({ avatarUrl: updatedUser.avatarUrl });
    } catch (error) {
        console.error("Lỗi xảy ra khi upload avatar", error);
        return res.status(500).json({ message: "Upload failed" });
    }
};

export const updateProfile = async (req, res) => {
    try {
        const { displayName, email, phone, bio } = req.body;
        const updates = {};

        if (typeof displayName === "string") {
            const value = displayName.trim();
            if (!value) {
                return res.status(400).json({ message: "Tên hiển thị không được để trống" });
            }
            updates.displayName = value;
        }

        if (typeof email === "string") {
            const value = email.trim().toLowerCase();
            if (!/^\S+@\S+\.\S+$/.test(value)) {
                return res.status(400).json({ message: "Email không hợp lệ" });
            }

            const emailInUse = await User.exists({
                email: value,
                _id: { $ne: req.user._id },
            });
            if (emailInUse) {
                return res.status(409).json({ message: "Email đã được sử dụng" });
            }
            updates.email = value;
        }

        if (typeof phone === "string") updates.phone = phone.trim() || undefined;
        if (typeof bio === "string") updates.bio = bio.trim() || undefined;

        const user = await User.findByIdAndUpdate(req.user._id, updates, {
            new: true,
            runValidators: true,
        }).select("-hashedPassword");

        return res.status(200).json({ user });
    } catch (error) {
        console.error("Lỗi khi cập nhật hồ sơ", error);
        return res.status(500).json({ message: "Không thể cập nhật hồ sơ" });
    }
};

export const changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({ message: "Vui lòng nhập mật khẩu hiện tại và mật khẩu mới" });
        }
        if (newPassword.length < 6) {
            return res.status(400).json({ message: "Mật khẩu mới phải có ít nhất 6 ký tự" });
        }
        if (currentPassword === newPassword) {
            return res.status(400).json({ message: "Mật khẩu mới phải khác mật khẩu hiện tại" });
        }

        const user = await User.findById(req.user._id).select("+hashedPassword");
        const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.hashedPassword);
        if (!isCurrentPasswordValid) {
            return res.status(401).json({ message: "Mật khẩu hiện tại không chính xác" });
        }

        user.hashedPassword = await bcrypt.hash(newPassword, 10);
        await user.save();

        const currentRefreshToken = req.cookies?.refreshToken;
        await Session.deleteMany({
            userId: user._id,
            ...(currentRefreshToken && { refreshToken: { $ne: currentRefreshToken } }),
        });

        return res.status(200).json({ message: "Đổi mật khẩu thành công" });
    } catch (error) {
        console.error("Lỗi khi đổi mật khẩu", error);
        return res.status(500).json({ message: "Không thể đổi mật khẩu" });
    }
};
