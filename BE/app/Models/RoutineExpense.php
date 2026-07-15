<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class RoutineExpense extends Model
{
    protected $guarded = [];

    public function rt()
    {
        return $this->belongsTo(Rt::class);
    }

    public function records()
    {
        return $this->hasMany(RoutineExpenseRecord::class);
    }

    public function rts()
    {
        return $this->belongsToMany(Rt::class, 'routine_expense_rt')
                    ->withPivot('per_kk_amount', 'total_kk')
                    ->withTimestamps();
    }
}
