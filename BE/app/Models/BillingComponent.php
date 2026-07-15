<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class BillingComponent extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'amount',
        'level',
        'rt_id',
        'is_active',
        'is_rw_mandated',
        'routine_expense_id',
    ];

    public function rt()
    {
        return $this->belongsTo(Rt::class);
    }
}
