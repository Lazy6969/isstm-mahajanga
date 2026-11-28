import { router } from '@inertiajs/react';
import { RotateCcw, Trash2 } from 'lucide-react';
import { useQuickEdit } from '../../lib/useQuickEdit';

/**
 * Removes (or brings back) one bibliothèque carousel slide — sets its
 * `bibliotheque_slideN_supprime` flag, the same reversible toggle pattern as
 * AsteriskToggle. Deliberately never clears the slide's image/caption
 * content: hiding it is enough to satisfy "delete this photo", and keeping
 * the values means restoring it needs no re-upload.
 */
export default function SlideDeleteToggle({ contentKey, deleted }) {
    const { canEdit, active } = useQuickEdit();

    if (!canEdit || !active) {
        return null;
    }

    function toggle() {
        if (!deleted && !window.confirm('Supprimer cette photo et sa légende du carrousel ?')) {
            return;
        }

        router.post('/console/content/update', { key: contentKey, value: deleted ? 'false' : 'true' }, { preserveScroll: true, preserveState: true });
    }

    return (
        <button
            type="button"
            onClick={toggle}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-red-500 text-white shadow ring-2 ring-white transition hover:scale-110"
            aria-label={deleted ? 'Restaurer cette photo' : 'Supprimer cette photo'}
            title={deleted ? 'Restaurer cette photo' : 'Supprimer cette photo'}
        >
            {deleted ? <RotateCcw className="h-4 w-4" aria-hidden="true" /> : <Trash2 className="h-4 w-4" aria-hidden="true" />}
        </button>
    );
}
