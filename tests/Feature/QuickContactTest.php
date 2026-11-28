<?php

use App\Models\ContactMessage;
use App\Models\SiteContent;
use App\Models\User;
use App\Notifications\NewContactMessage;
use App\Notifications\QuickContactMessageReceived;
use App\Role;
use Illuminate\Support\Facades\Notification;

it('e-mails the configured recipient and flashes a success message', function () {
    // The migration that introduces this key already seeds a default
    // (see add_contact_formulaire_email_site_content), so the row exists
    // from the very first migration — update it rather than create a
    // second, colliding one.
    SiteContent::where('content_key', 'contact_formulaire_email')->update(['content_value_fr' => 'scolarite@isstm.test']);
    Notification::fake();

    $this->post('/contact/message-rapide', [
        'objet' => 'Question sur les filières',
        'nom' => 'Rakoto',
        'prenoms' => 'Jean',
        'email' => 'jean.rakoto@example.com',
        'telephone' => '034 00 000 00',
        'message' => "Bonjour, j'aimerais des informations sur la filière Génie Civil.",
    ])->assertSessionHas('status');

    Notification::assertSentOnDemand(
        QuickContactMessageReceived::class,
        fn (QuickContactMessageReceived $notification, array $channels, object $notifiable) => $notifiable->routes['mail'] === 'scolarite@isstm.test'
            && $notification->objet === 'Question sur les filières'
            && $notification->nom === 'Rakoto'
            && $notification->prenoms === 'Jean'
            && $notification->fromEmail === 'jean.rakoto@example.com'
            && $notification->telephone === '034 00 000 00',
    );
});

it('accepts the message without a phone number', function () {
    SiteContent::where('content_key', 'contact_formulaire_email')->update(['content_value_fr' => 'scolarite@isstm.test']);
    Notification::fake();

    $this->post('/contact/message-rapide', [
        'objet' => 'Question',
        'nom' => 'Rakoto',
        'prenoms' => 'Jean',
        'email' => 'jean.rakoto@example.com',
        'message' => 'Bonjour.',
    ])->assertSessionHas('status');

    Notification::assertSentOnDemand(
        QuickContactMessageReceived::class,
        fn (QuickContactMessageReceived $notification) => $notification->telephone === null,
    );
});

it('requires an objet, a name, a first name, a valid e-mail and a message', function () {
    $this->post('/contact/message-rapide', [])->assertInvalid(['objet', 'nom', 'prenoms', 'email', 'message']);

    $this->post('/contact/message-rapide', [
        'objet' => 'Question',
        'nom' => 'Jean',
        'prenoms' => 'Jean',
        'email' => 'not-an-email',
        'message' => 'Bonjour',
    ])->assertInvalid(['email']);
});

it('keeps the message in contact_messages so it can be read and replied to from the console', function () {
    SiteContent::where('content_key', 'contact_formulaire_email')->update(['content_value_fr' => 'scolarite@isstm.test']);

    $this->post('/contact/message-rapide', [
        'objet' => 'Question sur les filières',
        'nom' => 'Rakoto',
        'prenoms' => 'Jean',
        'email' => 'jean.rakoto@example.com',
        'message' => "Bonjour, j'aimerais des informations.",
    ])->assertSessionHas('status');

    $contact = ContactMessage::where('email', 'jean.rakoto@example.com')->first();
    expect($contact)->not->toBeNull();
    expect($contact->objet)->toBe('Question sur les filières');
    expect($contact->read_at)->toBeNull();
});

it('notifies every settings.manage admin of the new message', function () {
    Notification::fake();
    $admin = User::factory()->role(Role::Admin)->create();

    $this->post('/contact/message-rapide', [
        'objet' => 'Question',
        'nom' => 'Rakoto',
        'prenoms' => 'Jean',
        'email' => 'jean.rakoto@example.com',
        'message' => 'Bonjour.',
    ])->assertSessionHas('status');

    Notification::assertSentTo($admin, NewContactMessage::class);
});

it('still stores the message and succeeds when no forwarding recipient is configured', function () {
    SiteContent::where('content_key', 'contact_formulaire_email')->update(['content_value_fr' => '']);

    $this->post('/contact/message-rapide', [
        'objet' => 'Question',
        'nom' => 'Rakoto',
        'prenoms' => 'Jean',
        'email' => 'jean.rakoto@example.com',
        'message' => 'Bonjour.',
    ])->assertSessionHas('status');

    expect(ContactMessage::where('email', 'jean.rakoto@example.com')->exists())->toBeTrue();
});
