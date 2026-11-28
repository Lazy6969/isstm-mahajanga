import { useState } from 'react';
import { Link, router, useForm } from '@inertiajs/react';
import { ArrowLeft, Mail, Save, Send } from 'lucide-react';
import AdminLayout from '../../../Components/Layout/AdminLayout';
import { Label } from '../../../Components/ui/label';
import { Input } from '../../../Components/ui/input';
import { cn } from '../../../lib/utils';
import { useTranslations } from '../../../lib/useTranslations';

/** Same big on/off switch look as Maintenance.jsx, kept local to avoid a cross-page import. */
function PowerSwitch({ on, onChange, labelOn, labelOff }) {
    return (
        <button
            type="button"
            role="switch"
            aria-checked={on}
            aria-label={on ? labelOn : labelOff}
            onClick={onChange}
            className={cn(
                'relative h-9 w-[4.5rem] flex-shrink-0 rounded-full p-1 shadow-inner transition-all duration-300 focus:outline-none focus-visible:ring-4 focus-visible:ring-admin-accent/25',
                on ? 'bg-gradient-to-r from-emerald-500 to-teal-500' : 'bg-slate-300 dark:bg-slate-600',
            )}
        >
            <span className={cn('flex h-7 w-7 items-center justify-center rounded-full bg-white shadow-md transition-transform duration-300 ease-out', on && 'translate-x-9')} />
        </button>
    );
}

