<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class HouseMoveRequest extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'type',
        'old_rt_id',
        'old_house_id',
        'new_rt_id',
        'new_block_id',
        'new_house_number',
        'reason',
        'status',
        'approved_by'
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function oldRt()
    {
        return $this->belongsTo(Rt::class, 'old_rt_id');
    }

    public function oldHouse()
    {
        return $this->belongsTo(House::class, 'old_house_id');
    }

    public function newRt()
    {
        return $this->belongsTo(Rt::class, 'new_rt_id');
    }

    public function newBlock()
    {
        return $this->belongsTo(Block::class, 'new_block_id');
    }

    public function approver()
    {
        return $this->belongsTo(User::class, 'approved_by');
    }
}
