import { useMemo, useState } from 'react';
import { Link, router, useForm } from '@inertiajs/react';
import { CheckCheck, Inbox, Mail, MailOpen, MailWarning, PenSquare, Reply, Search, Send, Settings, Trash2 } from 'lucide-react';
import AdminLayout from '../../../Components/Layout/AdminLayout';
import ViewToggle from '../../../Components/Admin/ViewToggle';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../../Components/ui/dialog';
import { Button } from '../../../Components/ui/button';
import { Input } from '../../../Components/ui/input';
import { Label } from '../../../Components/ui/label';
import { Textarea } from '../../../Components/ui/textarea';
import { cn } from '../../../lib/utils';
import { useConfirm } from '../../../lib/useConfirm';

const STATUS_LABELS = {
    sent: ['Envoyé', 'bg-emerald-500/10 text-emerald-600 ring-emerald-500/25'],
    logged: ['Simulé (mode log)', 'bg-amber-500/10 text-amber-600 ring-amber-500/25'],
    failed: ['Échec', 'bg-rose-500/10 text-rose-600 ring-rose-500/25'],
};

function initials(name) {
    return (name || '?')
        .split(' ')
        .filter(Boolean)
        .map((part) => part[0])
        .slice(0, 2)
        .join('')
        .toUpperCase();
}

function MailerBanner({ mailer }) {
    if (mailer.live) {
        return (
            <div className="mb-5 flex items-center gap-3 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-700 dark:text-emerald-400">
                <Send className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
                Envoi actif · {mailer.driver} · expéditeur : {mailer.from}
            </div>
        );
    }

    return (
        <div role="alert" className="mb-5 flex gap-3 rounded-2xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-800 dark:text-amber-400">
            <MailWarning className="mt-0.5 h-4 w-4 flex-shrink-0" aria-hidden="true" />
            <div>
                <p className="font-semibold">Les e-mails ne sont pas envoyés réellement (mode « log »).</p>
                <p className="mt-1 text-amber-700/80 dark:text-amber-400/80">
                    Configurez l'envoi dans{' '}
                    <Link href="/console/settings/mail" className="underline">
                        Paramètres → E-mail
                    </Link>
                    .
                </p>
            </div>
        </div>
    );
}

