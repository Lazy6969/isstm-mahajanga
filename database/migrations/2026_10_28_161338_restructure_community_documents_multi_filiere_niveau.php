<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // A lesson/sujet can now target several filières (many-to-many)
        // instead of a single one.
        Schema::create('community_document_filiere', function (Blueprint $table) {
            $table->id();
            $table->foreignId('community_document_id')->constrained()->cascadeOnDelete();
            $table->foreignId('filiere_id')->constrained()->cascadeOnDelete();
            $table->unique(['community_document_id', 'filiere_id'], 'cdf_document_filiere_unique');
        });

        Schema::table('community_documents', function (Blueprint $table) {
            // MariaDB refuses to drop an index still backing a foreign key
            // constraint ("needed in a foreign key constraint"), so the FK
            // must go first; SQLite in turn refuses to drop a column still
            // referenced by an index, so the index must go before the
            // column. This order (foreign key, then index, then column)
            // satisfies every engine.
            $table->dropForeign(['filiere_id']);
        });

        Schema::table('community_documents', function (Blueprint $table) {
            $table->dropIndex(['filiere_id', 'niveau']);
        });

        Schema::table('community_documents', function (Blueprint $table) {
            $table->dropColumn('filiere_id');
            // 'niveau' (single L1..M2 string) becomes 'niveaux' (JSON array of
            // the same codes) — several levels can now be tagged at once.
            $table->json('niveaux')->nullable()->after('category');
        });

        Schema::table('community_documents', function (Blueprint $table) {
            $table->dropColumn('niveau');
        });
    }

    public function down(): void
    {
        Schema::table('community_documents', function (Blueprint $table) {
            $table->string('niveau', 10)->nullable()->after('category');
        });

        Schema::table('community_documents', function (Blueprint $table) {
            $table->dropColumn('niveaux');
            $table->foreignId('filiere_id')->nullable()->after('category')->constrained()->nullOnDelete();
        });

        Schema::dropIfExists('community_document_filiere');
    }
};
