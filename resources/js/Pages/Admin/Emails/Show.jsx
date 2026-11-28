import { Link, router, useForm } from '@inertiajs/react';
import { ArrowLeft, Reply, Send, Trash2 } from 'lucide-react';
import AdminLayout from '../../../Components/Layout/AdminLayout';
import { Button } from '../../../Components/ui/button';
import { Label } from '../../../Components/ui/label';
import { Input } from '../../../Components/ui/input';
import { Textarea } from '../../../Components/ui/textarea';
import { cn } from '../../../lib/utils';
import { useConfirm } from '../../../lib/useConfirm';

const STATUS_LABELS = {
    sent: ['Envoyé', 'text-emerald-600'],
    logged: ['Simulé (mode log)', 'text-amber-600'],
    failed: ['Échec', 'text-rose-600'],
};

const QUICK_REPLIES = [
    ['Merci', "Bonjour,\n\nMerci pour votre message. Nous avons bien reçu votre demande et nous vous répondons très bientôt.\n\nCordialement,\nL'équipe ISSTM Mahajanga"],
    ['Reçu', 'Bonjour,\n\nNous confirmons la bonne réception de votre demande. Elle est en cours de traitement.\n\nCordialement,\nL\'équipe ISSTM Mahajanga'],
    ['Plus d\'infos', "Bonjour,\n\nPourriez-vous nous préciser votre demande afin que nous puissions vous répondre au mieux ?\n\nCordialement,\nL'équipe ISSTM Mahajanga"],
];

function initials(name) {
    return (name || '?')
        .split(' ')
        .filter(Boolean)
        .map((part) => part[0])
        .slice(0, 2)
        .join('')
        .toUpperCase();
}

export default function EmailShow({ mail, replies, mailer }) {
    const confirmAction = useConfirm();
    const form = useForm({ subject: `Re : ${mail.objet}`, body: '' });

    function submit(e) {
        e.preventDefault();
        form.post(`/console/emails/${mail.id}/repondre`, { preserveScroll: true, onSuccess: () => form.setData('body', '') });
    }

    async function destroy() {
        if (
            !(await confirmAction({
                message: `Supprimer définitivement le message de « ${mail.nom} ${mail.prenoms} » ?`,
                tone: 'danger',
                title: 'Action irréversible',
                confirmLabel: 'Supprimer',
            }))
        ) {
            return;
        }
        router.delete(`/console/emails/${mail.id}`);
    }

    return (
        <AdminLayout
            title="E-mails"
            actions={
                <Link href="/console/emails" className="flex items-center gap-1.5 text-sm font-medium text-admin-text-secondary hover:text-admin-text">
                    <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                    Retour
                </Link>
            }
        >
            {!mailer.live && (
                <p className="mb-5 rounded-2xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-xs text-amber-800 dark:text-amber-400">
                    Les e-mails ne sont pas envoyés réellement (mode « log ») — configurez l'envoi dans Paramètres → E-mail.
                </p>
            )}

            <div className="mx-auto max-w-3xl space-y-4">
                <article className="rounded-2xl border border-admin-border bg-admin-card p-5 shadow-sm">
                    <div className="flex items-start gap-3">
                        <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-admin-accent to-sky-500 text-sm font-bold text-white">
                            {initials(`${mail.prenoms} ${mail.nom}`)}
                        </span>
                        <div className="min-w-0 flex-1">
                            <p className="font-bold text-admin-text">
                                {mail.prenoms} {mail.nom}
                            </p>
                            <p className="text-xs text-admin-muted">
                                <a href={`mailto:${mail.email}`} className="text-admin-accent hover:underline">
                                    {mail.email}
                                </a>
                                {mail.telephone && <> · {mail.telephone}</>} · {mail.date}
                            </p>
                        </div>
                        <button type="button" aria-label="Supprimer" title="Supprimer" onClick={destroy} className="rounded-lg p-2 text-admin-muted transition hover:bg-rose-500/10 hover:text-rose-500">
                            <Trash2 className="h-4 w-4" aria-hidden="true" />
                        </button>
                    </div>
                    <p className="mt-3 text-sm font-semibold text-admin-text">{mail.objet}</p>
                    <p className="mt-2 whitespace-pre-line break-words text-sm leading-relaxed text-admin-text-secondary">{mail.message}</p>
                </article>

                {replies.map((r) => {
                    const [label, cls] = STATUS_LABELS[r.status] ?? STATUS_LABELS.sent;

                    return (
                        <article key={r.id} className="ml-6 rounded-2xl border border-admin-accent/30 bg-admin-card p-5 shadow-sm sm:ml-12">
                            <div className="flex items-center justify-between gap-3 text-xs">
                                <span className="flex items-center gap-1.5 font-semibold text-admin-accent">
                                    <Reply className="h-3.5 w-3.5" aria-hidden="true" />
                                    Votre réponse · {r.at}
                                </span>
                                <span className={cls}>{label}</span>
                            </div>
                            <p className="mt-2 text-sm font-semibold text-admin-text">{r.subject}</p>
                            <p className="mt-1 whitespace-pre-line break-words text-sm text-admin-text-secondary">{r.body}</p>
                            {r.error && <p className="mt-2 text-xs text-rose-500">{r.error}</p>}
                        </article>
                    );
                })}

                <form id="reponse" onSubmit={submit} className="space-y-4 rounded-2xl border border-admin-border bg-admin-card p-5 shadow-sm">
                    <h2 className="flex items-center gap-2 font-bold text-admin-text">
                        <Reply className="h-4 w-4 text-admin-accent" aria-hidden="true" />
                        Répondre à {mail.email}
                    </h2>

                    <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs text-admin-muted">Réponses rapides :</span>
                        {QUICK_REPLIES.map(([label, text]) => (
                            <button
                                key={label}
                                type="button"
                                onClick={() => form.setData('body', text)}
                                className="rounded-full border border-admin-border px-3 py-1 text-xs font-semibold text-admin-text-secondary transition hover:border-admin-accent/50 hover:text-admin-text"
                            >
                                {label}
                            </button>
                        ))}
                    </div>

                    <div>
                        <Label htmlFor="reply-subject">Objet</Label>
                        <Input id="reply-subject" value={form.data.subject} onChange={(e) => form.setData('subject', e.target.value)} className="mt-1.5" />
                        {form.errors.subject && <p className="mt-1 text-sm text-red-500">{form.errors.subject}</p>}
                    </div>
                    <div>
                        <Label htmlFor="reply-body">Message</Label>
                        <Textarea
                            id="reply-body"
                            rows={7}
                            value={form.data.body}
                            onChange={(e) => form.setData('body', e.target.value)}
                            placeholder="Votre réponse…"
                            className="mt-1.5"
                        />
                        {form.errors.body && <p className="mt-1 text-sm text-red-500">{form.errors.body}</p>}
                    </div>

                    <div className="flex justify-end">
                        <Button type="submit" disabled={form.processing || form.data.body.trim().length < 2} className="flex items-center gap-2 bg-admin-text text-admin-bg hover:bg-admin-text/90">
                            <Send className="h-4 w-4" aria-hidden="true" />
                            {form.processing ? 'Envoi…' : 'Envoyer la réponse'}
                        </Button>
                    </div>
                </form>
            </div>
        </AdminLayout>
    );
}
