<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Activity extends Model
{
    protected $guarded = [];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function rt()
    {
        return $this->belongsTo(Rt::class);
    }

    public function targetRts()
    {
        return $this->belongsToMany(Rt::class, 'activity_rts', 'activity_id', 'rt_id');
    }

    public function participants()
    {
        return $this->hasMany(ActivityParticipant::class);
    }

    public function donations()
    {
        return $this->hasMany(ActivityDonation::class);
    }
}
