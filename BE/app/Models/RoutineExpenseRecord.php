<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class RoutineExpenseRecord extends Model
{
    protected $guarded = [];

    public function routineExpense()
    {
        return $this->belongsTo(RoutineExpense::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class); // The person who processed this payment
    }
}
