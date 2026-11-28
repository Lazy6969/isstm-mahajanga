<?php

use App\Models\Setting;
use App\Models\User;
use App\Notifications\MailConfigurationTest;
use App\Role;
use App\Services\DynamicMailConfigurator;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\Notification;

it('forbids a non-super-admin from viewing or changing mail settings', function () {
    $etudiant = User::factory()->role(Role::Etudiant)->create();

    $this->actingAs($etudiant)->get('/console/settings/mail')->assertForbidden();
    $this->actingAs($etudiant)->put('/console/settings/mail', ['enabled' => false, 'encryption' => 'tls', 'fromName' => 'ISSTM'])->assertForbidden();
    $this->actingAs($etudiant)->post('/console/settings/mail/test')->assertForbidden();
});

it('lets the super admin view mail settings with sensible defaults', function () {
    $admin = User::factory()->role(Role::Admin)->create();

    $this->actingAs($admin)->get('/console/settings/mail')->assertInertia(fn ($page) => $page
        ->component('Admin/Settings/Mail')
        ->where('settings.enabled', false)
        ->where('settings.hasPassword', false)
        ->where('settings.encryption', 'tls')
    );
});

it('lets the super admin save SMTP settings, with the password encrypted at rest', function () {
    $admin = User::factory()->role(Role::Admin)->create();

    $this->actingAs($admin)->put('/console/settings/mail', [
        'enabled' => true,
        'host' => 'smtp.gmail.com',
        'port' => 587,
        'username' => 'isstm.univ.umg@gmail.com',
        'password' => 'app-specific-password',
        'encryption' => 'tls',
        'fromAddress' => 'noreply@isstm.test',
        'fromName' => 'ISSTM Mahajanga',
    ])->assertRedirect();

    expect(Setting::get('mail.enabled'))->toBe('1')
        ->and(Setting::get('mail.host'))->toBe('smtp.gmail.com')
        ->and(Setting::get('mail.username'))->toBe('isstm.univ.umg@gmail.com')
        ->and(Setting::get('mail.password'))->not->toBe('app-specific-password')
        ->and(Crypt::decryptString(Setting::get('mail.password')))->toBe('app-specific-password');
});

it('keeps the existing password when the field is left blank on a later save', function () {
    $admin = User::factory()->role(Role::Admin)->create();
    Setting::set('mail.password', Crypt::encryptString('original-password'));

    $this->actingAs($admin)->put('/console/settings/mail', [
        'enabled' => true,
        'host' => 'smtp.gmail.com',
        'port' => 587,
        'username' => 'isstm.univ.umg@gmail.com',
        'password' => '',
        'encryption' => 'tls',
        'fromAddress' => 'noreply@isstm.test',
        'fromName' => 'ISSTM Mahajanga',
    ])->assertRedirect();

    expect(Crypt::decryptString(Setting::get('mail.password')))->toBe('original-password');
});

it('requires host, username and from address when enabling SMTP', function () {
    $admin = User::factory()->role(Role::Admin)->create();

    $this->actingAs($admin)->put('/console/settings/mail', [
        'enabled' => true,
        'encryption' => 'tls',
        'fromName' => 'ISSTM Mahajanga',
    ])->assertSessionHasErrors(['host', 'username', 'fromAddress']);
});

it('applies the saved SMTP settings to the mail config once enabled', function () {
    Setting::set('mail.enabled', '1');
    Setting::set('mail.host', 'smtp.example.test');
    Setting::set('mail.port', '2525');
    Setting::set('mail.username', 'bot@example.test');
    Setting::set('mail.password', Crypt::encryptString('secret'));
    Setting::set('mail.encryption', 'tls');
    Setting::set('mail.from_address', 'noreply@example.test');
    Setting::set('mail.from_name', 'Example');

    DynamicMailConfigurator::apply();

    expect(config('mail.default'))->toBe('smtp')
        ->and(config('mail.mailers.smtp.host'))->toBe('smtp.example.test')
        ->and(config('mail.mailers.smtp.port'))->toBe(2525)
        ->and(config('mail.mailers.smtp.password'))->toBe('secret')
        ->and(config('mail.from.address'))->toBe('noreply@example.test');
});

it('leaves the mail config untouched when the dynamic settings are disabled', function () {
    $defaultMailer = config('mail.default');
    Setting::set('mail.enabled', '0');

    DynamicMailConfigurator::apply();

    expect(config('mail.default'))->toBe($defaultMailer);
});

it('lets the super admin send a test e-mail to their own address', function () {
    Notification::fake();
    $admin = User::factory()->role(Role::Admin)->create();

    $this->actingAs($admin)->post('/console/settings/mail/test')->assertRedirect();

    Notification::assertSentTo($admin, MailConfigurationTest::class);
});
