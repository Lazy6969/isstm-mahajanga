<?php

namespace App\Http\Controllers;

use App\Models\ContactMessage;
use App\Models\SiteContent;
use App\Models\User;
use App\Notifications\NewContactMessage;
use App\Notifications\QuickContactMessageReceived;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Notification;
use Throwable;

class QuickContactController extends Controller
{
    /**
     * The Contact page's "send a quick message" form — kept here
     * (contact_messages) so a Super Admin can read and reply to it from
     * Admin\EmailController, and also forwarded straight to
     * contact_formulaire_email (editable via the pencil next to the form,
     * see ExternalPencil/EditLinkDialog) the same as before, so staff still
     * gets it in their real inbox even if nobody opens the console.
     */
    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'objet' => ['required', 'string', 'max:150'],
            'nom' => ['required', 'string', 'max:100'],
            'prenoms' => ['required', 'string', 'max:150'],
            'email' => ['required', 'string', 'email', 'max:255'],
            'telephone' => ['nullable', 'string', 'max:30'],
            'message' => ['required', 'string', 'max:2000'],
        ]);

        $contact = ContactMessage::create($validated);

        try {
            Notification::send(User::permission('settings.manage')->get(), new NewContactMessage($contact));
        } catch (Throwable $e) {
            report($e);
        }

        $recipient = SiteContent::where('content_key', 'contact_formulaire_email')->value('content_value_fr');

        if (! $recipient) {
            return back()->with('status', __('contact.formulaire_succes'));
        }

        try {
            Notification::route('mail', $recipient)->notify(new QuickContactMessageReceived(
                $validated['objet'],
                $validated['nom'],
                $validated['prenoms'],
                $validated['email'],
                $validated['telephone'] ?? null,
                $validated['message'],
            ));
        } catch (Throwable $e) {
            report($e);
        }

        return back()->with('status', __('contact.formulaire_succes'));
    }
}
