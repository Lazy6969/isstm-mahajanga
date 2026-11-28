<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Models\ContactMessage;
use App\Models\MailLog;
use App\Notifications\AdminComposedMail;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Notification;
use Inertia\Inertia;
use Inertia\Response;
use Throwable;

/**
 * Gestion des e-mails : messages reçus du formulaire de contact du site
 * (ContactMessage), réponses rapides et envois libres (MailLog), historique.
 * No external mailbox/IMAP involved — "received" is this site's own contact
 * form (see QuickContactController), "sent" is whatever an admin has sent
 * from here, through whichever mailer is already configured
 * (DynamicMailConfigurator) via a plain on-demand Notification.
 */
class EmailController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('Admin/Emails/Index', [
            'received' => ContactMessage::withCount('replies')
                ->latest()
                ->get()
                ->map(fn (ContactMessage $contact) => $this->card($contact))
                ->values(),
            'sent' => MailLog::query()
                ->latest()
                ->get()
                ->map(fn (MailLog $mail) => $mail->present())
                ->values(),
            'counts' => [
                'unread' => ContactMessage::whereNull('read_at')->count(),
                'received' => ContactMessage::count(),
                'sent' => MailLog::count(),
            ],
            'mailer' => $this->mailerInfo(),
        ]);
    }

    public function show(ContactMessage $contact): Response
    {
        $contact->read_at ?? $contact->update(['read_at' => now()]);

        return Inertia::render('Admin/Emails/Show', [
            'mail' => [...$this->card($contact), 'message' => $contact->message],
            'replies' => $contact->replies->map(fn (MailLog $mail) => $mail->present())->values(),
            'mailer' => $this->mailerInfo(),
        ]);
    }

    /**
     * Réponse rapide à l'expéditeur d'un message reçu.
     */
    public function reply(Request $request, ContactMessage $contact): RedirectResponse
    {
        $validated = $request->validate([
            'subject' => ['required', 'string', 'max:150'],
            'body' => ['required', 'string', 'min:2', 'max:5000'],
        ]);

        $log = $this->deliver($request, $contact->email, $validated['subject'], $validated['body'], $contact->id);
        $contact->update(['replied_at' => now(), 'read_at' => $contact->read_at ?? now()]);

        return back()->with($log->status === 'failed' ? 'error' : 'status', $this->resultText($log));
    }

    /**
     * Envoi libre à n'importe quelle adresse.
     */
    public function send(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'to_email' => ['required', 'email', 'max:255'],
            'subject' => ['required', 'string', 'max:150'],
            'body' => ['required', 'string', 'min:2', 'max:5000'],
        ]);

        $log = $this->deliver($request, $validated['to_email'], $validated['subject'], $validated['body']);

        return back()->with($log->status === 'failed' ? 'error' : 'status', $this->resultText($log));
    }

    public function toggleRead(ContactMessage $contact): RedirectResponse
    {
        $contact->update(['read_at' => $contact->read_at ? null : now()]);

        return back();
    }

    public function destroy(ContactMessage $contact): RedirectResponse
    {
        $contact->delete();

        ActivityLog::record('contact_message_deleted', "Message de contact supprimé : {$contact->email}");

        return back()->with('status', 'Message supprimé.');
    }

    public function destroySent(MailLog $mail): RedirectResponse
    {
        $mail->delete();

        return back()->with('status', 'Message supprimé.');
    }

    /**
     * Envoie l'e-mail et garde une trace (envoyé, simulé en mode « log », ou échec avec l'erreur).
     */
    private function deliver(Request $request, string $to, string $subject, string $body, ?int $contactId = null): MailLog
    {
        $status = $this->mailerInfo()['live'] ? 'sent' : 'logged';
        $error = null;

        try {
            Notification::route('mail', $to)->notify(new AdminComposedMail($subject, $body));
        } catch (Throwable $e) {
            report($e);
            $status = 'failed';
            $error = str($e->getMessage())->limit(300)->toString();
        }

        return MailLog::create([
            'contact_message_id' => $contactId,
            'sent_by' => $request->user()->id,
            'to_email' => $to,
            'subject' => $subject,
            'body' => $body,
            'status' => $status,
            'error' => $error,
        ]);
    }

    private function resultText(MailLog $log): string
    {
        return match ($log->status) {
            'sent' => 'E-mail envoyé.',
            'logged' => 'E-mail enregistré mais non envoyé : le serveur mail est en mode « log ».',
            default => "Échec de l'envoi : {$log->error}",
        };
    }

    /**
     * @return array{driver: string, live: bool, from: ?string}
     */
    private function mailerInfo(): array
    {
        return [
            'driver' => config('mail.default'),
            'live' => ! in_array(config('mail.default'), ['log', 'array'], true),
            'from' => config('mail.from.address'),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function card(ContactMessage $contact): array
    {
        return [
            'id' => $contact->id,
            'objet' => $contact->objet,
            'nom' => $contact->nom,
            'prenoms' => $contact->prenoms,
            'email' => $contact->email,
            'telephone' => $contact->telephone,
            'excerpt' => str($contact->message)->limit(110)->toString(),
            'read' => (bool) $contact->read_at,
            'replied' => (bool) $contact->replied_at,
            'replies_count' => $contact->replies_count ?? 0,
            'at' => $contact->created_at->diffForHumans(),
            'date' => $contact->created_at->format('d/m/Y H:i'),
        ];
    }
}
