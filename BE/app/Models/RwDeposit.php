<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class RwDeposit extends Model
{
    protected $fillable = [
        'rt_id',
        'month',
        'year',
        'amount',
        'proof_image_path',
        'status',
        'verified_by',
        'notes',
    ];

    public function rt()
    {
        return $this->belongsTo(Rt::class);
    }

    public function verifier()
    {
        return $this->belongsTo(User::class, 'verified_by');
    }
}
