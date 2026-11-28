<?php

namespace App\Models;

use Database\Factories\ContactMessageFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ContactMessage extends Model
{
    /** @use HasFactory<ContactMessageFactory> */
    use HasFactory;

    protected $fillable = ['objet', 'nom', 'prenoms', 'email', 'telephone', 'message', 'read_at', 'replied_at'];

    protected function casts(): array
    {
        return [
            'read_at' => 'datetime',
            'replied_at' => 'datetime',
        ];
    }

    /**
     * @return HasMany<MailLog, $this>
     */
    public function replies(): HasMany
    {
        return $this->hasMany(MailLog::class)->oldest();
    }
}
