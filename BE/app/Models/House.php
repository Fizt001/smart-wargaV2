<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class House extends Model
{
    protected $fillable = ['block_id', 'number'];

    public function block()
    {
        return $this->belongsTo(Block::class);
    }

    public function users()
    {
        return $this->hasMany(User::class);
    }
}
