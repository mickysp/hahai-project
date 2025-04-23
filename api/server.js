const express = require("express");
const app = express();
const port = 5001;
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
app.use(express.json());
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const jwt_decode = require('jwt-decode');

const User = require("./models/user");
const Blog = require("./models/blog");
const Feedback = require("./models/feedback");
const Report = require("./models/report");
const Message = require("./models/message");
const Notification = require("./models/notification");
const Category = require("./models/category");
const ChatRoom = require("./models/chatroom");
const PushToken = require('./models/pushToken');
const Received = require('./models/received');

const { Expo } = require('expo-server-sdk');
const expo = new Expo();

const cors = require('cors');
app.use(cors());

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

mongoose
    .connect('mongodb-hahai-database', {
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
    })
    .then(() => {
        console.log("Connected to MongoDB");
    })
    .catch((error) => {
        console.log("Error connecting to MongoDB", error);
    });

app.listen(port, () => {
    console.log('Server is running on port 5001');
});

app.get('/', (req, res) => {
    res.send('Api running');
  });

//endpoint ลงทะเบียน
app.post("/register", async (req, res) => {
    try {
        const { username, email, firstname, lastname, password } = req.body;

        const existingEmailUser = await User.findOne({ email });
        if (existingEmailUser) {
            console.log("อีเมลนี้ไม่สามารถใช้งานได้");
            return res.status(400).json({ message: "อีเมลนี้ไม่สามารถใช้งานได้" });
        }

        const existingUsernameUser = await User.findOne({ username });
        if (existingUsernameUser) {
            console.log("ชื่อผู้ใช้นี้ไม่สามารถใช้งานได้");
            return res.status(400).json({ message: "ชื่อผู้ใช้นี้ไม่สามารถใช้งานได้" });
        }

        const encryptedPassword = await bcrypt.hash(password, 10);

        const newUser = new User({
            username,
            email,
            firstname,
            lastname,
            verificationToken: crypto.randomBytes(20).toString("hex"),
            password: encryptedPassword,
        });

        console.log('ลงทะเบียนผู้ใช้ใหม่:', newUser);

        await newUser.save();

        await sendVerificationEmail(newUser.email, newUser.verificationToken);

        res.status(202).json({
            status: 'ok',
            email: newUser.email,
            verificationToken: newUser.verificationToken
        });
    } catch (error) {
        console.log("Error registering user", error);
        res.status(500).json({ message: "ลงทะเบียนไม่สำเร็จ กรุณาลองอีกครั้ง" });
    }
});

//ส่งอีเมล
const sendVerificationEmail = async (email, verificationToken) => {
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: 'hahaikku@gmail.com',
            pass: 'pass',
        },
    });

    const mailOptions = {
        from: 'kkingblub@gmail.com',
        to: email,
        subject: 'กรุณายืนยันอีเมลของคุณ',
        html: `
            <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif; background-color: #f9f9f9;">
                <!-- Header with Logo -->
                <div style="background-color: white; text-align: center; border-bottom: 1px solid #ddd;">
                    <img src="https://lh3.googleusercontent.com/pw/AP1GczPc0lvTH1B1p8Rz4_CzPotTNd4RCJ4akxTbxJBAP0JAsl6u7JOyHUl8BucbLdQhdUqPh7q5hAkhhNMBYBGiFYBkj4MqrxLqjfBU32qfXM4c_IGPRh4Biyf-pBMcqr83iF5Qq1mQ7rhdyaHBBQPlK2PG=w251-h240-s-no-gm?authuser=0" alt="Logo" style="width: 200px;"/>
                </div>
                
                <!-- Main Content -->
                <div style="text-align: center; color: #333; background-color: #f9f9f9;">
                    <h2 style="color: #006FFD; font-size: 24px; margin-bottom: 20px;">ยืนยันอีเมลของคุณ</h2>
                    <p style="font-size: 18px; margin: 0;">สวัสดีค่ะ</p>
                    <p style="font-size: 16px; margin: 20px 0;">กรุณาคลิกที่ปุ่มด้านล่างเพื่อยืนยันอีเมลของคุณ:</p>
                    <p style="margin-top: 20px;">
                        <a href="https://localhost:5001/verify/${verificationToken}"
                            style="display: inline-block; padding: 15px 30px; background-color: #006FFD; color: white; text-decoration: none; border-radius: 10px; font-size: 16px; font-weight: bold;">
                            คลิกที่นี่เพื่อยืนยัน
                        </a>
                    </p>
                </div>
                
                <!-- Footer -->
                <div style="background-color: white; padding: 20px; margin-top: 30px; border-top: 1px solid #ddd; text-align: center;">
                    <p style="font-size: 14px; color: #999; margin: 0;">ขอบคุณที่ใช้บริการของเรา!</p>
                    <!-- <p style="font-size: 14px; color: #999; margin: 5px 0;">หากคุณมีคำถามหรือข้อสงสัย โปรดติดต่อเราที่ <a href="mailto:support@example.com" style="color: #006FFD;">support@example.com</a></p> -->
                    <!-- <p style="font-size: 12px; color: #aaa; margin: 0;">© 2024 Company Name. All rights reserved.</p> -->
                </div>
            </div>
        `,
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log('ส่งอีเมลยืนยันเรียบร้อยแล้ว');
    } catch (error) {
        console.log('เกิดข้อผิดพลาดในการส่งอีเมลยืนยัน', error);
    }
};

