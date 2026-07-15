<?php

namespace App\Http\Controllers;

use App\Models\SecurityLog;
use Illuminate\Http\Request;

class SecurityLogController extends Controller
{
    public function index()
    {
        return response()->json([
            'status' => 'success',
            'data' => SecurityLog::with('reporter')->orderBy('date', 'desc')->orderBy('time', 'desc')->get()
        ]);
    }

    public function store(Request $request)
    {
        $user = $request->user();
        if ($user->role_id > 7) {
            return response()->json(['status' => 'error', 'message' => 'Unauthorized'], 403);
        }

        $validated = $request->validate([
            'date' => 'required|date',
            'time' => 'required',
            'incident_type' => 'required|string',
            'description' => 'required|string',
        ]);

        $log = SecurityLog::create([
            'reporter_id' => $user->id,
            'date' => $validated['date'],
            'time' => $validated['time'],
            'incident_type' => $validated['incident_type'],
            'description' => $validated['description'],
            'status' => 'reported'
        ]);

        return response()->json([
            'status' => 'success',
            'message' => 'Laporan keamanan berhasil dicatat.',
            'data' => $log
        ], 201);
    }

    public function updateStatus(Request $request, $id)
    {
        $user = $request->user();
        if ($user->role_id > 7) {
            return response()->json(['status' => 'error', 'message' => 'Unauthorized'], 403);
        }

        $validated = $request->validate([
            'status' => 'required|string'
        ]);

        $log = SecurityLog::findOrFail($id);
        $log->update(['status' => $validated['status']]);

        return response()->json([
            'status' => 'success',
            'message' => 'Status laporan diperbarui.',
            'data' => $log
        ]);
    }
}