function ComposeDialog({ open, onClose }) {
    const form = useForm({ to_email: '', subject: '', body: '' });

    function submit(e) {
        e.preventDefault();
        form.post('/console/emails/envoyer', {
            preserveScroll: true,
            onSuccess: () => {
                form.reset();
                onClose();
            },
        });
    }

    return (
        <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
            <DialogContent className="max-w-lg">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <PenSquare className="h-4 w-4" aria-hidden="true" />
                        Nouvel e-mail
                    </DialogTitle>
                </DialogHeader>
                <form onSubmit={submit} className="space-y-4">
                    <div>
                        <Label htmlFor="compose-to">Destinataire</Label>
                        <Input id="compose-to" type="email" value={form.data.to_email} onChange={(e) => form.setData('to_email', e.target.value)} className="mt-1.5" autoComplete="off" />
                        {form.errors.to_email && <p className="mt-1 text-sm text-red-500">{form.errors.to_email}</p>}
                    </div>
                    <div>
                        <Label htmlFor="compose-subject">Objet</Label>
                        <Input id="compose-subject" value={form.data.subject} onChange={(e) => form.setData('subject', e.target.value)} className="mt-1.5" />
                        {form.errors.subject && <p className="mt-1 text-sm text-red-500">{form.errors.subject}</p>}
                    </div>
                    <div>
                        <Label htmlFor="compose-body">Message</Label>
                        <Textarea id="compose-body" rows={7} value={form.data.body} onChange={(e) => form.setData('body', e.target.value)} className="mt-1.5" />
                        {form.errors.body && <p className="mt-1 text-sm text-red-500">{form.errors.body}</p>}
                    </div>
                    <DialogFooter>
                        <Button type="button" onClick={onClose} className="bg-admin-hover text-admin-text hover:bg-admin-hover/70">
                            Annuler
                        </Button>
                        <Button type="submit" disabled={form.processing} className="flex items-center gap-2 bg-admin-text text-admin-bg hover:bg-admin-text/90">
                            <Send className="h-4 w-4" aria-hidden="true" />
                            {form.processing ? 'Envoi…' : 'Envoyer'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

function ReceivedActions({ message, onToggleRead, onDelete }) {
    return (
        <>
            <Link href={`/console/emails/${message.id}#reponse`} aria-label="Répondre" title="Répondre" className="rounded-lg p-2 text-admin-accent transition hover:bg-admin-hover">
                <Reply className="h-4 w-4" aria-hidden="true" />
            </Link>
            <button
                type="button"
                aria-label={message.read ? 'Marquer comme non lu' : 'Marquer comme lu'}
                title={message.read ? 'Marquer comme non lu' : 'Marquer comme lu'}
                onClick={() => onToggleRead(message)}
                className="rounded-lg p-2 text-admin-text-secondary transition hover:bg-admin-hover"
            >
                {message.read ? <MailOpen className="h-4 w-4" aria-hidden="true" /> : <Mail className="h-4 w-4" aria-hidden="true" />}
            </button>
            <button
                type="button"
                aria-label="Supprimer"
                title="Supprimer"
                onClick={() => onDelete(message)}
                className="rounded-lg p-2 text-admin-muted transition hover:bg-rose-500/10 hover:text-rose-500"
            >
                <Trash2 className="h-4 w-4" aria-hidden="true" />
            </button>
        </>
    );
}

function ReceivedCard({ message, onToggleRead, onDelete }) {
    return (
        <li
            className={cn(
                'group relative flex flex-col overflow-hidden rounded-2xl border bg-admin-card p-4 pt-5 shadow-sm transition duration-300 hover:-translate-y-0.5 hover:border-admin-accent/40 hover:shadow-lg',
                message.read ? 'border-admin-border' : 'border-admin-accent/40',
            )}
        >
            <span className={cn('absolute inset-x-0 top-0 h-1', message.read ? 'bg-admin-border' : 'bg-gradient-to-r from-admin-accent to-sky-500')} aria-hidden="true" />
            <div className="flex items-start gap-3">
                <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-admin-accent to-sky-500 text-xs font-bold text-white">
                    {initials(`${message.prenoms} ${message.nom}`)}
                </span>
                <div className="min-w-0 flex-1">
                    <p className={cn('truncate text-sm', message.read ? 'font-medium text-admin-text-secondary' : 'font-bold text-admin-text')}>
                        {message.prenoms} {message.nom}
                    </p>
                    <p className="truncate text-xs text-admin-muted">{message.email}</p>
                </div>
                {message.replied && (
                    <span
                        title="Répondu"
                        className="flex flex-shrink-0 items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] font-semibold text-emerald-600 ring-1 ring-inset ring-emerald-500/25"
                    >
                        <CheckCheck className="h-3 w-3" aria-hidden="true" />
                    </span>
                )}
            </div>
            <Link href={`/console/emails/${message.id}`} className="mt-3 block min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-admin-text">{message.objet}</p>
                <p className="mt-1 line-clamp-2 text-sm text-admin-text-secondary">{message.excerpt}</p>
            </Link>
            <div className="mt-auto flex items-center justify-between border-t border-admin-border pt-2.5">
                <span className="text-[11px] text-admin-muted">{message.at}</span>
                <div className="flex items-center gap-0.5">
                    <ReceivedActions message={message} onToggleRead={onToggleRead} onDelete={onDelete} />
                </div>
            </div>
        </li>
    );
}

function ReceivedRow({ message, onToggleRead, onDelete }) {
    return (
        <li
            className={cn(
                'flex gap-3 rounded-2xl border bg-admin-card p-4 shadow-sm transition hover:border-admin-accent/40',
                message.read ? 'border-admin-border' : 'border-admin-accent/40',
            )}
        >
            <span className={cn('mt-1.5 h-2.5 w-2.5 flex-shrink-0 rounded-full', message.read ? 'bg-admin-border' : 'bg-admin-accent')} aria-hidden="true" />
            <Link href={`/console/emails/${message.id}`} className="min-w-0 flex-1">
                <p className="flex flex-wrap items-center gap-x-2 text-sm">
                    <span className={message.read ? 'font-medium text-admin-text-secondary' : 'font-bold text-admin-text'}>
                        {message.prenoms} {message.nom}
                    </span>
                    <span className="text-xs text-admin-muted">{message.email}</span>
                    {message.replied && (
                        <span className="flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] font-semibold text-emerald-600 ring-1 ring-inset ring-emerald-500/25">
                            <CheckCheck className="h-3 w-3" aria-hidden="true" />
                            Répondu
                        </span>
                    )}
                </p>
                <p className="mt-0.5 text-sm font-semibold text-admin-text">{message.objet}</p>
                <p className="mt-0.5 line-clamp-1 text-sm text-admin-text-secondary">{message.excerpt}</p>
                <p className="mt-1 text-xs text-admin-muted">{message.at}</p>
            </Link>
            <div className="flex flex-shrink-0 flex-col gap-0.5">
                <ReceivedActions message={message} onToggleRead={onToggleRead} onDelete={onDelete} />
            </div>
        </li>
    );
}

function SentCard({ mail, onDelete }) {
    const [label, cls] = STATUS_LABELS[mail.status] ?? STATUS_LABELS.sent;

    return (
        <li className="group relative flex flex-col overflow-hidden rounded-2xl border border-admin-border bg-admin-card p-4 pt-5 shadow-sm transition duration-300 hover:-translate-y-0.5 hover:border-admin-accent/40 hover:shadow-lg">
            <span className={cn('absolute inset-x-0 top-0 h-1', mail.status === 'failed' ? 'bg-rose-500' : mail.status === 'logged' ? 'bg-amber-500' : 'bg-emerald-500')} aria-hidden="true" />
            <div className="flex items-start justify-between gap-2">
                <p className="min-w-0 truncate text-sm font-semibold text-admin-text">{mail.subject}</p>
                <button
                    type="button"
                    aria-label="Supprimer"
                    title="Supprimer"
                    onClick={() => onDelete(mail)}
                    className="flex-shrink-0 rounded-lg p-1.5 text-admin-muted transition hover:bg-rose-500/10 hover:text-rose-500"
                >
                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                </button>
            </div>
            <p className="mt-1 truncate text-xs text-admin-muted">→ {mail.to_email}</p>
            <p className="mt-2 line-clamp-3 whitespace-pre-line text-sm text-admin-text-secondary">{mail.body}</p>
            {mail.error && <p className="mt-1 truncate text-xs text-rose-500">{mail.error}</p>}
            <div className="mt-auto flex items-center justify-between border-t border-admin-border pt-2.5">
                <span className="text-[11px] text-admin-muted">{mail.at}</span>
                <span className={cn('rounded-full px-2 py-0.5 text-[11px] font-bold ring-1 ring-inset', cls)}>{label}</span>
            </div>
        </li>
    );
}

function SentRow({ mail, onDelete }) {
    const [label, cls] = STATUS_LABELS[mail.status] ?? STATUS_LABELS.sent;

    return (
        <li className="flex gap-3 rounded-2xl border border-admin-border bg-admin-card p-4 shadow-sm">
            <div className="min-w-0 flex-1">
                <p className="flex flex-wrap items-center gap-2 text-sm">
                    <span className="font-semibold text-admin-text">{mail.subject}</span>
                    <span className={cn('rounded-full px-2 py-0.5 text-[11px] font-bold ring-1 ring-inset', cls)}>{label}</span>
                </p>
                <p className="text-xs text-admin-muted">
                    → {mail.to_email} · {mail.at}
                </p>
                <p className="mt-1 line-clamp-2 whitespace-pre-line text-sm text-admin-text-secondary">{mail.body}</p>
                {mail.error && <p className="mt-1 text-xs text-rose-500">{mail.error}</p>}
            </div>
            <button
                type="button"
                aria-label="Supprimer"
                title="Supprimer"
                onClick={() => onDelete(mail)}
                className="self-start rounded-lg p-2 text-admin-muted transition hover:bg-rose-500/10 hover:text-rose-500"
            >
                <Trash2 className="h-4 w-4" aria-hidden="true" />
            </button>
        </li>
    );
}

export default function EmailsIndex({ received, sent, counts, mailer }) {
    const confirmAction = useConfirm();
    const [tab, setTab] = useState('received');
    const [search, setSearch] = useState('');
    const [view, setView] = useState('list');
    const [composeOpen, setComposeOpen] = useState(false);

    const filteredReceived = useMemo(() => {
        const term = search.trim().toLowerCase();
        if (!term) return received;

        return received.filter((m) => `${m.nom} ${m.prenoms} ${m.email} ${m.objet} ${m.excerpt}`.toLowerCase().includes(term));
    }, [received, search]);

    const filteredSent = useMemo(() => {
        const term = search.trim().toLowerCase();
        if (!term) return sent;

        return sent.filter((m) => `${m.to_email} ${m.subject} ${m.body}`.toLowerCase().includes(term));
    }, [sent, search]);

    function toggleRead(contact) {
        router.patch(`/console/emails/${contact.id}`, {}, { preserveScroll: true });
    }

    async function destroyReceived(contact) {
        if (
            !(await confirmAction({
                message: `Supprimer définitivement le message de « ${contact.nom} ${contact.prenoms} » ?`,
                tone: 'danger',
                title: 'Action irréversible',
                confirmLabel: 'Supprimer',
            }))
        ) {
            return;
        }
        router.delete(`/console/emails/${contact.id}`, { preserveScroll: true });
    }

    async function destroySent(mail) {
        if (
            !(await confirmAction({
                message: `Supprimer définitivement cet e-mail envoyé à « ${mail.to_email} » ?`,
                tone: 'danger',
                title: 'Action irréversible',
                confirmLabel: 'Supprimer',
            }))
        ) {
            return;
        }
        router.delete(`/console/emails/envoyes/${mail.id}`, { preserveScroll: true });
    }

    const tabCls = (active) =>
        cn(
            'flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm font-bold transition',
            active ? 'border-transparent bg-gradient-to-r from-admin-accent to-sky-500 text-white shadow-md shadow-admin-accent/25' : 'border-admin-border text-admin-text-secondary hover:bg-admin-hover',
        );

    const listClass = view === 'grid' ? 'grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3' : 'space-y-2.5';

    return (
        <AdminLayout title="E-mails">
            <div className="-mt-2 mb-5 flex flex-wrap items-center justify-between gap-3">
                <div className="relative min-w-60 flex-1 sm:max-w-sm">
                    <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-admin-muted" aria-hidden="true" />
                    <input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Rechercher…"
                        className="h-10 w-full rounded-full border border-admin-border bg-admin-card pl-10 pr-4 text-sm text-admin-text outline-none transition focus:border-admin-accent/60 focus:ring-4 focus:ring-admin-accent/10"
                    />
                </div>
                <div className="flex items-center gap-3">
                    <ViewToggle view={view} onChange={setView} />
                    <Link
                        href="/console/settings/mail"
                        aria-label="Paramètres e-mail"
                        title="Paramètres e-mail"
                        className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full border border-admin-border bg-admin-card text-admin-text-secondary shadow-sm transition hover:bg-admin-hover"
                    >
                        <Settings className="h-4 w-4" aria-hidden="true" />
                    </Link>
                    <button
                        type="button"
                        onClick={() => setComposeOpen(true)}
                        className="flex items-center gap-2 rounded-full bg-gradient-to-r from-admin-accent to-sky-500 px-5 py-2.5 text-sm font-bold text-white shadow-md shadow-admin-accent/25 transition hover:brightness-110"
                    >
                        <PenSquare className="h-4 w-4" aria-hidden="true" />
                        Nouvel e-mail
                    </button>
                </div>
            </div>

            <MailerBanner mailer={mailer} />

            <div className="mb-5 flex flex-wrap gap-2">
                <button type="button" onClick={() => setTab('received')} className={tabCls(tab === 'received')}>
                    <Inbox className="h-3.5 w-3.5" aria-hidden="true" />
                    Reçus ({counts.received})
                    {counts.unread > 0 && <span className="rounded-full bg-white/25 px-1.5 text-[11px]">{counts.unread}</span>}
                </button>
                <button type="button" onClick={() => setTab('sent')} className={tabCls(tab === 'sent')}>
                    <Send className="h-3.5 w-3.5" aria-hidden="true" />
                    Envoyés ({counts.sent})
                </button>
            </div>

            {tab === 'received' ? (
                filteredReceived.length === 0 ? (
                    <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-admin-border bg-admin-card px-6 py-14 text-center">
                        <Inbox className="h-9 w-9 text-admin-accent" aria-hidden="true" />
                        <p className="text-sm text-admin-muted">Aucun message.</p>
                    </div>
                ) : (
                    <ul className={listClass}>
                        {filteredReceived.map((m) =>
                            view === 'grid' ? (
                                <ReceivedCard key={m.id} message={m} onToggleRead={toggleRead} onDelete={destroyReceived} />
                            ) : (
                                <ReceivedRow key={m.id} message={m} onToggleRead={toggleRead} onDelete={destroyReceived} />
                            ),
                        )}
                    </ul>
                )
            ) : filteredSent.length === 0 ? (
                <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-admin-border bg-admin-card px-6 py-14 text-center">
                    <Send className="h-9 w-9 text-admin-accent" aria-hidden="true" />
                    <p className="text-sm text-admin-muted">Aucun e-mail envoyé.</p>
                </div>
            ) : (
                <ul className={listClass}>
                    {filteredSent.map((m) => (view === 'grid' ? <SentCard key={m.id} mail={m} onDelete={destroySent} /> : <SentRow key={m.id} mail={m} onDelete={destroySent} />))}
                </ul>
            )}

            <ComposeDialog open={composeOpen} onClose={() => setComposeOpen(false)} />
        </AdminLayout>
    );
}
