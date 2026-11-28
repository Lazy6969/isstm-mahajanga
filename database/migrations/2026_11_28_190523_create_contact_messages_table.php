<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Every submission of the Contact page's quick-send form (see
     * QuickContactController) — previously forwarded by e-mail and
     * forgotten; now also kept here so Admin\EmailController can list,
     * read and reply to them from the console.
     */
    public function up(): void
    {
        Schema::create('contact_messages', function (Blueprint $table) {
            $table->id();
            $table->string('objet');
            $table->string('nom');
            $table->string('prenoms');
            $table->string('email');
            $table->string('telephone')->nullable();
            $table->text('message');
            $table->timestamp('read_at')->nullable();
            $table->timestamp('replied_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('contact_messages');
    }
};
