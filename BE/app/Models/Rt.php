<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Rt extends Model
{
    protected $guarded = [];

    public function blocks()
    {
        return $this->hasMany(Block::class);
    }
}
