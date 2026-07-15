<?php

namespace App\Http\Controllers;

use App\Models\HealthRecord;
use App\Models\FamilyMember;
use Illuminate\Http\Request;

class HealthRecordController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        
        if ($user->role_id >= 8) {
            $records = HealthRecord::with('familyMember.family')
                ->whereHas('familyMember.family', function($q) use ($user) {
                    $q->where('user_id', $user->id);
                })
                ->orderBy('record_date', 'desc')
                ->get();
        } else {
            $records = HealthRecord::with('familyMember.family.user')
                ->orderBy('record_date', 'desc')
                ->get();
        }

        return response()->json([
            'status' => 'success',
            'data' => $records
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'family_member_id' => 'required|exists:family_members,id',
            'record_date' => 'required|date',
            'weight' => 'required|numeric',
            'height' => 'required|numeric',
        ]);

        $record = HealthRecord::create($request->all());

        return response()->json([
            'status' => 'success',
            'message' => 'Data kesehatan berhasil ditambahkan',
            'data' => $record
        ]);
    }
}
