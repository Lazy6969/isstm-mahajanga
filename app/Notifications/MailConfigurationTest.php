<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

/**
 * Sent on demand from Admin → Paramètres → E-mail's "Envoyer un e-mail de
 * test" button (see MailSettingsController::test()) — never queued, so the
 * admin gets an immediate success/failure result instead of silently
 * dropping into the queue table.
 */
class MailConfigurationTest extends Notification
{
    use Queueable;

    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject('Test — Configuration e-mail ISSTM')
            ->greeting('Bonjour,')
            ->line("Cet e-mail confirme que l'envoi d'e-mails fonctionne correctement sur le site ISSTM Mahajanga.");
    }
}