//endpoint ยืนยันอีเมล
app.get("/verify/:token", async (req, res) => {
    try {
        const { token } = req.params;
        console.log("ได้รับ token แล้ว:", token);

        const user = await User.findOne({ verificationToken: token });

        if (!user) {
            return res.status(404).json({ message: "ข้อมูลไม่ถูกต้อง" });
        }

        const EMAIL_VERIFICATION_EXPIRY = 5 * 60 * 1000;

        const tokenAge = Date.now() - new Date(user.emailVerificationTokenCreatedAt).getTime();
        if (tokenAge > EMAIL_VERIFICATION_EXPIRY) {
            user.verificationToken = undefined;
            await user.save();
            console.log("รหัสนี้ใช้ไม่ได้แล้ว กรุณาขอรหัสใหม่เพื่อยืนยันอีเมลของคุณ");
            return res.status(400).send(`<p>หมดเวลายืนยันอีเมล กรุณาส่งรหัสยืนยันอีเมลอีกครั้ง...</p>`);
        }

        user.verified = true;
        user.verificationToken = undefined;

        await user.save();

        console.log("ยืนยันผู้ใช้เรียบร้อยแล้ว");

        return res.status(200).send(`<p>ยืนยันอีเมลสำเร็จ! กลับไปที่แอปของคุณเพื่อเข้าใช้งานแอปพลิเคชัน</p>`);

    } catch (error) {
        console.log("เกิดข้อผิดพลาด", error);
        if (!res.headersSent) {
            return res.status(500).json({ message: "ยืนยันอีเมลล้มเหลว กรุณาลองอีกครั้ง" });
        }
    }
});

//endpoint ตรวจสอบการยืนยันอีเมล
app.get("/verify-status/:email", async (req, res) => {
    try {
        const email = req.params.email;
        console.log("ได้รับอีเมล์แล้ว:", email);
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({ message: "ไม่พบผู้ใช้หรือ email ไม่ถูกต้อง" });
        }

        const EMAIL_VERIFICATION_EXPIRY = 5 * 60 * 1000; // 5 นาที
        const tokenAge = Date.now() - new Date(user.createdAt).getTime();

        if (!user.verified && tokenAge > EMAIL_VERIFICATION_EXPIRY) {
            // ลบผู้ใช้ที่ยังไม่ได้ยืนยันและหมดเวลา
            await User.deleteOne({ email });
            console.log("ลบผู้ใช้ที่ไม่ได้ยืนยันอีเมลแล้ว:", email);
            return res.status(410).json({ message: "หมดเวลายืนยันอีเมล ผู้ใช้ถูกลบออกจากระบบ" });
        }

        if (user.verified) {
            return res.status(200).json({ message: "ผู้ใช้ยืนยันอีเมลแล้ว" });
        } else {
            return res.status(400).json({ message: "ผู้ใช้ยังไม่ได้ยืนยันอีเมล" });
        }
    } catch (error) {
        console.log("เกิดข้อผิดพลาด:", error);
        return res.status(500).json({ message: "ตรวจสอบสถานะการยืนยันอีเมลล้มเหลว กรุณาลองอีกครั้ง" });
    }
});

const generateSecretKey = () => {
    const secretKey = crypto.randomBytes(32).toString("hex");
    return secretKey;
};

const secretKey = generateSecretKey();

//endpoint ส่งอีเมลอีกรอบ
app.post('/resend', async (req, res) => {
    const { email, username, firstname, lastname, password } = req.body;

    // Validate that all required fields are provided
    if (!email || !username || !firstname || !lastname || !password) {
        return res.status(400).json({ message: 'ข้อมูลไม่ครบถ้วน' });
    }

    try {
        let user = await User.findOne({ email });

        // If the user does not exist, create a new user and send the verification email
        if (!user) {
            const newVerificationToken = crypto.randomBytes(20).toString('hex');
            const encryptedPassword = bcrypt.hashSync(password, 10);  // Hashing password

            user = new User({
                username,
                email,
                firstname,
                lastname,
                password: encryptedPassword,
                verificationToken: newVerificationToken,
                verified: false,
                createdAt: new Date(),
            });

            await user.save();
            await sendVerificationEmail(email, newVerificationToken);
            return res.status(201).json({
                message: 'สร้างบัญชีใหม่และส่งอีเมลยืนยันแล้ว',
                user: { username, firstname, lastname, email }  // Send user info in response
            });
        }

        // If the user exists but the email is already verified
        if (user.verified) {
            return res.status(400).json({ message: 'อีเมลนี้ได้รับการยืนยันแล้ว' });
        }

        // If the user's verification token is expired, reset it
        const EMAIL_VERIFICATION_EXPIRY = 5 * 60 * 1000; // 5 minutes
        const tokenAge = Date.now() - new Date(user.createdAt).getTime();

        if (tokenAge > EMAIL_VERIFICATION_EXPIRY) {
            const newVerificationToken = crypto.randomBytes(20).toString('hex');
            user.verificationToken = newVerificationToken;
            user.createdAt = new Date();
            await user.save();
            await sendVerificationEmail(user.email, newVerificationToken);
            return res.status(200).json({
                message: 'รหัสยืนยันหมดอายุแล้ว ส่งอีเมลยืนยันใหม่เรียบร้อยแล้ว',
                user: { username: user.username, firstname: user.firstname, lastname: user.lastname, email: user.email }
            });
        }

        // If the user's token is still valid, simply resend the email
        await sendVerificationEmail(user.email, user.verificationToken);
        res.status(200).json({
            message: 'ส่งอีเมลยืนยันใหม่เรียบร้อยแล้ว',
            user: { username: user.username, firstname: user.firstname, lastname: user.lastname, email: user.email }
        });

    } catch (error) {
        console.log("เกิดข้อผิดพลาดในการส่งอีเมลยืนยันใหม่", error);
        res.status(500).json({ message: 'เกิดข้อผิดพลาดในการส่งอีเมลยืนยันใหม่' });
    }
});


