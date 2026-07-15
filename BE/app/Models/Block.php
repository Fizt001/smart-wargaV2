<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Block extends Model
{
    protected $guarded = [];

    public function rt()
    {
        return $this->belongsTo(Rt::class);
    }

    public function users()
    {
        return $this->hasMany(User::class);
    }

    public function houses()
    {
        return $this->hasMany(House::class);
    }
}
