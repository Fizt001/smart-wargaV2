<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class HealthRecord extends Model
{
    use HasFactory;

    protected $fillable = [
        'family_member_id',
        'record_date',
        'weight',
        'height',
        'head_circumference',
        'blood_pressure',
        'notes',
    ];

    public function familyMember()
    {
        return $this->belongsTo(FamilyMember::class);
    }
}
