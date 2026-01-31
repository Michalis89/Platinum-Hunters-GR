import { resend } from './resend';
import { renderConfirmEmail, renderResetPasswordEmail } from './templates';

const FROM_ADDRESS = 'Hobbistas <no-reply@mail.hobbistas-hub.com>';

export async function sendConfirmEmail(toEmail: string, actionLink: string) {
  await resend.emails.send({
    from: FROM_ADDRESS,
    to: [toEmail],
    subject: 'Hobbistas — Επαλήθευση λογαριασμού',
    html: renderConfirmEmail(actionLink),
  });
}

export async function sendResetPasswordEmail(toEmail: string, actionLink: string) {
  await resend.emails.send({
    from: FROM_ADDRESS,
    to: [toEmail],
    subject: 'Hobbistas — Επαναφορά κωδικού',
    html: renderResetPasswordEmail(actionLink),
  });
}
