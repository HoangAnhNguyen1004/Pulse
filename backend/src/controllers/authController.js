import bcrypt from "bcrypt";
import User from "../models/User.js ";
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import Session from "../models/Session.js";

const ACCESS_TOKEN_SECRET_TTL = '30m'; //thường là dưới 15p
const REFRESH_TOKEN_TTL = 14 * 24 * 60 * 60 * 1000; //14 ngày

export const signUp = async (req, res) => {
    try {
        const { username, password, email, firstName, lastName } = req.body;

        if (!username || !password || !email || !firstName || !lastName) {
            return res.status(400).json({ message: "Vui lòng điền đầy đủ thông tin!" });
        };

        //kiểm tra username tồn tại chưa
        const dulicate = await User.findOne({ username });
        if (dulicate) {
            return res.status(409).json({ message: "Tài khoản đã tồn tại!" });
        }

        //mã hoá password
        const hashedPassword = await bcrypt.hash(password, 10);

        //Tạo user mới
        await User.create({
            username,
            hashedPassword,
            email,
            displayName: `${firstName} ${lastName}`
        });

        //return
        return res.sendStatus(201);

    } catch (error) {
        console.error("Lỗi khi đăng ký: ", error);
        return res.status(500).json({ message: "Lỗi hệ thống " });
    }
};

export const signIn = async (req, res) => {
    try {
        //lấy inputs
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ message: "Thiếu usename hoặc password" })
        }

        //lấy hashedPassword từ database so với password input
        const user = await User.findOne({ username });

        if (!user) {
            return res.status(401).json({ message: "username hoặc password không chính xác" })
        }

        //kiểm tra password
        const passwordCorrect = await bcrypt.compare(password, user.hashedPassword);

        if (!passwordCorrect) {
            return res.status(401).json({messsage: "username hoặc password không chính xác"})
        }


        // nếu khớp, tạo access token với Jwt
        const accessToken = jwt.sign({userId: user._id}, 
            process.env.ACCESS_TOKEN_SECRET, 
            {expiresIn: ACCESS_TOKEN_SECRET_TTL}
        );


        //tạo refresh token bằng thư viện crypto và save vào db
        const refreshToken = crypto.randomBytes(64).toString('hex');

        //tạo session mới để lưu refresh token
        await Session.create({
            userId: user._id,
            refreshToken,
            expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL),
        })


        //trả refresh token về trong cookie
        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: true,
            sameSite: 'none', //backend, frontend deploy riêng
            maxAge: REFRESH_TOKEN_TTL,
        })

        //trả refresh token về trong res
        return res.status(200).json({
            message: `User ${user.displayName} đã đăng nhập!`,
            accessToken: accessToken
        });



    } catch (error) {
        console.error("Lỗi khi đăng nhập: ", error);
        return res.status(500).json({ message: "Lỗi hệ thống " });
    }
}

export const signOut = async (req, res) => {
    try {
        //Lấy refresh token trong cookie
        const token = req.cookies?.refreshToken;

        if (token) {
            //Xoá refresh token trong Session
            await Session.deleteOne({ refreshToken: token });

            //Xoá cookie
            res.clearCookie("refreshToken")
        }

        return res.sendStatus(204);



        //Xoá cookie
    } catch (error) {
        console.error("Lỗi khi đăng xuất: ", error);
        return res.status(500).json({ message: "Lỗi hệ thống " });
    }
}