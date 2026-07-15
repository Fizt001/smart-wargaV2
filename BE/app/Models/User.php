<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasApiTokens, HasFactory, Notifiable;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'nik',
        'name',
        'phone_number',
        'role_id',
        'rt_id',
        'block_id',
        'house_id',
        'is_approved',
        'registration_status',
        'religion_id',
        'marital_status_id',
        'profession_category_id',
        'email',
        'password',
    ];

    public function role()
    {
        return $this->belongsTo(Role::class);
    }

    public function rt()
    {
        return $this->belongsTo(Rt::class);
    }

    public function block()
    {
        return $this->belongsTo(Block::class);
    }

    public function house()
    {
        return $this->belongsTo(House::class);
    }

    public function religion()
    {
        return $this->belongsTo(Religion::class);
    }

    public function maritalStatus()
    {
        return $this->belongsTo(MaritalStatus::class);
    }

    public function professionCategory()
    {
        return $this->belongsTo(ProfessionCategory::class);
    }

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'is_approved' => 'boolean',
        ];
    }

    public function walletTransactions()
    {
        return $this->hasMany(WalletTransaction::class);
    }

    public function activityParticipants()
    {
        return $this->hasMany(ActivityParticipant::class);
    }

    public function activityDonations()
    {
        return $this->hasMany(ActivityDonation::class);
    }

    public function family()
    {
        return $this->hasOne(Family::class);
    }
}
