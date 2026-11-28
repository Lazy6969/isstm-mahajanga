import { useEffect, useMemo, useRef, useState } from 'react';
import { usePage } from '@inertiajs/react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import EditableImage from '../QuickEdit/EditableImage';
import EditableText from '../QuickEdit/EditableText';
import SlideDeleteToggle from './SlideDeleteToggle';
import { useQuickEdit } from '../../lib/useQuickEdit';
import { imageStyleToBackgroundCss } from '../../lib/imageStyle';

const AUTOPLAY_DELAY = 5000;

/**
 * Full-bleed photo carousel with a caption overlay — each slide's photo and
 * caption are independently admin-editable (pencil), like PortalCard's
 * slides on the Vie étudiante page. Only the active slide renders its
 * EditableImage/EditableText pencil, the same restriction PortalCard uses,
 * so a hidden slide never shows an edit control nobody can see land.
 *
 * A slide flagged "supprimé" (SlideDeleteToggle) is skipped entirely for a
 * regular visitor — it gets no dot and autoplay never lands on it — but
 * still shows up, dimmed, for an admin in quick-edit mode so it can be
 * restored without needing to re-upload anything.
 */
export default function PhotoCarousel({ slides }) {
    const { content, contentStyles } = usePage().props;
    const { canEdit, active: quickEditActive } = useQuickEdit();
    const [current, setCurrent] = useState(0);
    const [paused, setPaused] = useState(false);
    const timerRef = useRef(null);

    const isDeleted = (slide) => (content[slide.deleteKey] ?? 'false') === 'true';

    const visibleIndexes = useMemo(
        () => slides.map((_, index) => index).filter((index) => !isDeleted(slides[index]) || (canEdit && quickEditActive)),
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [slides, content, canEdit, quickEditActive],
    );

    useEffect(() => {
        if (current >= visibleIndexes.length) {
            setCurrent(0);
        }
    }, [current, visibleIndexes.length]);

    useEffect(() => {
        if (paused || visibleIndexes.length <= 1) {
            return undefined;
        }

        timerRef.current = setInterval(() => setCurrent((c) => (c + 1) % visibleIndexes.length), AUTOPLAY_DELAY);

        return () => clearInterval(timerRef.current);
    }, [paused, visibleIndexes.length]);

    function goTo(position) {
        setCurrent((position + visibleIndexes.length) % visibleIndexes.length);
    }

    if (visibleIndexes.length === 0) {
        return null;
    }

    return (
        <section
            className="relative h-80 overflow-hidden rounded-3xl shadow-lg sm:h-[460px]"
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
        >
            {visibleIndexes.map((slideIndex, position) => {
                const slide = slides[slideIndex];
                const image = content[slide.imageKey] ?? slide.defaultImage;
                const active = position === current;
                const deleted = isDeleted(slide);

                return (
                    <div
                        key={slide.imageKey}
                        className={`absolute inset-0 bg-cover bg-center transition-opacity duration-1000 ${active ? 'opacity-100' : 'pointer-events-none opacity-0'} ${deleted ? 'opacity-60' : ''}`}
                        style={{
                            backgroundImage: `url('/${image}')`,
                            ...imageStyleToBackgroundCss(contentStyles?.[slide.imageKey], { includeOpacity: false }),
                        }}
                        aria-hidden={!active}
                    >
                        {active && (
                            <div className="absolute top-3 right-3 z-20 flex gap-2">
                                <EditableImage contentKey={slide.imageKey} value={image} className="" />
                                <SlideDeleteToggle contentKey={slide.deleteKey} deleted={deleted} />
                            </div>
                        )}

                        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/15 to-transparent" aria-hidden="true" />

                        {active && deleted && (
                            <div className="absolute top-3 left-3 z-20 rounded-full bg-red-500 px-3 py-1 text-xs font-bold text-white">
                                Photo supprimée — visible uniquement en mode édition
                            </div>
                        )}

                        {active && (
                            <div className="absolute inset-x-0 bottom-0 px-5 pt-10 pb-14 sm:px-8 sm:pb-16">
                                <EditableText as="p" contentKey={slide.captionKey} className="max-w-2xl text-sm font-medium text-white sm:text-base">
                                    {content[slide.captionKey] ?? slide.defaultCaption}
                                </EditableText>
                            </div>
                        )}
                    </div>
                );
            })}

            {visibleIndexes.length > 1 && (
                <>
                    <button
                        type="button"
                        onClick={() => goTo(current - 1)}
                        aria-label="Photo précédente"
                        className="absolute top-1/2 left-3 z-20 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-sm transition hover:bg-white/35"
                    >
                        <ChevronLeft className="h-5 w-5" aria-hidden="true" />
                    </button>
                    <button
                        type="button"
                        onClick={() => goTo(current + 1)}
                        aria-label="Photo suivante"
                        className="absolute top-1/2 right-3 z-20 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-sm transition hover:bg-white/35"
                    >
                        <ChevronRight className="h-5 w-5" aria-hidden="true" />
                    </button>

                    <div className="absolute bottom-5 left-1/2 z-20 flex -translate-x-1/2 gap-1.5">
                        {visibleIndexes.map((slideIndex, position) => (
                            <button
                                key={slides[slideIndex].imageKey}
                                type="button"
                                onClick={() => goTo(position)}
                                aria-label={`Photo ${position + 1}`}
                                className={`h-1.5 rounded-full transition-all ${position === current ? 'w-7 bg-isstm-gold' : 'w-1.5 bg-white/50'}`}
                            />
                        ))}
                    </div>
                </>
            )}
        </section>
    );
}
