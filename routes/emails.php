<?php

use App\Http\Controllers\Admin\EmailController;
use Illuminate\Support\Facades\Route;

// Gestion des e-mails : messages reçus du formulaire de contact, réponses
// rapides, envois libres et historique — voir EmailController.
Route::middleware(['auth'])->prefix('console/emails')->name('admin.emails.')->group(function () {
    Route::get('/', [EmailController::class, 'index'])->middleware('can:settings.manage')->name('index');
    Route::post('envoyer', [EmailController::class, 'send'])->middleware('can:settings.manage')->name('send');
    Route::get('{contact}', [EmailController::class, 'show'])->middleware('can:settings.manage')->name('show');
    Route::patch('{contact}', [EmailController::class, 'toggleRead'])->middleware('can:settings.manage')->name('toggle-read');
    Route::delete('{contact}', [EmailController::class, 'destroy'])->middleware('can:settings.manage')->name('destroy');
    Route::post('{contact}/repondre', [EmailController::class, 'reply'])->middleware('can:settings.manage')->name('reply');
    Route::delete('envoyes/{mail}', [EmailController::class, 'destroySent'])->middleware('can:settings.manage')->name('destroy-sent');
});
