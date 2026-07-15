<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class FamilyMember extends Model
{
    use HasFactory;

    protected $fillable = [
        'family_id',
        'nik',
        'name',
        'birth_date',
        'relationship',
        'religion_id',
        'family_relation_status_id'
    ];

    protected $casts = [
        'birth_date' => 'date',
    ];

    public function family()
    {
        return $this->belongsTo(Family::class);
    }

    public function religion()
    {
        return $this->belongsTo(Religion::class);
    }

    public function familyRelationStatus()
    {
        return $this->belongsTo(FamilyRelationStatus::class, 'family_relation_status_id');
    }
}
