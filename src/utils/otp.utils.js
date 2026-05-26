const generateOtp = ()=>{
    return Math.floor(100000 + Math.random() * 900000 ).toString()
}

const getOtpHtml = (otp)=>{
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>OTP Verification</title>
</head>
<body style="margin:0; padding:0; background-color:#f4f4f4; font-family:Arial, sans-serif;">

  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f4f4f4; padding:30px 0;">
    <tr>
      <td align="center">

        <table width="600" cellpadding="0" cellspacing="0" border="0"
          style="background:#ffffff; border-radius:12px; overflow:hidden; box-shadow:0 4px 10px rgba(0,0,0,0.08);">

          <!-- Header -->
          <tr>
            <td align="center"
              style="background:linear-gradient(135deg,#4f46e5,#7c3aed); padding:40px 20px; color:white;">
              <h1 style="margin:0; font-size:28px;">OTP Verification</h1>
              <p style="margin-top:10px; font-size:16px; opacity:0.9;">
                Secure Verification Code
              </p>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding:40px 30px; color:#333333;">

              <h2 style="margin-top:0; font-size:24px;">
                Hello User 👋
              </h2>

              <p style="font-size:16px; line-height:1.7;">
                We received a request to verify your account. Please use the following One-Time Password (OTP) to continue:
              </p>

              <!-- OTP Box -->
              <div style="text-align:center; margin:35px 0;">
                <span style="
                  display:inline-block;
                  background:#f3f4f6;
                  color:#4f46e5;
                  font-size:32px;
                  font-weight:bold;
                  letter-spacing:8px;
                  padding:18px 35px;
                  border-radius:10px;
                  border:2px dashed #7c3aed;
                ">
                  ${otp}
                </span>
              </div>

              <p style="font-size:15px; line-height:1.7; color:#555555;">
                This OTP is valid for <strong>10 minutes</strong>. Please do not share this code with anyone for security reasons.
              </p>

              <p style="font-size:15px; line-height:1.7; color:#555555;">
                If you did not request this verification, you can safely ignore this email.
              </p>

              <hr style="border:none; border-top:1px solid #e5e7eb; margin:30px 0;" />

              <p style="font-size:14px; color:#888888; text-align:center;">
                © 2026 Authentication System. All rights reserved.
              </p>

            </td>
          </tr>

        </table>

      </td>
    </tr>
  </table>

</body>
</html>`
}

export default {
    generateOtp,
    getOtpHtml
}