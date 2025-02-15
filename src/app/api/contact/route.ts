import { NextResponse } from "next/server";
import nodemailer from "nodemailer";

export async function POST(req: Request) {
  try {
    const { name, email, message } = await req.json();

    if (!name || !email || !message) {
      return NextResponse.json({ error: "Όλα τα πεδία είναι υποχρεωτικά!" }, { status: 400 });
    }

    // 📩 Ρύθμιση SMTP transporter
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    // 📧 Email που θα σταλεί
    const mailOptions = {
      from: `"Platinum Hunters" <${process.env.EMAIL_USER}>`,
      to: process.env.EMAIL_USER, // Στέλνεις το email στον εαυτό σου
      subject: "Νέο αίτημα για Trophy Guide 📜",
      text: `Όνομα: ${name}\nEmail: ${email}\nΜήνυμα:\n${message}`,
    };

    await transporter.sendMail(mailOptions);

    return NextResponse.json({ success: true, message: "Το αίτημα εστάλη επιτυχώς!" });
  } catch (error) {
    console.error("❌ Σφάλμα στην αποστολή email:", error);
    return NextResponse.json({ error: "Αποτυχία αποστολής email" }, { status: 500 });
  }
}
