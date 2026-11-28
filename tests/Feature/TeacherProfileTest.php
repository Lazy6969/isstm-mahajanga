<?php

use App\Models\Teacher;
use App\Models\User;
use App\Role;
use App\TeacherCategory;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

it('forbids a non-enseignant account from reaching the self-service teacher profile', function () {
    $etudiant = User::factory()->role(Role::Etudiant)->create();

    $this->actingAs($etudiant)->get('/ma-fiche-enseignant')->assertForbidden();
});

it('tells an enseignant with no matching directory card that none is linked yet', function () {
    $enseignant = User::factory()->role(Role::Enseignant)->create(['email' => 'prof@example.com']);

    $this->actingAs($enseignant)->get('/ma-fiche-enseignant')->assertInertia(fn ($page) => $page
        ->component('TeacherProfile/Edit')
        ->where('teacher', null)
    );
});

it('shows the directory card whose e-mail matches the signed-in enseignant', function () {
    $enseignant = User::factory()->role(Role::Enseignant)->create(['email' => 'prof@example.com']);
    $teacher = Teacher::factory()->create(['email' => 'prof@example.com', 'specialty_fr' => 'Mathématiques']);

    $this->actingAs($enseignant)->get('/ma-fiche-enseignant')->assertInertia(fn ($page) => $page
        ->component('TeacherProfile/Edit')
        ->where('teacher.id', $teacher->id)
        ->where('teacher.specialty_fr', 'Mathématiques')
    );
});

it('lets the enseignant update their own specialty and bio in every language', function () {
    $enseignant = User::factory()->role(Role::Enseignant)->create(['email' => 'prof@example.com']);
    $teacher = Teacher::factory()->create(['email' => 'prof@example.com']);

    $this->actingAs($enseignant)->post('/ma-fiche-enseignant', [
        'specialty_fr' => 'Physique',
        'specialty_en' => 'Physics',
        'specialty_mg' => 'Fizika',
        'description_fr' => 'Bio FR',
        'description_en' => 'Bio EN',
        'description_mg' => 'Bio MG',
    ])->assertRedirect();

    $teacher->refresh();
    expect($teacher->specialty_fr)->toBe('Physique');
    expect($teacher->specialty_en)->toBe('Physics');
    expect($teacher->specialty_mg)->toBe('Fizika');
    expect($teacher->description_fr)->toBe('Bio FR');
});

it('lets the enseignant replace their own photo', function () {
    Storage::fake('public');
    $enseignant = User::factory()->role(Role::Enseignant)->create(['email' => 'prof@example.com']);
    $teacher = Teacher::factory()->create(['email' => 'prof@example.com']);

    $this->actingAs($enseignant)->post('/ma-fiche-enseignant', [
        'photo' => UploadedFile::fake()->image('moi.jpg'),
    ])->assertRedirect();

    $teacher->refresh();
    Storage::disk('public')->assertExists(str_replace('storage/', '', $teacher->photo_path));
});

it('never lets the enseignant change their category, département or display order', function () {
    $enseignant = User::factory()->role(Role::Enseignant)->create(['email' => 'prof@example.com']);
    $teacher = Teacher::factory()->create(['email' => 'prof@example.com', 'category' => TeacherCategory::Permanent, 'display_order' => 3]);

    $this->actingAs($enseignant)->post('/ma-fiche-enseignant', [
        'category' => 'vacataire',
        'display_order' => 99,
        'specialty_fr' => 'Chimie',
    ])->assertRedirect();

    $teacher->refresh();
    expect($teacher->category)->toBe(TeacherCategory::Permanent);
    expect($teacher->display_order)->toBe(3);
    expect($teacher->specialty_fr)->toBe('Chimie');
});

it('refuses to update when the enseignant has no linked directory card', function () {
    $enseignant = User::factory()->role(Role::Enseignant)->create(['email' => 'prof@example.com']);

    $this->actingAs($enseignant)->post('/ma-fiche-enseignant', [
        'specialty_fr' => 'Chimie',
    ])->assertNotFound();
});
