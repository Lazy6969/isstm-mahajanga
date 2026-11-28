<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Admin\Concerns\ManagesUploadedImages;
use App\Models\Teacher;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Lets an enseignant account edit its own public directory card (the one
 * shown on /enseignants) — photo, specialties and bio only, never the
 * structural fields (catégorie, département, ordre d'affichage) that stay
 * admin-only. There is no `teachers.user_id` column: the link is the e-mail
 * already on both records, so an admin wires this up simply by putting the
 * teacher's account e-mail on their directory card (Admin\TeacherController),
 * the same contact field that already existed there.
 */
class TeacherProfileController extends Controller
{
    use ManagesUploadedImages;

    public function edit(Request $request): Response
    {
        return Inertia::render('TeacherProfile/Edit', [
            'teacher' => $this->linkedTeacher($request)?->only([
                'id', 'name', 'photo_path', 'specialty_fr', 'specialty_en', 'specialty_mg',
                'description_fr', 'description_en', 'description_mg', 'email',
            ]),
        ]);
    }

    public function update(Request $request): RedirectResponse
    {
        $teacher = $this->linkedTeacher($request);
        abort_if($teacher === null, 404);

        $validated = $request->validate([
            'specialty_fr' => ['nullable', 'string', 'max:255'],
            'specialty_en' => ['nullable', 'string', 'max:255'],
            'specialty_mg' => ['nullable', 'string', 'max:255'],
            'description_fr' => ['nullable', 'string'],
            'description_en' => ['nullable', 'string'],
            'description_mg' => ['nullable', 'string'],
            'photo' => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:4096'],
        ]);

        if ($request->hasFile('photo')) {
            $this->deleteUploadedImage($teacher->photo_path, 'teachers');
            $validated['photo_path'] = $this->storeUploadedImage($request, 'photo', 'teachers');
        }
        unset($validated['photo']);

        $teacher->update($validated);

        return back()->with('status', 'Votre fiche a été mise à jour.');
    }

    private function linkedTeacher(Request $request): ?Teacher
    {
        return Teacher::where('email', $request->user()->email)->first();
    }
}
