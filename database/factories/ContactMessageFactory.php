<?php

namespace Database\Factories;

use App\Models\ContactMessage;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<ContactMessage>
 */
class ContactMessageFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'objet' => fake()->sentence(3),
            'nom' => fake()->lastName(),
            'prenoms' => fake()->firstName(),
            'email' => fake()->safeEmail(),
            'telephone' => fake()->numerify('03########'),
            'message' => fake()->paragraph(),
        ];
    }
}