//endpoint เข้าสู่ระบบ
app.post("/login", async (req, res) => {
    console.log("Received login request:", req.body);
    try {
        const { email, password } = req.body;

        // ค้นหาผู้ใช้ตามอีเมล
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({ message: "ข้อมูลไม่ถูกต้อง" });
        }

        // ตรวจสอบสถานะบัญชีผู้ใช้
        if (user.accountStatus === "suspended") {
            return res.status(403).json({ message: "บัญชีผู้ใช้ถูกระงับ ไม่สามารถเข้าสู่ระบบได้" });
        }

        // ตรวจสอบรหัสผ่าน
        if (!(await bcrypt.compare(password, user.password))) {
            return res.status(401).json({ message: "ข้อมูลไม่ถูกต้อง" });
        }

        // ตรวจสอบการยืนยันอีเมล
        if (!user.verified) {
            return res.status(401).json({ message: "กรุณายืนยันอีเมลของคุณก่อนเข้าสู่ระบบ" });
        }

        // สร้าง token
        const token = jwt.sign({ userId: user._id }, secretKey);

        // อัปเดตสถานะ isOnline
        user.isOnline = true;
        user.lastLogin = new Date();
        user.loginCount += 1;
        await user.save();

        console.log("Token: ", token);
        res.status(200).json({ status: 'ok', token });
    } catch (error) {
        console.log("เกิดข้อผิดพลาดในการเข้าสู่ระบบ กรุณาลองอีกครั้ง", error);
        res.status(500).json({ message: "เกิดข้อผิดพลาดในการเข้าสู่ระบบ กรุณาลองอีกครั้ง" });
    }
});

//endpoint ออกจากระบบ
app.post("/logout", async (req, res) => {
    try {
        const { userId } = req.body; // ใช้ userId ที่ได้จาก client

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "ไม่พบผู้ใช้" });
        }

        user.isOnline = false;
        await user.save();

        res.status(200).json({ message: "ออกจากระบบสำเร็จ" });
    } catch (error) {
        console.log("เกิดข้อผิดพลาดในการออกจากระบบ", error);
        res.status(500).json({ message: "เกิดข้อผิดพลาดในการออกจากระบบ" });
    }
});

//endpoint แสดงข้อมูลผู้ใช้
app.get("/profile/:userId", async (req, res) => {
    try {
        const userId = req.params.userId;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "ไม่พบผู้ใช้ที่ลงทะเบียน" });
        }

        res.status(200).json({ user });

    } catch (error) {
        res.status(500).json({ message: "เกิดข้อผิดพลาดในการแสดงข้อมูลผู้ใช้" });
    }
});

