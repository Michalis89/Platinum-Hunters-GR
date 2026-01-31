export function renderConfirmEmail(actionLink: string): string {
  if (!actionLink) throw new Error('Missing actionLink for confirm email');
  return `<!DOCTYPE html>
<html lang="el">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Επιβεβαίωση Λογαριασμού</title>
  </head>

  <body
    style="
      margin: 0;
      padding: 0;
      background: #0b0b0f;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      color: #f5f5f5;
    "
  >
    <table
      align="center"
      width="100%"
      cellpadding="0"
      cellspacing="0"
      style="max-width: 560px; margin: 0 auto; padding: 28px 18px;"
    >
      <tr>
        <td style="text-align: center; padding: 8px 0 18px;">
          <div style="display: inline-block; text-align: center;">
            <div
              style="
                font-size: 22px;
                font-weight: 800;
                letter-spacing: 0.6px;
                color: #ffffff;
              "
            >
              Hobbistas
            </div>
            <div style="font-size: 12px; color: #a1a1b3; margin-top: 6px;">
              Το hub των hobbies σου
            </div>
          </div>
        </td>
      </tr>

      <tr>
        <td
          style="
            background: rgba(16, 16, 22, 0.92);
            border: 1px solid rgba(255, 255, 255, 0.08);
            border-radius: 20px;
            padding: 34px 26px;
            box-shadow: 0 18px 60px rgba(0, 0, 0, 0.7);
          "
        >
          <div
            style="
              height: 4px;
              width: 100%;
              border-radius: 999px;
              background: linear-gradient(90deg, #e50914, #ff4d5a);
              margin: -8px 0 18px;
            "
          ></div>

          <h2
            style="
              margin: 0 0 10px;
              font-size: 22px;
              line-height: 1.25;
              font-weight: 800;
              color: #ffffff;
            "
          >
            Επιβεβαίωση Email
          </h2>

          <p style="margin: 0 0 18px; font-size: 15px; line-height: 1.7; color: #a1a1b3;">
            Καλώς ήρθες στο <strong style="color: #f5f5f5;">Hobbistas</strong>!
            Για να ολοκληρώσεις την εγγραφή σου, κάνε κλικ στο κουμπί:
          </p>

          <div style="text-align: center; margin: 24px 0 18px;">
            <a
              href="${actionLink}"
              style="
                display: inline-block;
                background: linear-gradient(90deg, #e50914, #ff4d5a);
                color: #ffffff;
                padding: 14px 26px;
                border-radius: 14px;
                font-weight: 800;
                text-decoration: none;
                box-shadow: 0 10px 26px rgba(229, 9, 20, 0.35);
              "
            >
              Επιβεβαίωση Λογαριασμού
            </a>
          </div>

          <p style="margin: 0; font-size: 12.5px; line-height: 1.7; color: #a1a1b3;">
            Αν δεν ζήτησες εσύ αυτή την ενέργεια, απλά αγνόησε αυτό το email.
          </p>

          <div
            style="
              margin-top: 18px;
              padding-top: 16px;
              border-top: 1px solid rgba(255, 255, 255, 0.08);
              color: #a1a1b3;
              font-size: 12px;
              line-height: 1.6;
            "
          >
            Αν το κουμπί δεν δουλεύει, αντέγραψε και άνοιξε αυτό το link:
            <div style="word-break: break-all; margin-top: 8px;">
              <a href="${actionLink}" style="color: #ff4d5a; text-decoration: none;">
                ${actionLink}
              </a>
            </div>
          </div>
        </td>
      </tr>

      <tr>
        <td style="text-align: center; padding: 18px 6px 0; color: #a1a1b3; font-size: 12px;">
          <a
            href="https://www.hobbistas-hub.com/"
            style="color: #ff4d5a; text-decoration: none; font-weight: 700;"
          >
            © 2026 Hobbistas
          </a>
          <div style="margin-top: 6px; color: #6f6f86;">
            Αν έχεις απορίες, απάντησε σε αυτό το email.
          </div>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

export function renderResetPasswordEmail(actionLink: string): string {
  if (!actionLink) throw new Error('Missing actionLink for reset password email');
  return `<!DOCTYPE html>
<html lang="el">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Επαναφορά Κωδικού</title>
  </head>

  <body
    style="
      margin: 0;
      padding: 0;
      background: #0b0b0f;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      color: #f5f5f5;
    "
  >
    <table
      align="center"
      width="100%"
      cellpadding="0"
      cellspacing="0"
      style="max-width: 560px; margin: 0 auto; padding: 28px 18px;"
    >
      <tr>
        <td style="text-align: center; padding: 8px 0 18px;">
          <div style="display: inline-block; text-align: center;">
            <div
              style="
                font-size: 22px;
                font-weight: 800;
                letter-spacing: 0.6px;
                color: #ffffff;
              "
            >
              Hobbistas
            </div>
            <div style="font-size: 12px; color: #a1a1b3; margin-top: 6px;">
              Επαναφορά πρόσβασης
            </div>
          </div>
        </td>
      </tr>

      <tr>
        <td
          style="
            background: rgba(16, 16, 22, 0.92);
            padding: 34px 26px;
            border-radius: 20px;
            border: 1px solid rgba(255, 255, 255, 0.08);
            box-shadow: 0 18px 60px rgba(0, 0, 0, 0.7);
          "
        >
          <div
            style="
              height: 4px;
              width: 100%;
              border-radius: 999px;
              background: linear-gradient(90deg, #e50914, #ff4d5a);
              margin: -8px 0 18px;
            "
          ></div>

          <h2
            style="
              margin: 0 0 12px;
              font-size: 22px;
              font-weight: 800;
              color: #ffffff;
            "
          >
            Επαναφορά Κωδικού Πρόσβασης
          </h2>

          <p style="font-size: 15px; line-height: 1.7; color: #a1a1b3; margin: 0 0 20px;">
            Ζήτησες επαναφορά του κωδικού σου στο
            <strong style="color: #f5f5f5;">Hobbistas</strong>.
            Πάτα το κουμπί παρακάτω για να δημιουργήσεις νέο κωδικό:
          </p>

          <div style="text-align: center; margin: 24px 0 18px;">
            <a
              href="${actionLink}"
              style="
                display: inline-block;
                background: linear-gradient(90deg, #e50914, #ff4d5a);
                color: #ffffff;
                padding: 14px 26px;
                border-radius: 14px;
                font-weight: 800;
                text-decoration: none;
                box-shadow: 0 10px 26px rgba(229, 9, 20, 0.35);
              "
            >
              Επαναφορά Κωδικού
            </a>
          </div>

          <p style="font-size: 12.5px; line-height: 1.7; color: #a1a1b3; margin: 0;">
            Αν δεν ζήτησες εσύ επαναφορά, μπορείς απλά να αγνοήσεις αυτό το email.
          </p>

          <div
            style="
              margin-top: 18px;
              padding-top: 16px;
              border-top: 1px solid rgba(255, 255, 255, 0.08);
              color: #a1a1b3;
              font-size: 12px;
              line-height: 1.6;
            "
          >
            Αν το κουμπί δεν δουλεύει, άνοιξε αυτό το link:
            <div style="word-break: break-all; margin-top: 8px;">
              <a
                href="${actionLink}"
                style="color: #ff4d5a; text-decoration: none;"
              >
                ${actionLink}
              </a>
            </div>
          </div>

          <div style="margin-top: 14px; color: #6f6f86; font-size: 12px; line-height: 1.6;">
            Tip: Για καλύτερη ασφάλεια, διάλεξε έναν ισχυρό κωδικό που δεν χρησιμοποιείς αλλού.
          </div>
        </td>
      </tr>

      <tr>
        <td
          style="
            text-align: center;
            padding-top: 18px;
            color: #6f6f86;
            font-size: 12px;
          "
        >
          <a
            href="https://www.hobbistas-hub.com/"
            style="color: #ff4d5a; text-decoration: none; font-weight: 700;"
          >
            © 2026 Hobbistas
          </a>
          <div style="margin-top: 6px; color: #a1a1b3;">
            Αν δεν αναγνώρισες το αίτημα, δεν χρειάζεται να κάνεις κάτι.
          </div>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}
