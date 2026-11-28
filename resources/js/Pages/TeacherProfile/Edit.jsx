import { useState } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft, Camera, Save } from 'lucide-react';
import AppLayout from '../../Components/Layout/AppLayout';
import { Card } from '../../Components/ui/card';
import { Label } from '../../Components/ui/label';
import { Textarea } from '../../Components/ui/textarea';
import { useTranslations } from '../../lib/useTranslations';

const LANGUAGES = [
    ['fr', 'Français'],
    ['en', 'Anglais'],
    ['mg', 'Malagasy'],
];

/**
 * Self-service version of Admin\TeacherController::update() — same fields
 * except the structural ones (catégorie, département, ordre) that stay
 * admin-only. See TeacherProfileController for how the account is matched
 * to its directory card (by e-mail, there is no `teachers.user_id`).
 */
export default function Edit({ teacher }) {
    const { t } = useTranslations();
    const [preview, setPreview] = useState(null);
    const form = useForm({
        specialty_fr: teacher?.specialty_fr ?? '',
        specialty_en: teacher?.specialty_en ?? '',
        specialty_mg: teacher?.specialty_mg ?? '',
        description_fr: teacher?.description_fr ?? '',
        description_en: teacher?.description_en ?? '',
        description_mg: teacher?.description_mg ?? '',
        photo: null,
    });

    function onPhotoChange(e) {
        const file = e.target.files?.[0] ?? null;
        form.setData('photo', file);
        setPreview(file ? URL.createObjectURL(file) : null);
    }

    function submit(e) {
        e.preventDefault();
        form.post('/ma-fiche-enseignant', { forceFormData: true, preserveScroll: true });
    }

    return (
        <AppLayout title={t('teacher_profile.titre', 'Ma fiche enseignant')}>
            <Head title={t('teacher_profile.titre', 'Ma fiche enseignant')} />

            <div className="mx-auto max-w-2xl">
                <Link href="/parametres" className="mb-4 flex items-center gap-1.5 text-sm font-medium text-isstm-navy hover:underline dark:text-white">
                    <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                    {t('teacher_profile.retour', 'Retour aux paramètres')}
                </Link>

                {!teacher ? (
                    <Card className="p-6 text-sm text-slate-600 dark:text-slate-300">
                        <p className="font-semibold text-isstm-navy dark:text-white">
                            {t('teacher_profile.aucune_fiche_titre', "Aucune fiche publique n'est encore liée à votre compte")}
                        </p>
                        <p className="mt-2">
                            {t(
                                'teacher_profile.aucune_fiche_texte',
                                "Demandez à l'administration de renseigner votre adresse e-mail de connexion sur votre fiche de la page Enseignants : c'est ce qui relie votre compte à cette fiche.",
                            )}
                        </p>
                    </Card>
                ) : (
                    <form onSubmit={submit} className="space-y-6">
                        <Card className="flex items-center gap-4 p-5">
                            <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-full border border-slate-200 dark:border-slate-700">
                                <img
                                    src={preview ?? (teacher.photo_path ? `/${teacher.photo_path}` : '/images/logo-isstm.webp')}
                                    alt=""
                                    className="h-full w-full object-cover"
                                />
                                <label className="absolute inset-0 flex cursor-pointer items-center justify-center bg-black/50 text-white opacity-0 transition hover:opacity-100">
                                    <Camera className="h-5 w-5" aria-hidden="true" />
                                    <input type="file" accept="image/jpeg,image/jpg,image/png,image/webp" onChange={onPhotoChange} className="sr-only" />
                                </label>
                            </div>
                            <div className="min-w-0">
                                <p className="truncate font-semibold text-isstm-navy dark:text-white">{teacher.name}</p>
                                <p className="text-sm text-slate-400">{t('teacher_profile.photo_hint', 'Cliquez sur la photo pour la changer')}</p>
                                {form.errors.photo && <p className="mt-1 text-sm text-red-500">{form.errors.photo}</p>}
                            </div>
                        </Card>

                        {LANGUAGES.map(([code, label]) => (
                            <Card key={code} className="space-y-4 p-5">
                                <h2 className="text-sm font-semibold text-isstm-navy dark:text-white">{label}</h2>
                                <div>
                                    <Label htmlFor={`specialty_${code}`}>{t('teacher_profile.specialite', 'Spécialité')}</Label>
                                    <input
                                        id={`specialty_${code}`}
                                        value={form.data[`specialty_${code}`]}
                                        onChange={(e) => form.setData(`specialty_${code}`, e.target.value)}
                                        className="mt-1.5 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-isstm-navy dark:border-slate-600 dark:bg-slate-800 dark:text-white"
                                    />
                                    {form.errors[`specialty_${code}`] && <p className="mt-1 text-sm text-red-500">{form.errors[`specialty_${code}`]}</p>}
                                </div>
                                <div>
                                    <Label htmlFor={`description_${code}`}>{t('teacher_profile.bio', 'Présentation')}</Label>
                                    <Textarea
                                        id={`description_${code}`}
                                        rows={4}
                                        value={form.data[`description_${code}`]}
                                        onChange={(e) => form.setData(`description_${code}`, e.target.value)}
                                        className="mt-1.5"
                                    />
                                    {form.errors[`description_${code}`] && <p className="mt-1 text-sm text-red-500">{form.errors[`description_${code}`]}</p>}
                                </div>
                            </Card>
                        ))}

                        <button
                            type="submit"
                            disabled={form.processing}
                            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-isstm-navy p-4 text-sm font-semibold text-white transition hover:brightness-110 disabled:opacity-60"
                        >
                            <Save className="h-4 w-4" aria-hidden="true" />
                            {t('teacher_profile.enregistrer', 'Enregistrer ma fiche')}
                        </button>
                    </form>
                )}
            </div>
        </AppLayout>
    );
}
