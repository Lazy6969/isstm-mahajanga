<?php

namespace App\Services;

use App\Models\Setting;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\Schema;
use Throwable;

/**
 * Overrides the `mail` config with settings entered in the admin interface
 * (see MailSettingsController) — lets a shared-hosting deploy with no easy
 * .env access get real SMTP working. Called from AppServiceProvider::boot()
 * on every request, and again right after MailSettingsController::update()
 * so a saved change takes effect immediately, in the same request that
 * might send a test e-mail — rather than only from the next request's boot.
 */
class DynamicMailConfigurator
{
    /**
     * Silently does nothing when disabled, when the `settings` table doesn't
     * exist yet (very first migration), or when the stored password fails to
     * decrypt (e.g. after an APP_KEY change) — in every one of those cases
     * the app falls back to whatever is already in .env.
     */
    public static function apply(): void
    {
        if (! Schema::hasTable('settings')) {
            return;
        }

        $settings = Setting::query()->where('key', 'like', 'mail.%')->pluck('value', 'key');

        if (($settings['mail.enabled'] ?? '0') !== '1') {
            return;
        }

        try {
            $password = isset($settings['mail.password']) ? Crypt::decryptString($settings['mail.password']) : null;
        } catch (Throwable) {
            return;
        }

        config([
            'mail.default' => 'smtp',
            'mail.mailers.smtp.host' => $settings['mail.host'] ?? null,
            'mail.mailers.smtp.port' => (int) ($settings['mail.port'] ?? 587),
            'mail.mailers.smtp.username' => $settings['mail.username'] ?? null,
            'mail.mailers.smtp.password' => $password,
            'mail.mailers.smtp.encryption' => ($settings['mail.encryption'] ?? '') ?: null,
            'mail.from.address' => $settings['mail.from_address'] ?? config('mail.from.address'),
            'mail.from.name' => $settings['mail.from_name'] ?? config('mail.from.name'),
        ]);
    }
}
