<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class BillingDetail extends Model
{
    use HasFactory;

    protected $fillable = [
        'billing_id',
        'component_name',
        'amount',
    ];

    public function billing()
    {
        return $this->belongsTo(Billing::class);
    }
}
