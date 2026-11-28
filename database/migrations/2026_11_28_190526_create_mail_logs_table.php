<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * A trace of every e-mail an admin sends from the "E-mails" console
     * screen — a reply to a contact_message (contact_message_id set) or a
     * free-form send (left null) — whether it actually went out, was only
     * logged (MAIL_MAILER=log), or failed, with the real error kept for
     * `failed` so the admin never has to go read a server log for it.
     */
    public function up(): void
    {
        Schema::create('mail_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('contact_message_id')->nullable()->constrained()->cascadeOnDelete();
            $table->foreignId('sent_by')->nullable()->constrained('users')->nullOnDelete();
            $table->string('to_email');
            $table->string('subject');
            $table->text('body');
            $table->string('status', 20);
            $table->string('error')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('mail_logs');
    }
};
