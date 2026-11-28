<?php

namespace App\Models;

use Database\Factories\MailLogFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MailLog extends Model
{
    /** @use HasFactory<MailLogFactory> */
    use HasFactory;

    protected $fillable = ['contact_message_id', 'sent_by', 'to_email', 'subject', 'body', 'status', 'error'];

    /**
     * @return BelongsTo<ContactMessage, $this>
     */
    public function contact(): BelongsTo
    {
        return $this->belongsTo(ContactMessage::class);
    }

    /**
     * @return array{id: int, to_email: string, subject: string, body: string, status: string, error: ?string, at: string}
     */
    public function present(): array
    {
        return [
            'id' => $this->id,
            'to_email' => $this->to_email,
            'subject' => $this->subject,
            'body' => $this->body,
            'status' => $this->status,
            'error' => $this->error,
            'at' => $this->created_at->diffForHumans(),
            'date' => $this->created_at->format('d/m/Y H:i'),
        ];
    }
}