export default function MailSettings({ settings }) {
    const { t } = useTranslations();
    const form = useForm({
        enabled: settings.enabled,
        host: settings.host,
        port: settings.port,
        username: settings.username,
        password: '',
        encryption: settings.encryption,
        fromAddress: settings.fromAddress,
        fromName: settings.fromName,
    });
    const [testing, setTesting] = useState(false);

    function submit(e) {
        e.preventDefault();
        form.put('/console/settings/mail', { preserveScroll: true, onSuccess: () => form.setData('password', '') });
    }

    function sendTest() {
        setTesting(true);
        router.post('/console/settings/mail/test', {}, { preserveScroll: true, onFinish: () => setTesting(false) });
    }

    const dirty =
        form.data.enabled !== settings.enabled ||
        form.data.host !== settings.host ||
        form.data.port !== settings.port ||
        form.data.username !== settings.username ||
        form.data.password !== '' ||
        form.data.encryption !== settings.encryption ||
        form.data.fromAddress !== settings.fromAddress ||
        form.data.fromName !== settings.fromName;

    return (
        <AdminLayout
            title={t('admin.auto.email_a1b2', 'E-mail')}
            actions={
                <Link href="/console/emails" className="flex items-center gap-1.5 text-sm font-medium text-admin-text-secondary hover:text-admin-text">
                    <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                    Retour aux e-mails
                </Link>
            }
        >
            <div className="relative -mt-2 mb-5 overflow-hidden rounded-3xl bg-gradient-to-br from-admin-accent via-admin-accent/90 to-sky-500 p-5 text-white shadow-lg shadow-admin-accent/20 sm:p-6">
                <span className="pointer-events-none absolute -right-10 -top-16 h-52 w-52 rounded-full bg-white/15 blur-3xl" />
                <div className="relative flex items-center gap-4">
                    <span className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl bg-white/20 ring-1 ring-white/30 backdrop-blur">
                        <Mail className="h-7 w-7" aria-hidden="true" />
                    </span>
                    <div>
                        <h2 className="text-lg font-bold sm:text-xl">{t('admin.auto.envoi_email_c3d4', "Envoi d'e-mails")}</h2>
                        <p className="mt-0.5 max-w-2xl text-sm text-white/85">
                            Configure le serveur SMTP utilisé pour les e-mails du site (mot de passe oublié, confirmations de dossier, notifications) — sans toucher au serveur.
                        </p>
                    </div>
                </div>
            </div>

            <form onSubmit={submit} className="space-y-5">
                <div className="flex items-center justify-between gap-4 rounded-2xl border border-admin-border bg-admin-card p-5 shadow-sm">
                    <div>
                        <p className="text-sm font-bold text-admin-text">Utiliser cette configuration SMTP</p>
                        <p className="mt-0.5 text-xs text-admin-text-secondary">
                            Désactivé, le site utilise la configuration par défaut du serveur (fichier .env) — souvent limitée sur un hébergement mutualisé.
                        </p>
                    </div>
                    <PowerSwitch on={form.data.enabled} onChange={() => form.setData('enabled', !form.data.enabled)} labelOn="Désactiver" labelOff="Activer" />
                </div>

                <div className="grid grid-cols-1 gap-5 rounded-2xl border border-admin-border bg-admin-card p-5 shadow-sm sm:grid-cols-2">
                    <div>
                        <Label htmlFor="mail-host">Hôte SMTP</Label>
                        <Input
                            id="mail-host"
                            value={form.data.host}
                            onChange={(e) => form.setData('host', e.target.value)}
                            placeholder="smtp.gmail.com"
                            className="mt-1.5 rounded-xl"
                            autoComplete="off"
                        />
                        {form.errors.host && <p className="mt-1 text-sm text-red-500">{form.errors.host}</p>}
                    </div>

                    <div>
                        <Label htmlFor="mail-port">Port</Label>
                        <Input
                            id="mail-port"
                            type="number"
                            value={form.data.port}
                            onChange={(e) => form.setData('port', e.target.value)}
                            placeholder="587"
                            className="mt-1.5 rounded-xl"
                        />
                        {form.errors.port && <p className="mt-1 text-sm text-red-500">{form.errors.port}</p>}
                    </div>

                    <div>
                        <Label htmlFor="mail-username">Adresse e-mail / utilisateur</Label>
                        <Input
                            id="mail-username"
                            value={form.data.username}
                            onChange={(e) => form.setData('username', e.target.value)}
                            placeholder="isstm.univ.umg@gmail.com"
                            className="mt-1.5 rounded-xl"
                            autoComplete="off"
                        />
                        {form.errors.username && <p className="mt-1 text-sm text-red-500">{form.errors.username}</p>}
                    </div>

                    <div>
                        <Label htmlFor="mail-password">Mot de passe</Label>
                        <Input
                            id="mail-password"
                            type="password"
                            value={form.data.password}
                            onChange={(e) => form.setData('password', e.target.value)}
                            placeholder={settings.hasPassword ? '••••••••  (laisser vide pour ne pas changer)' : 'Mot de passe ou mot de passe application'}
                            className="mt-1.5 rounded-xl"
                            autoComplete="new-password"
                        />
                        {form.errors.password && <p className="mt-1 text-sm text-red-500">{form.errors.password}</p>}
                    </div>

                    <div>
                        <Label htmlFor="mail-encryption">Chiffrement</Label>
                        <select
                            id="mail-encryption"
                            value={form.data.encryption}
                            onChange={(e) => form.setData('encryption', e.target.value)}
                            className="mt-1.5 w-full rounded-xl border border-admin-border bg-admin-card px-3 py-2 text-sm text-admin-text"
                        >
                            <option value="tls">TLS (recommandé, port 587)</option>
                            <option value="ssl">SSL (port 465)</option>
                            <option value="none">Aucun</option>
                        </select>
                    </div>

                    <div>
                        <Label htmlFor="mail-from-name">Nom de l'expéditeur</Label>
                        <Input
                            id="mail-from-name"
                            value={form.data.fromName}
                            onChange={(e) => form.setData('fromName', e.target.value)}
                            placeholder="ISSTM Mahajanga"
                            className="mt-1.5 rounded-xl"
                        />
                        {form.errors.fromName && <p className="mt-1 text-sm text-red-500">{form.errors.fromName}</p>}
                    </div>

                    <div className="sm:col-span-2">
                        <Label htmlFor="mail-from-address">Adresse d'expédition</Label>
                        <Input
                            id="mail-from-address"
                            type="email"
                            value={form.data.fromAddress}
                            onChange={(e) => form.setData('fromAddress', e.target.value)}
                            placeholder="noreply@isstm.gasycoder.com"
                            className="mt-1.5 rounded-xl"
                        />
                        {form.errors.fromAddress && <p className="mt-1 text-sm text-red-500">{form.errors.fromAddress}</p>}
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    <button
                        type="submit"
                        disabled={form.processing}
                        className="flex items-center gap-2 rounded-full bg-gradient-to-r from-admin-accent to-sky-500 px-6 py-2.5 text-sm font-bold text-white shadow-lg shadow-admin-accent/25 transition hover:brightness-110 disabled:opacity-60"
                    >
                        <Save className="h-4 w-4" aria-hidden="true" />
                        Enregistrer
                    </button>

                    <button
                        type="button"
                        onClick={sendTest}
                        disabled={testing}
                        className="flex items-center gap-2 rounded-full border border-admin-border bg-admin-card px-6 py-2.5 text-sm font-bold text-admin-text shadow-sm transition hover:bg-admin-hover disabled:opacity-60"
                    >
                        <Send className="h-4 w-4" aria-hidden="true" />
                        {testing ? 'Envoi…' : 'Envoyer un e-mail de test'}
                    </button>

                    {dirty && <span className="text-xs font-semibold text-amber-600">Modifications non enregistrées</span>}
                </div>

                <p className="rounded-2xl border border-dashed border-admin-border bg-admin-card px-4 py-3 text-xs text-admin-text-secondary">
                    Le bouton "Envoyer un e-mail de test" envoie un vrai e-mail à ta propre adresse ({' '}
                    <strong>enregistre d'abord</strong> si tu viens de changer la configuration) — pratique pour vérifier que tout fonctionne sans attendre un vrai mot de passe oublié.
                </p>
            </form>
        </AdminLayout>
    );
}
