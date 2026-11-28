<?php

use App\SiteContentType;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Lets a super admin remove one of the 6 bibliothèque carousel photos
     * (and its caption) from Bibliotheque/Accueil.jsx without touching the
     * other five — a SiteContentType::Url flag ('true'/'false'), same
     * non-translated reasoning as bibliotheque_lien, and the same reversible
     * toggle pattern as preinscription_asterisque_*: the image/caption
     * values themselves are never cleared, only hidden, so undeleting needs
     * no re-upload.
     */
    public function up(): void
    {
        for ($i = 1; $i <= 6; $i++) {
            DB::table('site_contents')->updateOrInsert(
                ['content_key' => "bibliotheque_slide{$i}_supprime"],
                [
                    'type' => SiteContentType::Url->value,
                    'content_value_fr' => 'false',
                    'content_value_en' => 'false',
                    'content_value_mg' => 'false',
                    'created_at' => now(),
                    'updated_at' => now(),
                ],
            );
        }
    }

    public function down(): void
    {
        for ($i = 1; $i <= 6; $i++) {
            DB::table('site_contents')->where('content_key', "bibliotheque_slide{$i}_supprime")->delete();
        }
    }
};
