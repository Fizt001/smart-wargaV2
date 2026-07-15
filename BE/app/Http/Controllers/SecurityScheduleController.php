<?php

namespace App\Http\Controllers;

use App\Models\SecuritySchedule;
use Illuminate\Http\Request;

class SecurityScheduleController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        
        $query = SecuritySchedule::with('user')->orderBy('date', 'desc');

        // If user is Warga, maybe only show their schedule? Or everyone's schedule so they know who is on duty.
        // Usually, everyone can see the schedule.

        return response()->json([
            'status' => 'success',
            'data' => $query->get()
        ]);
    }

    public function store(Request $request)
    {
        $user = $request->user();
        if ($user->role_id > 7) {
            return response()->json(['status' => 'error', 'message' => 'Unauthorized'], 403);
        }

        $validated = $request->validate([
            'user_id' => 'required|exists:users,id',
            'date' => 'required|date',
            'shift' => 'required|string',
            'notes' => 'nullable|string'
        ]);

        $schedule = SecuritySchedule::create(array_merge($validated, ['status' => 'pending']));

        return response()->json([
            'status' => 'success',
            'message' => 'Jadwal ronda berhasil ditambahkan.',
            'data' => $schedule
        ], 201);
    }

    public function updateStatus(Request $request, $id)
    {
        $user = $request->user();

        $validated = $request->validate([
            'status' => 'required|in:pending,present,absent,excused'
        ]);

        $schedule = SecuritySchedule::findOrFail($id);
        
        // Pengurus can update anyone. Warga can only update their own status (like confirming attendance)
        if ($user->role_id > 7 && $schedule->user_id != $user->id) {
             return response()->json(['status' => 'error', 'message' => 'Unauthorized'], 403);
        }

        $schedule->update(['status' => $validated['status']]);

        return response()->json([
            'status' => 'success',
            'message' => 'Kehadiran ronda diperbarui.',
            'data' => $schedule
        ]);
    }
}