// ส่งรหัสรีเซ็ตรหัสผ่าน
const sendResetCodeEmail = async (email, resetCode, firstname, lastname) => {
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: 'kkingblub@gmail.com',
            pass: 'pass',
        },
    });

    const mailOptions = {
        from: 'kkingblub@gmail.com',
        to: email,
        subject: 'รหัสรีเซ็ตรหัสผ่าน',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 500px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
                <h2 style="color: #006FFD; text-align: center; font-size: 20px;">รีเซ็ตรหัสผ่านของคุณ</h2>
                <p style="font-size: 16px; color: #333; text-align: center;">สวัสดีคุณ ${firstname} ${lastname}</p>
                <p style="font-size: 16px; color: #333; text-align: center;">
                    คุณได้ร้องขอให้รีเซ็ตรหัสผ่าน กรุณาใช้รหัสด้านล่างนี้ภายใน 5 นาที:
                </p>
                <div style="text-align: center; margin: 20px 0;">
                    <span style="display: inline-block; padding: 10px 15px; font-size: 20px; color: #fff; background-color: #006FFD; border-radius: 4px;">
                        ${resetCode}
                    </span>
                </div>
                <p style="font-size: 16px; color: #333; text-align: center;">
                    หากคุณมีคำถามเพิ่มเติม กรุณาติดต่อเราที่ kkingblub@gmail.com
                </p>
                <p style="font-size: 16px; color: #333; text-align: center;">
                    ขอบคุณ, ทีมงาน Hahai application
                </p>
            </div>
        `,
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log('ส่งรหัสยืนยันเรียบร้อยแล้ว');
    } catch (error) {
        console.log('เกิดข้อผิดพลาดในการส่งรหัสยืนยัน', error);
        throw error;
    }
};

let resetCodes = {};

//endpoint รีเซ็ตรหัสผ่าน
app.post('/resetPassword', async (req, res) => {
    const { email } = req.body;

    try {
        const user = await User.findOne({ email });
        if (!user) {
            console.log("ไม่พบผู้ใช้ที่ลงทะเบียนอีเมลนี้");
            return res.status(404).json({ message: 'ข้อมูลไม่ถูกต้อง' });
        }

        console.log('User details:', user);

        const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
        resetCodes[email] = {
            code: resetCode,
            expires: Date.now() + 300000
        };

        await sendResetCodeEmail(email, resetCode, user.firstname, user.lastname);

        res.status(200).json({ status: 'ok', message: 'รหัสรีเซ็ตถูกส่งไปยังอีเมลของคุณแล้ว' });

    } catch (error) {
        console.log("เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง", error);
        res.status(500).json({ message: 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง' });
    }
});

//endpoint ยืนยันรหัสรีเซ็ต
app.post('/verifyResetCode', async (req, res) => {
    const { email, code } = req.body;

    try {
        const resetCodeEntry = resetCodes[email];
        if (!resetCodeEntry) {
            console.log("ไม่พบรหัสรีเซ็ตหรือรหัสรีเซ็ตหมดอายุแล้ว");
            return res.status(404).json({ message: 'ไม่พบรหัสรีเซ็ตหรือรหัสรีเซ็ตหมดอายุแล้ว' });
        }

        if (Date.now() > resetCodeEntry.expires) {
            console.log("รหัสรีเซ็ตหมดอายุแล้ว");
            delete resetCodes[email];
            return res.status(400).json({ message: 'รหัสรีเซ็ตหมดอายุแล้ว' });
        }

        if (resetCodeEntry.code !== code) {
            console.log("รหัสรีเซ็ตไม่ถูกต้อง");
            return res.status(400).json({ message: 'รหัสรีเซ็ตไม่ถูกต้อง' });
        }

        console.log("รหัสรีเซ็ตถูกต้อง");
        return res.status(200).json({ status: 'ok', message: 'รหัสรีเซ็ตถูกต้อง' });

    } catch (error) {
        console.log("เกิดข้อผิดพลาดในการตรวจสอบรหัสรีเซ็ต", error);
        res.status(500).json({ message: 'เกิดข้อผิดพลาดในการตรวจสอบรหัสรีเซ็ต' });
    }
});

//endpoint ตั้งรหัสผ่านใหม่
app.post('/newPassword', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: 'ข้อมูลไม่ครบถ้วน' });
    }

    try {
        const user = await User.findOne({ email });
        if (!user) {
            console.log("ไม่พบผู้ใช้ที่ลงทะเบียนอีเมลนี้");
            return res.status(404).json({ message: 'ไม่พบผู้ใช้ที่ลงทะเบียนอีเมลนี้' });
        }

        const encryptedPassword = await bcrypt.hash(password, 10);
        user.password = encryptedPassword;
        await user.save();

        console.log("เปลี่ยนรหัสผ่านเรียบร้อยแล้ว");
        return res.status(200).json({ message: 'เปลี่ยนรหัสผ่านเรียบร้อยแล้ว' });

    } catch (error) {
        console.log("เกิดข้อผิดพลาดในการเปลี่ยนรหัสผ่าน กรุณาลองอีกครั้ง", error);
        res.status(500).json({ message: 'เกิดข้อผิดพลาดในการเปลี่ยนรหัสผ่าน กรุณาลองอีกครั้ง' });
    }
});

//endpoint อัพเดทรหัสผ่าน
app.put("/updatePassword/:userId", async (req, res) => {
    try {
        const userId = req.params.userId;
        const { password } = req.body;

        if (!password) {
            return res.status(400).json({ message: "รหัสผ่านไม่ถูกต้อง" });
        }

        const encryptedPassword = await bcrypt.hash(password, 10);

        const result = await User.findByIdAndUpdate(userId, { password: encryptedPassword });

        if (!result) {
            return res.status(404).json({ message: "ไม่พบข้อมูลผู้ใช้" });
        }

        res.status(200).json({ message: "อัปเดตรหัสผ่านสำเร็จแล้ว" });

    } catch (error) {
        console.log("อัปเดตรหัสผ่านไม่สำเร็จ", error);
        res.status(500).json({ message: "อัปเดตรหัสผ่านไม่สำเร็จ กรุราลองอีกครั้ง" });
    }
});

//endpoint ยืนยันรหัสผ่านเพื่อเปลี่ยนอีเมล
app.post("/confirmPassword/:userId", async (req, res) => {
    try {
        const { password } = req.body;
        const { userId } = req.params;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(401).json({ message: "ข้อมูลไม่ถูกต้อง" });
        }

        if (!(await bcrypt.compare(password, user.password))) {
            return res.status(401).json({ message: "ข้อมูลไม่ถูกต้อง" });
        }

        res.status(200).json({ message: "ยืนยันรหัสผ่านสำเร็จ" });

    } catch (error) {
        console.log("ยืนยันรหัสผ่านไม่สำเร็จ กรุณาลองอีกครั้ง", error);
        res.status(500).json({ message: "ยืนยันรหัสผ่านไม่สำเร็จ กรุณาลองอีกครั้ง" });
    }
});

app.put("/updateEmail/:userId", async (req, res) => {
    try {
        const userId = req.params.userId;
        const { email } = req.body;

        // ตรวจสอบว่าอีเมลนี้มีอยู่แล้วหรือไม่
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: "อีเมลนี้ถูกใช้งานแล้ว" });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "ไม่พบผู้ใช้" });
        }

        user.email = email;
        user.verified = undefined;
        const newVerificationToken = crypto.randomBytes(20).toString('hex');
        user.verificationToken = newVerificationToken;
        user.createdAt = new Date();

        await user.save();

        await sendVerificationEmail(user.email, newVerificationToken);

        return res.status(200).json({ message: "ส่งอีเมลสำเร็จแล้ว", email: user.email, verificationToken: newVerificationToken });

    } catch (error) {
        console.error("เกิดข้อผิดพลาดในการอัพเดทอีเมล:", error);
        return res.status(500).json({ message: "เกิดข้อผิดพลาดในเซิร์ฟเวอร์" });
    }
});

//endpoint อัพเดทข้อมูลผู้ใช้
app.put("/updateProfile/:userId", async (req, res) => {
    try {
        const userId = req.params.userId;
        const { username, firstname, lastname, profileImage } = req.body;

        const result = await User.findByIdAndUpdate(userId, { username, firstname, lastname, profileImage });

        if (!result) {
            return res.status(404).json({ message: "ไม่พบข้อมูลผู้ใช้" });
        }

        res.status(200).json({ message: "อัปเดตโปรไฟล์สำเร็จแล้ว" });

    } catch (error) {
        console.log("เกิดข้อผิดพลาด อัปเดตโปรไฟล์ไม่สำเร็จ", error);
        res.status(500).json({ message: "อัปเดตโปรไฟล์ไม่สำเร็จ" });
    }
});

//endpoint ลบผู้ใช้
app.delete("/deleteUser/:userId", async (req, res) => {
    try {
        const userId = req.params.userId;

        if (!userId) {
            return res.status(400).json({ message: "ต้องระบุรหัสผู้ใช้" });
        }

        const user = await User.findByIdAndDelete(userId);

        if (!user) {
            return res.status(404).json({ message: "ไม่พบข้อมูลผู้ใช้" });
        }

        res.status(200).json({ message: "ลบข้อมูลผู้ใช้สำเร็จแล้ว" });
    } catch (error) {
        console.error("เกิดข้อผิดพลาด ลบข้อมูลผู้ใช้ไม่สำเร็จ", error);
        res.status(500).json({ message: "ลบข้อมูลผู้ใช้ไม่สำเร็จ" });
    }
});

app.post("/create", async (req, res) => {
    try {
        const { obj_picture, object_subtype, color, location, locationname, latitude, longitude, note, date, userId } = req.body;

        const newBlog = new Blog({
            obj_picture: obj_picture,
            object_subtype: object_subtype,
            color: color,
            location: location,
            locationname: locationname,
            latitude: latitude,
            longitude: longitude,
            note: note,
            date: date,
            user: userId,
            receivedStatus: false
        });

        await newBlog.save();

        const updatedUser = await User.findByIdAndUpdate(userId, { $push: { blog: newBlog._id } }, { new: true });

        if (!updatedUser) {
            return res.status(404).json({ message: "ไม่พบผู้ใช้" });
        }

        res.status(201).json({ message: "สร้างกระทู้สำเร็จ" });
    } catch (error) {
        console.log("เกิดข้อผิดพลาดในการสร้างกระทู้", error);
        res.status(500).json({ message: "เกิดข้อผิดพลาดในการสร้างกระทู้" });
    }
});

//endpoint แสดงกระทู้ทั้งหมด
app.get("/blogs", async (req, res) => {
    try {
        // ดึงข้อมูลบล็อกทั้งหมดและรวมข้อมูลผู้ใช้ที่เกี่ยวข้อง
        const blogs = await Blog.find().populate("user", "username firstname lastname profileImage");


        // กรองบล็อกที่มีข้อมูล user ที่เกี่ยวข้อง
        // const filteredBlogs = blogs.filter(blog => blog.user);
        const filteredBlogs = blogs.filter(blog => blog.user && blog.received !== true);

        // ส่งข้อมูลบล็อกที่ถูกกรองกลับไป
        res.status(200).json({ blogs: filteredBlogs });
    } catch (error) {
        console.log("เกิดข้อผิดพลาดในการแสดงกระทู้", error);
        res.status(500).json({ message: "เกิดข้อผิดพลาดในการแสดงกระทู้" });
    }
});

app.get('/blogs/:blogId', async (req, res) => {
    try {
        const blogId = req.params.blogId;
        const blog = await Blog.findById(blogId); // Assuming you have a Blog model

        if (!blog) {
            return res.status(404).json({ message: "Blog not found" });
        }

        res.status(200).json(blog);
    } catch (error) {
        console.error("Error fetching blog:", error);
        res.status(500).json({ message: "Error fetching blog" });
    }
});

//endpoint แสดงกระทู้ของผู้ใช้
app.get("/userBlogs/:userId", async (req, res) => {
    try {
        const { userId } = req.params;
        console.log("Fetching user with ID:", userId);

        const user = await User.findById(userId).populate('blog');

        if (!user) {
            console.log("User not found");
            return res.status(404).json({ message: "ไม่พบผู้ใช้" });
        }

        if (user.blog.length === 0) {
            console.log("User has no blogs");
            // return res.status(200).json({ message: "ไม่มีบล็อกที่สร้างโดยผู้ใช้" });
        }

        console.log("User blogs:", user.blog);
        res.status(200).json(user.blog);
    } catch (error) {
        console.error("Error occurred:", error);
        res.status(500).json({ message: "เกิดข้อผิดพลาดในการดึงกระทู้ของผู้ใช้" });
    }
});

//endpoint แก้ไขกระทู้
app.put("/updateBlog/:blogId", async (req, res) => {
    const { blogId } = req.params;
    const { object_subtype, color, location, locationname, latitude, longitude, note } = req.body;

    try {
        const blog = await Blog.findById(blogId);
        if (!blog) {
            return res.status(404).json({ message: 'ไม่พบกระทู้' });
        }

        blog.object_subtype = object_subtype || blog.object_subtype;
        blog.color = color || blog.color;
        blog.note = note || blog.note;
        blog.location = location || blog.location;
        blog.locationname = locationname || blog.locationname;
        blog.latitude = latitude || blog.latitude;
        blog.longitude = longitude || blog.longitude;

        await blog.save();
        res.status(200).json({ message: 'อัพเดตกระทู้สำเร็จ', blog });

    } catch (error) {
        console.error("เกิดข้อผิดพลาดในการอัพเดตกระทู้:", error);
        res.status(500).json({ message: 'เกิดข้อผิดพลาดในการอัพเดตกระทู้' });
    }
});

app.put('/blogs/:blogId/update-status', async (req, res) => {
    const { blogId } = req.params;
    try {
        const blog = await Blog.findById(blogId);

        if (!blog) {
            return res.status(404).json({ message: 'Blog not found' });
        }

        blog.receivedStatus = true;
        await blog.save();

        res.status(200).json({ message: 'Status updated successfully', blog });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});


app.post('/received', async (req, res) => {
    try {
        const { blog, receiverFirstName, receiverLastName, receiverPhone, receiverContact, user } = req.body;

        // Validate required fields
        if (!blog || !receiverFirstName || !receiverLastName || !receiverPhone || !user) {
            return res.status(400).json({ message: 'Missing required fields' });
        }

        // Log the received data for debugging
        console.log('Received data:', req.body);

        // Create a new Received entry
        const newReceived = new Received({
            blog,  // blog is referenced by ObjectId, not blogId
            receiverFirstName,
            receiverLastName,
            receiverPhone,
            receiverContact,
            user,  // Make sure 'user' is passed as ObjectId, not userId
            createdAt: new Date(),
        });

        // Save the entry to the database
        const savedReceived = await newReceived.save();
        res.status(201).json(savedReceived);
    } catch (error) {
        console.error('Error saving received data:', error.message);
        console.error(error.stack); // Log the stack trace for debugging
        res.status(500).json({ message: 'Error saving received data' });
    }
});

//endpoint ลบกระทู้
app.delete('/deleteBlog/:blogId', async (req, res) => {
    try {
        const { blogId } = req.params;

        const blog = await Blog.findByIdAndDelete(blogId);

        if (!blog) {
            return res.status(404).json({ message: "ไม่พบกระทู้ที่ต้องการลบ" });
        }

        await User.updateMany(
            { blog: blogId },
            { $pull: { blog: blogId } }
        );

        res.status(200).json({ message: "กระทู้ถูกลบเรียบร้อยแล้ว" });
    } catch (error) {
        console.error("เกิดข้อผิดพลาดในการลบกระทู้", error);
        res.status(500).json({ message: "เกิดข้อผิดพลาดในการลบกระทู้" });
    }
});

app.post("/feedback", async (req, res) => {
    try {
        const { category, description, user, feedback_image = "" } = req.body; // กำหนดค่าเริ่มต้นเป็น ""

        if (!category || !description || !user) {
            return res.status(400).json({ message: "กรุณากรอกข้อมูลให้ครบถ้วน" });
        }

        const newFeedback = new Feedback({
            description,
            category,
            feedback_image, // ค่าว่างถ้าไม่มีการอัปโหลดภาพ
            user,
        });

        await newFeedback.save();

        res.status(201).json({ message: "ข้อเสนอแนะของคุณถูกส่งเรียบร้อยแล้ว" });
    } catch (error) {
        console.error("เกิดข้อผิดพลาดในการส่งข้อเสนอแนะ", error);
        res.status(500).json({ message: "ข้อเสนอแนะของคุณดำเนินการไม่สำเร็จ" });
    }
});



//endpoint ดึงเจ้าของกระทู้
app.get('/getBlogOwner/:blogId', async (req, res) => {
    try {
        const blog = await Blog.findById(req.params.blogId).populate('user');
        if (!blog) {
            return res.status(404).send('Blog not found');
        }
        const blogOwner = blog.user;
        res.json(blogOwner);
    } catch (error) {
        console.error(error);
        res.status(500).send('Server error');
    }
});

app.post('/blog/:blogId/confirm-receipt', async (req, res) => {
    try {
        const { blogId } = req.params;
        const { receivedStatus } = req.body;

        // Update the received status
        const updatedBlog = await Blog.findByIdAndUpdate(
            blogId,
            { receivedStatus },
            { new: true }
        );

        if (!updatedBlog) {
            return res.status(404).json({ message: 'Blog not found' });
        }

        res.status(200).json(updatedBlog);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});


app.post('/report', async (req, res) => {
    try {
        console.log("Received Report Data from frontend:", req.body); // แสดงข้อมูลที่รับมาจาก frontend

        const { category, user, blog, blogOwner } = req.body;
        // ตรวจสอบค่า blogOwner ก่อนดำเนินการ
        console.log("Blog Owner Data:", blogOwner);

        if (!user) {
            console.log("Validation failed: User ID is missing");
            return res.status(400).json({ message: "User ID is required" });
        }
        if (!blog) {
            console.log("Validation failed: Blog ID is missing");
            return res.status(400).json({ message: "Blog ID is required" });
        }
        if (!category) {
            console.log("Validation failed: Category ID is missing");
            return res.status(400).json({ message: "Category ID is required" });
        }

        if (!blogOwner) {
            console.log("Validation failed: Blog owner is missing");
            return res.status(400).json({ message: "Blog owner is required" });
        }

        const newReport = new Report({
            category,
            user,
            blog,
            blogOwner,
            createdAt: new Date(),
        });

        console.log("Saving new report to the database...");
        const savedReport = await newReport.save();

        console.log("Report saved successfully:", savedReport);
        res.status(201).json({
            message: "การรายงานของคุณถูกส่งเรียบร้อยแล้ว",
            report: savedReport
        });

    } catch (error) {
        console.error("เกิดข้อผิดพลาดในการรายงานกระทู้ไม่พึงประสงค์:", error.message);
        res.status(500).json({
            message: "เกิดข้อผิดพลาดในการรายงานกระทู้ไม่พึงประสงค์",
            error: error.message
        });
    }
});

const savePushToken = async (userId, token) => {
    try {
        const existingToken = await PushToken.findOneAndUpdate(
            { token },
            { $set: { userId } },
            { new: true, upsert: true } // `upsert` will create a new document if none exists
        );
        console.log('Token processed for user:', userId);
    } catch (error) {
        console.error('Error storing token:', error);
    }
};

app.get('/users/:senderId', async (req, res) => {
    const { senderId } = req.params;
    try {
        const user = await User.findById(senderId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json(user);
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});


const http = require('http').createServer(app);
const io = require('socket.io')(http);

const userSocketMap = {};

io.on('connection', (socket) => {
    console.log('🔗 A user connected:', socket.id);

    const userId = socket.handshake.query.userId;
    const pushToken = socket.handshake.query.pushToken;

    if (userId && pushToken) {
        savePushToken(userId, pushToken);
    }

    if (userId && userId !== 'undefined') {
        if (!userSocketMap[userId]) {
            userSocketMap[userId] = [];
        }
        if (!userSocketMap[userId].includes(socket.id)) {
            userSocketMap[userId].push(socket.id);
        }
    }

    socket.on('disconnect', () => {
        if (userId && userSocketMap[userId]) {
            userSocketMap[userId] = userSocketMap[userId].filter(id => id !== socket.id);
            if (userSocketMap[userId].length === 0) {
                delete userSocketMap[userId];
            }
        }
        console.log('❌ A user disconnected:', socket.id);
    });

    socket.on('sendMessage', async ({ senderId, receiverId, text, blogId }) => {
        try {
            const sender = await User.findById(senderId);
            if (!sender) {
                throw new Error('Sender not found');
            }
            const senderName = `${sender.firstname} ${sender.lastname}`;

            let chatRoom = await ChatRoom.findOne({
                users: { $all: [senderId, receiverId] },
                blogId
            });

            if (!chatRoom) {
                chatRoom = new ChatRoom({ users: [senderId, receiverId], blogId });
                await chatRoom.save();
            }

            let chatMessage = await Message.findOne({ chatRoomId: chatRoom._id });
            if (!chatMessage) {
                chatMessage = new Message({ chatRoomId: chatRoom._id, messages: [] });
            }

            const newMessage = {
                senderId,
                senderName,
                text,
                createdAt: new Date().toISOString(),
                isRead: false
            };

            chatMessage.messages.push(newMessage);
            await chatMessage.save();

            chatRoom.lastMessage = { text, senderId, createdAt: new Date() };
            chatRoom.updatedAt = new Date();
            await chatRoom.save();

            if (userSocketMap[receiverId]) {
                userSocketMap[receiverId].forEach(socketId => {
                    io.to(socketId).emit('receiveMessage', newMessage);
                });
            } else {
                const receiverPushToken = await PushToken.findOne({ userId: receiverId });
                if (receiverPushToken && Expo.isExpoPushToken(receiverPushToken.token)) {
                    try {
                        const messages = [{
                            to: receiverPushToken.token,
                            sound: 'default',
                            title: `${senderName}`,
                            body: text,
                            data: { senderId, blogId, message: text },
                        }];

                        const ticket = await expo.sendPushNotificationsAsync(messages);
                        console.log("Push Notification Ticket:", ticket);
                    } catch (pushError) {
                        console.error('Push Notification Error:', pushError);
                    }
                }
            }

        } catch (error) {
            //console.error('Error sending message:', error);
            socket.emit('errorMessage', { error: 'ไม่สามารถส่งข้อความได้' });
        }
    });
});


http.listen(3000, () => console.log('Socket.IO running on port 3000'));

app.post('/send-message', async (req, res) => {
    const { senderId, receiverId, text, blogId } = req.body;

    try {
        if (senderId === receiverId) {
            return res.status(400).json({ error: "ไม่สามารถส่งข้อความถึงตัวเองได้" });
        }

        let chatRoom = await ChatRoom.findOne({
            users: { $all: [senderId, receiverId] },
            blogId
        });

        if (!chatRoom) {
            chatRoom = new ChatRoom({ users: [senderId, receiverId], blogId });
            await chatRoom.save();
        }

        let chatMessage = await Message.findOne({ chatRoomId: chatRoom._id });
        if (!chatMessage) {
            chatMessage = new Message({ chatRoomId: chatRoom._id, messages: [] });
        }

        const sender = await User.findById(senderId);
        const senderFullName = `${sender.firstname} ${sender.lastname}`;

        const newMessage = { senderId, username: senderFullName, text, createdAt: new Date().toISOString(), isRead: false };
        chatMessage.messages.push(newMessage);
        await chatMessage.save();

        chatRoom.lastMessage = { text, senderId, createdAt: new Date() };
        chatRoom.updatedAt = new Date();
        await chatRoom.save();

        const receiverSocketId = userSocketMap[receiverId];
        if (receiverSocketId) {
            io.to(receiverSocketId).emit('receiveMessage', newMessage);
        }

        res.status(201).json({ status: 'success', message: chatMessage });

    } catch (error) {
        console.error('Error sending message:', error);
        res.status(500).json({ status: 'error', message: 'Unable to send message' });
    }
});

app.get('/messages', async (req, res) => {
    try {
        const { senderId, receiverId, blogId } = req.query;

        const chatRoom = await ChatRoom.findOne({ users: { $all: [senderId, receiverId] }, blogId });
        if (!chatRoom) return res.status(404).json({ message: 'No chat history found' });

        const chatMessages = await Message.find({ chatRoomId: chatRoom._id })
            .sort({ 'messages.createdAt': 1 })
            .lean();

        if (!chatMessages.length) {
            return res.status(200).json([]);
        }

        let isChanged = false;
        for (const chatMessage of chatMessages) {
            for (const msg of chatMessage.messages) {
                if (String(msg.senderId) !== String(senderId) && !msg.isRead) {
                    msg.isRead = true;
                    msg.readAt = new Date();
                    isChanged = true;
                }
            }
        }

        if (isChanged) {
            await Promise.all(chatMessages.map(msg =>
                Message.updateOne({ _id: msg._id }, { $set: { messages: msg.messages } })));
            // Notify both users about the read status
            io.to(senderId).emit('messagesRead', { chatRoomId: chatRoom._id, userId: senderId });
            io.to(receiverId).emit('messagesRead', { chatRoomId: chatRoom._id, userId: senderId });
        }

        res.status(200).json(chatMessages);
    } catch (error) {
        console.error('Error loading messages:', error);
        res.status(500).json({ message: 'Error loading messages' });
    }
});

app.post('/mark-as-read', async (req, res) => {
    const { chatRoomId, userId } = req.body;

    if (!chatRoomId || !userId) {
        return res.status(400).json({ error: 'Missing required parameters' });
    }

    try {
        // หา messages ที่เกี่ยวข้องกับ chatRoomId และ userId
        const messages = await Message.find({ chatRoomId, receiverId: userId, isRead: false });

        if (messages.length === 0) {
            return res.status(404).json({ message: 'No unread messages found' });
        }

        // อัปเดตสถานะ isRead ให้เป็น true สำหรับทุกข้อความใน chatRoom ที่ยังไม่ได้อ่าน
        await Message.updateMany(
            { chatRoomId, receiverId: userId, isRead: false },
            { $set: { isRead: true, readAt: new Date().toISOString() } }
        );

        // ส่งข้อมูลไปให้ client ว่าการอัปเดตเสร็จสิ้นแล้ว
        res.status(200).json({ message: 'Messages marked as read successfully' });

    } catch (error) {
        console.error('Error marking messages as read:', error);
        res.status(500).json({ error: 'Failed to mark messages as read' });
    }
});

// ดึงข้อมูลการสนทนาผ่าน API
app.get('/conversations', async (req, res) => {
    try {
        const { senderId } = req.query;

        // ตรวจสอบว่า senderId ถูกส่งมาใน request หรือไม่
        if (!senderId) {
            return res.status(400).json({ message: 'senderId is required' });
        }

        // ค้นหาห้องแชททั้งหมดของผู้ใช้
        const chatRooms = await ChatRoom.find({ users: senderId })
            .populate('users', 'firstname lastname username profileImage')  // ดึงข้อมูลผู้ใช้
            .populate('blogId')  // ดึงข้อมูลบล็อกที่เกี่ยวข้อง
            .populate('lastMessage.senderId', 'firstname lastname');  // ดึงข้อมูลผู้ส่งข้อความล่าสุด

        res.status(200).json(chatRooms);
    } catch (error) {
        console.error('Error loading conversations:', error);
        res.status(500).json({ message: 'Error loading conversations' });
    }
});

app.post('/store-token', async (req, res) => {
    try {
        const { token, userId } = req.body;

        if (!token || !userId) {
            return res.status(400).json({ message: "Token and userId are required" });
        }

        const existingToken = await PushToken.findOne({ userId });

        if (existingToken) {
            existingToken.token = token;
            await existingToken.save();
        } else {
            const newToken = new PushToken({ userId, token });
            await newToken.save();
        }

        res.status(201).json({ message: "Token stored successfully" });
    } catch (error) {
        console.error("Error storing token:", error.message);
        console.error(error.stack); // Log the stack trace for more detailed debugging
        res.status(500).json({ message: "Internal server error" });
    }
});

// endpoint แสดงประเภทรายงานทั้งหมด
app.get("/categories", async (req, res) => {
    try {
        const categories = await Category.find();  // ดึงข้อมูลหมวดหมู่ทั้งหมดจากฐานข้อมูล

        res.status(200).json({ categories });
    } catch (error) {
        console.log("เกิดข้อผิดพลาดในการดึงข้อมูลหมวดหมู่", error);
        res.status(500).json({ message: "เกิดข้อผิดพลาดในการดึงข้อมูลหมวดหมู่" });
    }
});

// endpoint แสดงประเภทรายงานทั้งหมด
app.get("/categories", async (req, res) => {
    try {
        const categories = await Category.find();  // ดึงข้อมูลหมวดหมู่ทั้งหมดจากฐานข้อมูล
        res.status(200).json({ categories });
    } catch (error) {
        console.log("เกิดข้อผิดพลาดในการดึงข้อมูลหมวดหมู่", error);
        res.status(500).json({ message: "เกิดข้อผิดพลาดในการดึงข้อมูลหมวดหมู่" });
    }
});

// endpoint เพิ่มข้อมูลประเภทรายงาน
app.post("/categories", async (req, res) => {
    try {
        const { title, description } = req.body;

        if (!title || !description) {
            return res.status(400).json({ message: "กรุณากรอกชื่อและรายละเอียดหมวดหมู่" });
        }

        const newCategory = new Category({
            title,
            description
        });

        await newCategory.save();

        res.status(201).json({ message: "เพิ่มหมวดหมู่สำเร็จ", category: newCategory });

    } catch (error) {
        console.log("เกิดข้อผิดพลาดในการเพิ่มหมวดหมู่", error);
        res.status(500).json({ message: "เกิดข้อผิดพลาดในการเพิ่มหมวดหมู่" });
    }
});

const sendPushNotification = async (userId, description) => {
    const token = await fetchPushToken(userId);

    if (!Expo.isExpoPushToken(token)) {
        console.error('Push token is not a valid Expo push token');
        return;
    }

    // สร้าง message object
    const messagenotification = {
        to: token,
        sound: 'default',
        title: 'System Alert',
        body: description,
        data: { withSome: 'data' },  // ข้อมูลเพิ่มเติมที่คุณต้องการส่ง
    };

    try {
        // Chunking ข้อมูล push notifications
        let chunks = expo.chunkPushNotifications([messagenotification]);
        let tickets = [];
        for (let chunk of chunks) {
            try {
                const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
                tickets.push(...ticketChunk);
            } catch (error) {
                console.error('Error sending push notification chunk:', error);
            }
        }

        // ตรวจสอบว่า push notification ส่งสำเร็จหรือไม่
        tickets.forEach(ticket => {
            if (ticket.status === 'error') {
                console.error('Push notification error:', ticket.details);
            } else {
                console.log('Push notification sent successfully:', ticket);
            }
        });

    } catch (error) {
        console.error('Error sending push notification:', error);
    }
};

app.post('/notifications', async (req, res) => {
    try {
        const { userId, description } = req.body;
        if (!userId || !description) {
            return res.status(400).json({ message: 'User ID and Description are required' });
        }

        // สร้างการแจ้งเตือนใหม่
        const newNotification = new Notification({
            user: userId,
            description,
            createdAt: new Date(),
        });

        await newNotification.save();

        // ส่ง push notification หลังจากบันทึกการแจ้งเตือน
        const message = `New notification: ${description}`;
        await sendPushNotification(userId, message);  // Trigger push notification

        res.status(201).json(newNotification);
    } catch (error) {
        console.error('Error creating notification:', error);
        res.status(500).json({ message: 'Server error creating notification' });
    }
});

app.get('/notifications/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        console.log("Fetching notifications for userId:", userId); // Log the userId

        const notifications = await Notification.find({ user: userId })
            .populate('user', 'firstname lastname')  // Populate user info if needed
            .sort({ createdAt: -1 }); // Sorted by creation date

        if (!notifications || notifications.length === 0) {
            return res.status(404).json({ message: 'No notifications found for this user.' });
        }

        res.status(200).json(notifications);
    } catch (error) {
        console.error('Error fetching notifications:', error);
        res.status(500).json({ message: 'Server error fetching notifications' });
    }
});




