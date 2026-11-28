<?php

namespace App\Notifications;

use App\Models\ContactMessage;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

/**
 * Sent to every admin holding `settings.manage` when a visitor submits the
 * Contact page's quick-send form — the admin-side bell counterpart of
 * QuickContactMessageReceived, which only ever e-mails the configured
 * recipient.
 */
class NewContactMessage extends Notification
{
    use Queueable;

    public function __construct(public ContactMessage $contact) {}

    /**
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        return ['database'];
    }

    /**
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        return [
            'type' => 'nouveau_contact',
            'contact_id' => $this->contact->id,
            'candidate_name' => trim("{$this->contact->prenoms} {$this->contact->nom}"),
        ];
    }
}
