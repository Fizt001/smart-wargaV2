<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class DeathRecord extends Model
{
    use HasFactory;

    protected $fillable = [
        'reporter_id',
        'deceased_name',
        'nik',
        'date_of_death',
        'cause_of_death',
        'burial_location',
        'compensation_amount',
        'status',
        'notes',
    ];

    public function reporter()
    {
        return $this->belongsTo(User::class, 'reporter_id');
    }
}
