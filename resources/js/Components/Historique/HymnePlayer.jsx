import { usePage } from '@inertiajs/react';
import { Download, Lock, Music, Pause, Play, Repeat, ScrollText, Volume1, Volume2, VolumeX, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import EditableText from '../QuickEdit/EditableText';
import LetterRevealText from '../Rejoindre/LetterRevealText';
import { useTranslations } from '../../lib/useTranslations';

const COVER_PATH = '/images/hymne-isstm-cover.jpg';
const AUDIO_PATH = '/audio/hymne-isstm.mp3';
const SEEK_STEP_SECONDS = 5;

function formatTime(seconds) {
    if (!Number.isFinite(seconds) || seconds < 0) return '0:00';
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);

    return `${m}:${s.toString().padStart(2, '0')}`;
}

/**
 * The ISSTM anthem, at the very bottom of the Historique page (below the
 * LMD training offer). Listening, downloading and the lyrics all require
 * being signed in — a guest only sees the cover and a short note instead of
 * controls, no "Paroles" button and no lyrics panel. The small equalizer
 * bars over the cover only bounce while the audio is actually playing (see
 * .hymne-equalizer in app.css).
 */
export default function HymnePlayer() {
    const { t } = useTranslations();
    const { content, auth } = usePage().props;
    const audioRef = useRef(null);
    const [playing, setPlaying] = useState(false);
    const [loop, setLoop] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [showLyrics, setShowLyrics] = useState(false);
    const [volume, setVolume] = useState(1);
    const [muted, setMuted] = useState(false);
    const lastVolumeRef = useRef(1);

    const canListen = !!auth?.user;
    const progress = duration ? (currentTime / duration) * 100 : 0;
    const effectiveVolume = muted ? 0 : volume;
    const VolumeIcon = effectiveVolume === 0 ? VolumeX : effectiveVolume < 0.5 ? Volume1 : Volume2;

    useEffect(() => {
        if (audioRef.current) {
            audioRef.current.volume = muted ? 0 : volume;
        }
    }, [volume, muted]);

    function togglePlay() {
        const el = audioRef.current;
        if (!el) return;

        if (playing) {
            el.pause();
        } else {
            el.play().catch(() => {});
        }
    }

    function toggleLoop() {
        setLoop((value) => !value);
    }

    function handleVolumeChange(e) {
        const value = Number(e.target.value);
        setVolume(value);
        setMuted(value === 0);
        if (value > 0) {
            lastVolumeRef.current = value;
        }
    }

    function toggleMute() {
        setMuted((value) => {
            if (value && volume === 0) {
                setVolume(lastVolumeRef.current || 1);
            }

            return !value;
        });
    }

    function seekToRatio(ratio) {
        const el = audioRef.current;
        if (!el || !duration) return;
        el.currentTime = Math.min(duration, Math.max(0, ratio * duration));
    }

    function handleSeekClick(e) {
        const rect = e.currentTarget.getBoundingClientRect();
        seekToRatio((e.clientX - rect.left) / rect.width);
    }

    function handleSeekKeyDown(e) {
        const el = audioRef.current;
        if (!el) return;

        if (e.key === 'ArrowRight') {
            el.currentTime = Math.min(duration, el.currentTime + SEEK_STEP_SECONDS);
        } else if (e.key === 'ArrowLeft') {
            el.currentTime = Math.max(0, el.currentTime - SEEK_STEP_SECONDS);
        }
    }

    return (
        <section className="relative overflow-hidden rounded-2xl bg-isstm-navy shadow-lg ring-1 ring-black/10 sm:rounded-3xl dark:bg-black dark:ring-white/10">
            <div
                className="absolute inset-0 scale-110 bg-cover bg-center opacity-25 blur-2xl"
                style={{ backgroundImage: `url(${COVER_PATH})` }}
                aria-hidden="true"
            />

            {canListen && (
                <button
                    type="button"
                    onClick={() => setShowLyrics((value) => !value)}
                    aria-pressed={showLyrics}
                    aria-label={showLyrics ? t('historique.hymne_masquer_paroles', 'Masquer les paroles') : t('historique.hymne_voir_paroles', 'Voir les paroles')}
                    className={`absolute right-4 top-4 z-20 flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold opacity-85 shadow backdrop-blur-sm transition hover:opacity-100 sm:right-6 sm:top-6 ${
                        showLyrics ? 'bg-isstm-gold text-isstm-navy-dark' : 'bg-white/10 text-white/85 hover:bg-white/20'
                    }`}
                >
                    {showLyrics ? <X className="h-3.5 w-3.5" aria-hidden="true" /> : <ScrollText className="h-3.5 w-3.5" aria-hidden="true" />}
                    {t('historique.hymne_paroles', 'Paroles')}
                </button>
            )}

            <div className="relative z-10 flex flex-col gap-6 p-6 sm:flex-row sm:items-center sm:p-8">
                <div className="relative mx-auto h-40 w-40 flex-shrink-0 overflow-hidden rounded-2xl shadow-xl ring-2 ring-white/20 sm:mx-0 sm:h-44 sm:w-44">
                    <img src={COVER_PATH} alt="" className="h-full w-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" aria-hidden="true" />

                    <p className="absolute inset-x-0 bottom-0 p-3 text-sm font-bold text-white drop-shadow">
                        <LetterRevealText text="ISSTM" />
                    </p>

                    {canListen && (
                        <div
                            className={`hymne-equalizer absolute right-3 top-3 flex h-4 items-end gap-0.5 ${playing ? 'is-playing' : ''}`}
                            aria-hidden="true"
                        >
                            <span className="h-full w-1 rounded-full bg-isstm-gold" />
                            <span className="h-full w-1 rounded-full bg-isstm-gold" />
                            <span className="h-full w-1 rounded-full bg-isstm-gold" />
                            <span className="h-full w-1 rounded-full bg-isstm-gold" />
                        </div>
                    )}
                </div>

                <div className="min-w-0 flex-1 text-center sm:text-left">
                    <div className="flex items-center justify-center gap-2 text-isstm-gold sm:justify-start">
                        <Music className="h-4 w-4" aria-hidden="true" />
                        <span className="text-xs font-bold uppercase tracking-wider">
                            {t('historique.hymne_eyebrow', 'Hymne officiel')}
                        </span>
                    </div>

                    <EditableText as="h2" contentKey="hymne_titre" className="mt-1 text-xl font-bold text-white sm:text-2xl">
                        {content.hymne_titre}
                    </EditableText>

                    <EditableText as="p" contentKey="hymne_texte" className="mt-2 text-sm text-white/75">
                        {content.hymne_texte}
                    </EditableText>

                    {canListen ? (
                        <div className="mt-5 space-y-3">
                            <audio
                                ref={audioRef}
                                src={AUDIO_PATH}
                                loop={loop}
                                preload="metadata"
                                onPlay={() => setPlaying(true)}
                                onPause={() => setPlaying(false)}
                                onEnded={() => setPlaying(false)}
                                onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
                                onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
                            />

                            <div className="flex items-center gap-3">
                                <button
                                    type="button"
                                    onClick={togglePlay}
                                    aria-label={playing ? t('historique.hymne_pause', 'Mettre en pause') : t('historique.hymne_ecouter', "Écouter l'hymne")}
                                    className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-isstm-gold text-isstm-navy-dark shadow-lg transition hover:scale-105"
                                >
                                    {playing ? (
                                        <Pause className="h-5 w-5" aria-hidden="true" />
                                    ) : (
                                        <Play className="ml-0.5 h-5 w-5" aria-hidden="true" />
                                    )}
                                </button>

                                <div
                                    role="slider"
                                    tabIndex={0}
                                    aria-label={t('historique.hymne_progression', 'Progression de la lecture')}
                                    aria-valuemin={0}
                                    aria-valuemax={100}
                                    aria-valuenow={Math.round(progress)}
                                    onClick={handleSeekClick}
                                    onKeyDown={handleSeekKeyDown}
                                    className="group h-2 flex-1 cursor-pointer rounded-full bg-white/15 outline-none focus-visible:ring-2 focus-visible:ring-isstm-gold"
                                >
                                    <div className="h-full rounded-full bg-isstm-gold transition-[width]" style={{ width: `${progress}%` }} />
                                </div>

                                <span className="w-16 flex-shrink-0 text-right text-xs tabular-nums text-white/60">
                                    {formatTime(currentTime)} / {formatTime(duration)}
                                </span>

                                <div className="hidden flex-shrink-0 items-center gap-1.5 sm:flex">
                                    <button
                                        type="button"
                                        onClick={toggleMute}
                                        aria-label={muted || volume === 0 ? t('historique.hymne_son_on', 'Activer le son') : t('historique.hymne_son_off', 'Couper le son')}
                                        title={muted || volume === 0 ? t('historique.hymne_son_on', 'Activer le son') : t('historique.hymne_son_off', 'Couper le son')}
                                        className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-white/10 text-white/70 transition hover:bg-white/20"
                                    >
                                        <VolumeIcon className="h-4 w-4" aria-hidden="true" />
                                    </button>

                                    <input
                                        type="range"
                                        min="0"
                                        max="1"
                                        step="0.01"
                                        value={effectiveVolume}
                                        onChange={handleVolumeChange}
                                        aria-label={t('historique.hymne_volume', 'Volume')}
                                        className="w-16 accent-isstm-gold"
                                    />
                                </div>

                                <button
                                    type="button"
                                    onClick={toggleLoop}
                                    aria-pressed={loop}
                                    aria-label={loop ? t('historique.hymne_boucle_off', 'Désactiver la lecture en boucle') : t('historique.hymne_boucle_on', 'Activer la lecture en boucle')}
                                    title={loop ? t('historique.hymne_boucle_off', 'Désactiver la lecture en boucle') : t('historique.hymne_boucle_on', 'Activer la lecture en boucle')}
                                    className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full transition ${
                                        loop ? 'bg-isstm-gold text-isstm-navy-dark' : 'bg-white/10 text-white/70 hover:bg-white/20'
                                    }`}
                                >
                                    <Repeat className="h-4 w-4" aria-hidden="true" />
                                </button>

                                <a
                                    href={AUDIO_PATH}
                                    download="Hymne-ISSTM.mp3"
                                    aria-label={t('historique.hymne_telecharger', "Télécharger l'hymne")}
                                    title={t('historique.hymne_telecharger', "Télécharger l'hymne")}
                                    className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-white/10 text-white/70 transition hover:bg-white/20"
                                >
                                    <Download className="h-4 w-4" aria-hidden="true" />
                                </a>
                            </div>
                        </div>
                    ) : (
                        <div className="mt-5 flex items-center justify-center gap-2 rounded-xl bg-white/5 p-4 sm:justify-start">
                            <Lock className="h-4 w-4 flex-shrink-0 text-white/80" aria-hidden="true" />
                            <p className="text-sm text-white/80">
                                {t('historique.hymne_connexion_requise', "Connectez-vous pour écouter ou télécharger l'hymne.")}
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {canListen && (
                <div
                    className={`relative z-10 grid px-6 transition-[grid-template-rows] duration-300 ease-in-out sm:px-8 ${
                        showLyrics ? 'grid-rows-[1fr] pb-6 sm:pb-8' : 'grid-rows-[0fr] pb-0'
                    }`}
                >
                    <div className="min-h-0 overflow-hidden">
                        <div className="border-t border-white/10 pt-5">
                            <EditableText
                                as="div"
                                contentKey="hymne_paroles"
                                className="max-h-80 overflow-y-auto whitespace-pre-line text-sm leading-relaxed text-white/85"
                            >
                                {content.hymne_paroles}
                            </EditableText>
                        </div>
                    </div>
                </div>
            )}
        </section>
    );
}
