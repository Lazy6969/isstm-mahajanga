<?php

namespace Database\Factories;

use App\Models\MailLog;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<MailLog>
 */
class MailLogFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'to_email' => fake()->safeEmail(),
            'subject' => fake()->sentence(3),
            'body' => fake()->paragraph(),
            'status' => 'sent',
        ];
    }
}
