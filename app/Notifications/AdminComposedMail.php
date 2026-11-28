<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

/**
 * A free-form e-mail an admin sends (or replies with) from the Boîte de
 * réception (Admin\InboxController) — sent on demand to an arbitrary address
 * via `Notification::route('mail', $to)->notify(...)`, never to a User.
 */
class AdminComposedMail extends Notification
{
    use Queueable;

    public function __construct(private readonly string $subject, private readonly string $body) {}

    /**
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $message = (new MailMessage)->subject($this->subject);

        foreach (explode("\n", $this->body) as $line) {
            $message->line($line);
        }

        return $message;
    }
}
