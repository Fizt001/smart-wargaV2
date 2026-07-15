<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PaymentMethod extends Model
{
    use HasFactory;

    protected $fillable = [
        'rt_id',
        'bank_name',
        'account_number',
        'account_name',
        'is_active',
        'qr_image_path',
    ];

    public function rt()
    {
        return $this->belongsTo(Rt::class);
    }

    protected $casts = [
        'is_active' => 'boolean',
    ];
}
