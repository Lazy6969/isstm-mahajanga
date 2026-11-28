import { useEffect } from 'react';
import { useForm } from '@inertiajs/react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select } from '../ui/select';
import { useTranslations } from '../../lib/useTranslations';

const EMPTY_FORM = { nom: '', prenom: '', email: '', phone: '', password: '', password_confirmation: '', role: '' };

/**
 * Lets a Super Admin (users.create) open an account for any role directly
 * from the Comptes screen — enseignant, étudiant, responsable-materiel,
 * scolarité or another super-admin — without going through the public
 * candidate wizard, which only ever creates an étudiant account.
 */
export default function CreateUserDialog({ open, onClose, roles, roleLabels }) {
    const { t } = useTranslations();
    const form = useForm({ ...EMPTY_FORM });

    useEffect(() => {
        if (open) {
            form.setData({ ...EMPTY_FORM, role: roles[0] ?? '' });
            form.clearErrors();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open]);

    function submit(e) {
        e.preventDefault();
        form.post('/console/users', {
            preserveScroll: true,
            onSuccess: () => onClose(),
        });
    }

    return (
        <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>{t('admin.users.create_title', 'Créer un compte')}</DialogTitle>
                </DialogHeader>
                <form onSubmit={submit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                            <Label htmlFor="create-nom">{t('admin.users.create_nom', 'Nom')}</Label>
                            <Input id="create-nom" value={form.data.nom} onChange={(e) => form.setData('nom', e.target.value)} />
                            {form.errors.nom && <p className="text-sm text-red-500">{form.errors.nom}</p>}
                        </div>
                        <div className="space-y-1">
                            <Label htmlFor="create-prenom">{t('admin.users.create_prenom', 'Prénom')}</Label>
                            <Input id="create-prenom" value={form.data.prenom} onChange={(e) => form.setData('prenom', e.target.value)} />
                            {form.errors.prenom && <p className="text-sm text-red-500">{form.errors.prenom}</p>}
                        </div>
                    </div>

                    <div className="space-y-1">
                        <Label htmlFor="create-email">{t('admin.users.create_email', 'E-mail')}</Label>
                        <Input id="create-email" type="email" autoComplete="off" value={form.data.email} onChange={(e) => form.setData('email', e.target.value)} />
                        {form.errors.email && <p className="text-sm text-red-500">{form.errors.email}</p>}
                    </div>

                    <div className="space-y-1">
                        <Label htmlFor="create-phone">{t('admin.users.create_phone', 'Numéro de téléphone')}</Label>
                        <Input id="create-phone" value={form.data.phone} onChange={(e) => form.setData('phone', e.target.value)} />
                        {form.errors.phone && <p className="text-sm text-red-500">{form.errors.phone}</p>}
                    </div>

                    <div className="space-y-1">
                        <Label htmlFor="create-role">{t('admin.users.create_role', 'Rôle')}</Label>
                        <Select id="create-role" value={form.data.role} onChange={(e) => form.setData('role', e.target.value)} className="w-full">
                            {roles.map((role) => (
                                <option key={role} value={role}>
                                    {roleLabels[role] ?? role}
                                </option>
                            ))}
                        </Select>
                        {form.errors.role && <p className="text-sm text-red-500">{form.errors.role}</p>}
                    </div>

                    <div className="space-y-1">
                        <Label htmlFor="create-password">{t('admin.users.create_password', 'Mot de passe')}</Label>
                        <Input id="create-password" type="password" autoComplete="new-password" value={form.data.password} onChange={(e) => form.setData('password', e.target.value)} />
                        {form.errors.password && <p className="text-sm text-red-500">{form.errors.password}</p>}
                    </div>

                    <div className="space-y-1">
                        <Label htmlFor="create-password-confirmation">{t('admin.users.create_password_confirmation', 'Confirmer le mot de passe')}</Label>
                        <Input
                            id="create-password-confirmation"
                            type="password"
                            autoComplete="new-password"
                            value={form.data.password_confirmation}
                            onChange={(e) => form.setData('password_confirmation', e.target.value)}
                        />
                    </div>

                    <DialogFooter>
                        <Button type="button" onClick={onClose} className="bg-admin-hover text-admin-text hover:bg-admin-hover/70">
                            {t('admin.common.cancel', 'Annuler')}
                        </Button>
                        <Button type="submit" disabled={form.processing} className="bg-admin-text text-admin-bg hover:bg-admin-text/90">
                            {t('admin.users.create_submit', 'Créer le compte')}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
