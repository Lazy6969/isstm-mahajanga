<?php

use App\Models\ContactMessage;
use App\Models\MailLog;
use App\Models\User;
use App\Notifications\AdminComposedMail;
use App\Role;
use Illuminate\Support\Facades\Notification;

it('forbids a non-super-admin from reaching the emails screen', function () {
    $etudiant = User::factory()->role(Role::Etudiant)->create();
    $contact = ContactMessage::factory()->create();

    $this->actingAs($etudiant)->get('/console/emails')->assertForbidden();
    $this->actingAs($etudiant)->get("/console/emails/{$contact->id}")->assertForbidden();
    $this->actingAs($etudiant)->post('/console/emails/envoyer', ['to_email' => 'a@example.com', 'subject' => 'x', 'body' => 'xx'])->assertForbidden();
});

it('lists received messages and sent mail logs with counts', function () {
    $admin = User::factory()->role(Role::Admin)->create();
    ContactMessage::factory()->count(2)->create();
    ContactMessage::factory()->create(['read_at' => now()]);
    MailLog::factory()->create();

    $this->actingAs($admin)->get('/console/emails')->assertInertia(fn ($page) => $page
        ->component('Admin/Emails/Index')
        ->where('counts.received', 3)
        ->where('counts.unread', 2)
        ->where('counts.sent', 1)
    );
});

it('shows one message and marks it read', function () {
    $admin = User::factory()->role(Role::Admin)->create();
    $contact = ContactMessage::factory()->create(['message' => 'Bonjour, une question.']);

    $this->actingAs($admin)->get("/console/emails/{$contact->id}")->assertInertia(fn ($page) => $page
        ->component('Admin/Emails/Show')
        ->where('mail.message', 'Bonjour, une question.')
    );

    expect($contact->fresh()->read_at)->not->toBeNull();
});

it('lets the super admin reply to a received message and logs it', function () {
    Notification::fake();
    $admin = User::factory()->role(Role::Admin)->create();
    $contact = ContactMessage::factory()->create(['email' => 'jean@example.com']);

    $this->actingAs($admin)->post("/console/emails/{$contact->id}/repondre", [
        'subject' => 'Re : Bonjour',
        'body' => 'Merci pour votre message.',
    ])->assertRedirect();

    Notification::assertSentOnDemand(
        AdminComposedMail::class,
        fn ($notification, $channels, $notifiable) => $notifiable->routes['mail'] === 'jean@example.com',
    );

    $contact->refresh();
    expect($contact->replied_at)->not->toBeNull();
    expect(MailLog::where('contact_message_id', $contact->id)->where('to_email', 'jean@example.com')->exists())->toBeTrue();
});

it('lets the super admin compose a free e-mail to any address', function () {
    Notification::fake();
    $admin = User::factory()->role(Role::Admin)->create();

    $this->actingAs($admin)->post('/console/emails/envoyer', [
        'to_email' => 'quelquun@example.com',
        'subject' => 'Bonjour',
        'body' => 'Un message libre.',
    ])->assertRedirect();

    Notification::assertSentOnDemand(
        AdminComposedMail::class,
        fn ($notification, $channels, $notifiable) => $notifiable->routes['mail'] === 'quelquun@example.com',
    );

    expect(MailLog::where('to_email', 'quelquun@example.com')->whereNull('contact_message_id')->exists())->toBeTrue();
});

it('records the real error on the mail log when sending fails', function () {
    $admin = User::factory()->role(Role::Admin)->create();
    Notification::shouldReceive('send')->andThrow(new RuntimeException('Connexion refusée'));

    $this->actingAs($admin)->post('/console/emails/envoyer', [
        'to_email' => 'quelquun@example.com',
        'subject' => 'Bonjour',
        'body' => 'Un message libre.',
    ])->assertRedirect()->assertSessionHas('error');

    $log = MailLog::where('to_email', 'quelquun@example.com')->first();
    expect($log->status)->toBe('failed');
    expect($log->error)->toBe('Connexion refusée');
});

it('toggles the read state of a received message', function () {
    $admin = User::factory()->role(Role::Admin)->create();
    $contact = ContactMessage::factory()->create(['read_at' => now()]);

    $this->actingAs($admin)->patch("/console/emails/{$contact->id}")->assertRedirect();
    expect($contact->fresh()->read_at)->toBeNull();

    $this->actingAs($admin)->patch("/console/emails/{$contact->id}")->assertRedirect();
    expect($contact->fresh()->read_at)->not->toBeNull();
});

it('lets the super admin delete a received message', function () {
    $admin = User::factory()->role(Role::Admin)->create();
    $contact = ContactMessage::factory()->create();

    $this->actingAs($admin)->delete("/console/emails/{$contact->id}")->assertRedirect();

    expect(ContactMessage::find($contact->id))->toBeNull();
});

it('lets the super admin delete a sent mail log', function () {
    $admin = User::factory()->role(Role::Admin)->create();
    $mail = MailLog::factory()->create();

    $this->actingAs($admin)->delete("/console/emails/envoyes/{$mail->id}")->assertRedirect();

    expect(MailLog::find($mail->id))->toBeNull();
});
