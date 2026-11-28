<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Models\Setting;
use App\Notifications\MailConfigurationTest;
use App\Services\DynamicMailConfigurator;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;
use Throwable;

/**
 * Lets a Super Admin configure outgoing e-mail (SMTP host/port/credentials)
 * from the admin interface instead of editing the server's .env file — the
 * whole point being that a shared-hosting deploy with no easy shell access
 * can still get transactional e-mail working. Values live in the `settings`
 * table (see Setting) under the `mail.*` keys; AppServiceProvider::boot()
 * applies them over the config at the start of every request when enabled.
 */
class MailSettingsController extends Controller
{
    public function index(): Response
    {
        $password = Setting::get('mail.password');

        return Inertia::render('Admin/Settings/Mail', [
            'settings' => [
                'enabled' => Setting::get('mail.enabled', '0') === '1',
                'host' => Setting::get('mail.host', ''),
                'port' => Setting::get('mail.port', '587'),
                'username' => Setting::get('mail.username', ''),
                'hasPassword' => $password !== null && $password !== '',
                'encryption' => Setting::get('mail.encryption', 'tls') ?: 'none',
                'fromAddress' => Setting::get('mail.from_address', ''),
                'fromName' => Setting::get('mail.from_name', config('app.name')),
            ],
        ]);
    }

    public function update(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'enabled' => ['required', 'boolean'],
            'host' => ['nullable', 'string', 'max:255', 'required_if:enabled,true'],
            'port' => ['nullable', 'integer', 'min:1', 'max:65535'],
            'username' => ['nullable', 'string', 'max:255', 'required_if:enabled,true'],
            'password' => ['nullable', 'string', 'max:255'],
            'encryption' => ['required', Rule::in(['tls', 'ssl', 'none'])],
            'fromAddress' => ['nullable', 'email', 'max:255', 'required_if:enabled,true'],
            'fromName' => ['required', 'string', 'max:255'],
        ]);

        Setting::set('mail.enabled', $validated['enabled'] ? '1' : '0');
        Setting::set('mail.host', $validated['host'] ?? '');
        Setting::set('mail.port', (string) ($validated['port'] ?? 587));
        Setting::set('mail.username', $validated['username'] ?? '');

        // The password field is write-only on the frontend (never echoed
        // back) — an empty submission means "keep the current one", not
        // "clear it", so only overwrite it when something was actually typed.
        if (filled($validated['password'] ?? null)) {
            Setting::set('mail.password', Crypt::encryptString($validated['password']));
        }

        Setting::set('mail.encryption', $validated['encryption'] === 'none' ? '' : $validated['encryption']);
        Setting::set('mail.from_address', $validated['fromAddress'] ?? '');
        Setting::set('mail.from_name', $validated['fromName']);

        DynamicMailConfigurator::apply();

        ActivityLog::record('mail_settings_updated', "Paramètres d'envoi d'e-mail du site modifiés");

        return back()->with('status', 'Paramètres e-mail mis à jour.');
    }

    /**
     * Sends a real test e-mail to the current admin through whatever is
     * configured right now (dynamic settings if enabled, otherwise the
     * server's own .env) — the whole point is surfacing the *actual* SMTP
     * error inline, without needing shell access to read the log.
     */
    public function test(Request $request): RedirectResponse
    {
        try {
            $request->user()->notifyNow(new MailConfigurationTest);
        } catch (Throwable $e) {
            report($e);

            return back()->with('error', "Échec de l'envoi : {$e->getMessage()}");
        }

        return back()->with('status', "E-mail de test envoyé à {$request->user()->email}.");
    }
}
