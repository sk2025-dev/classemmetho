<?php

namespace App\Jobs;

use App\Mail\SendCredentials;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

class SendCredentialsEmail implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $userId;
    public string $identifier;
    public string $tempPassword;

    public function __construct(int $userId, string $identifier, string $tempPassword)
    {
        $this->userId = $userId;
        $this->identifier = $identifier;
        $this->tempPassword = $tempPassword;
    }

    public function handle(): void
    {
        $user = User::find($this->userId);
        if (!$user) {
            Log::warning('Envoi identifiants: utilisateur introuvable', [
                'user_id' => $this->userId,
            ]);
            return;
        }

        $email = trim((string) $user->email);
        if ($email === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
            Log::warning('Envoi identifiants: email invalide', [
                'user_id' => $user->id,
                'email' => $email,
            ]);
            return;
        }

        Mail::to($email)->send(new SendCredentials(
            $user,
            $this->identifier,
            $this->tempPassword
        ));
    }
}
