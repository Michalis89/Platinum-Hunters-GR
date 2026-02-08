type EmailTemplateConfig = {
  preheader: string;
  title: string;
  subtitle: string;
  intro: string;
  actionLabel: string;
  actionLink: string;
  outro: string;
  helper: string;
};

const palette = {
  bg: '#000000',
  surface: 'rgba(28, 28, 30, 0.92)',
  border: 'rgba(255, 255, 255, 0.1)',
  text: 'rgba(255, 255, 255, 0.95)',
  secondaryText: 'rgba(235, 235, 245, 0.6)',
  mutedText: 'rgba(235, 235, 245, 0.45)',
  brandBlue: '#007aff',
  brandBlueSoft: '#5ac8fa',
  brandGreen: '#34c759',
  white: '#ffffff',
};

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function renderEmailTemplate(config: EmailTemplateConfig): string {
  const safeLink = escapeHtml(config.actionLink);

  return `<!DOCTYPE html>
<html lang="el">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${config.title}</title>
  </head>
  <body style="margin:0;padding:0;background:${palette.bg};font-family:-apple-system,BlinkMacSystemFont,'SF Pro Text','SF Pro Display','Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:${palette.text};">
    <span style="display:none!important;visibility:hidden;opacity:0;color:transparent;height:0;width:0;overflow:hidden;mso-hide:all;">
      ${config.preheader}
    </span>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;background:radial-gradient(circle at 8% -10%, rgba(0,122,255,0.24), transparent 46%), radial-gradient(circle at 88% 0%, rgba(52,199,89,0.12), transparent 44%), ${palette.bg};">
      <tr>
        <td align="center" style="padding:28px 16px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;border-collapse:collapse;">
            <tr>
              <td style="padding:0 0 18px;text-align:center;">
                <p style="margin:0;font-size:22px;line-height:1.15;font-weight:700;letter-spacing:-0.02em;color:${palette.white};">Hobbistas</p>
                <p style="margin:6px 0 0;font-size:12px;line-height:1.4;color:${palette.secondaryText};">${config.subtitle}</p>
              </td>
            </tr>
            <tr>
              <td style="border-radius:24px;background:${palette.surface};border:1px solid ${palette.border};box-shadow:0 2px 8px rgba(0,0,0,0.45),0 18px 54px rgba(0,0,0,0.62);padding:32px 24px;">
                <div style="height:4px;border-radius:999px;background:linear-gradient(135deg, ${palette.brandBlue} 0%, ${palette.brandBlueSoft} 52%, ${palette.brandGreen} 100%);margin:0 0 20px;"></div>
                <h1 style="margin:0 0 12px;font-size:24px;line-height:1.2;font-weight:700;letter-spacing:-0.022em;color:${palette.text};">${config.title}</h1>
                <p style="margin:0 0 22px;font-size:15px;line-height:1.65;color:${palette.secondaryText};">${config.intro}</p>
                <div style="margin:0 0 20px;text-align:center;">
                  <a href="${safeLink}" style="display:inline-block;padding:14px 26px;border-radius:14px;background:linear-gradient(145deg, ${palette.brandBlue} 0%, ${palette.brandGreen} 100%);color:${palette.white};font-size:15px;font-weight:700;letter-spacing:-0.011em;text-decoration:none;box-shadow:0 10px 28px rgba(0,122,255,0.35);">
                    ${config.actionLabel}
                  </a>
                </div>
                <p style="margin:0;font-size:12.5px;line-height:1.65;color:${palette.secondaryText};">${config.outro}</p>
                <div style="margin-top:18px;padding-top:16px;border-top:1px solid ${palette.border};">
                  <p style="margin:0;font-size:12px;line-height:1.65;color:${palette.mutedText};">${config.helper}</p>
                  <p style="margin:8px 0 0;font-size:12px;line-height:1.55;word-break:break-all;">
                    <a href="${safeLink}" style="color:${palette.brandBlueSoft};text-decoration:none;">${safeLink}</a>
                  </p>
                </div>
              </td>
            </tr>
            <tr>
              <td style="padding:18px 8px 0;text-align:center;">
                <p style="margin:0;font-size:12px;line-height:1.6;color:${palette.secondaryText};">
                  <a href="https://www.hobbistas-hub.com/" style="color:${palette.brandBlueSoft};font-weight:600;text-decoration:none;">© 2026 Hobbistas</a>
                </p>
                <p style="margin:6px 0 0;font-size:12px;line-height:1.6;color:${palette.mutedText};">Για ερωτήσεις, απάντησε σε αυτό το email.</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

export function renderConfirmEmail(actionLink: string): string {
  if (!actionLink) throw new Error('Missing actionLink for confirm email');

  return renderEmailTemplate({
    preheader: 'Επιβεβαίωσε το email σου στο Hobbistas.',
    title: 'Επιβεβαίωση Email',
    subtitle: 'Το hub των hobbies σου',
    intro:
      'Καλώς ήρθες στο <strong style="color: rgba(255,255,255,0.95);">Hobbistas</strong>. Πάτα το κουμπί για να ολοκληρώσεις την εγγραφή σου.',
    actionLabel: 'Επιβεβαίωση Λογαριασμού',
    actionLink,
    outro: 'Αν δεν ζήτησες εσύ αυτή την ενέργεια, μπορείς να αγνοήσεις με ασφάλεια αυτό το email.',
    helper: 'Αν το κουμπί δεν λειτουργεί, αντέγραψε και άνοιξε το παρακάτω link:',
  });
}

export function renderResetPasswordEmail(actionLink: string): string {
  if (!actionLink) throw new Error('Missing actionLink for reset password email');

  return renderEmailTemplate({
    preheader: 'Επαναφορά κωδικού πρόσβασης στο Hobbistas.',
    title: 'Επαναφορά Κωδικού Πρόσβασης',
    subtitle: 'Ασφαλής ανάκτηση πρόσβασης',
    intro:
      'Ζήτησες επαναφορά κωδικού στο <strong style="color: rgba(255,255,255,0.95);">Hobbistas</strong>. Πάτα το κουμπί για να δημιουργήσεις νέο κωδικό πρόσβασης.',
    actionLabel: 'Επαναφορά Κωδικού',
    actionLink,
    outro: 'Αν δεν έκανες εσύ το αίτημα, δεν χρειάζεται να κάνεις κάποια ενέργεια.',
    helper: 'Αν το κουμπί δεν λειτουργεί, άνοιξε απευθείας το παρακάτω link:',
  });
}
