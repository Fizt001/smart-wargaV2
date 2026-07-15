<?php

namespace App\Http\Controllers;

use App\Models\Complaint;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class ComplaintController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        
        $query = Complaint::with(['user', 'rt'])->latest();

        // If user is Warga (role 8), only show their complaints
        if ($user->role_id == 8) {
            $query->where('user_id', $user->id);
        } else if (in_array($user->role_id, [3, 6, 7])) {
            // RT Pengurus sees only complaints in their RT
            $query->where('rt_id', $user->rt_id);
        }
        // RW and Superadmin see all complaints

        return response()->json([
            'status' => 'success',
            'data' => $query->get()
        ]);
    }

    public function store(Request $request)
    {
        $user = $request->user();

        $validated = $request->validate([
            'category' => 'required|string',
            'title' => 'required|string|max:255',
            'description' => 'required|string',
            'image' => 'nullable|image|max:2048' // max 2MB
        ]);

        $imagePath = null;
        if ($request->hasFile('image')) {
            $imagePath = $request->file('image')->store('complaints', 'public');
        }

        $complaint = Complaint::create([
            'user_id' => $user->id,
            'rt_id' => $user->rt_id, // Link it to the user's RT
            'category' => $validated['category'],
            'title' => $validated['title'],
            'description' => $validated['description'],
            'image_path' => $imagePath,
            'status' => 'pending'
        ]);

        return response()->json([
            'status' => 'success',
            'message' => 'Pengaduan berhasil dikirim.',
            'data' => $complaint
        ], 201);
    }

    public function updateStatus(Request $request, $id)
    {
        $user = $request->user();
        
        // Only Pengurus can update status
        if ($user->role_id > 7) {
            return response()->json(['status' => 'error', 'message' => 'Unauthorized'], 403);
        }

        $validated = $request->validate([
            'status' => 'required|in:pending,processing,resolved,rejected',
            'response' => 'nullable|string'
        ]);

        $complaint = Complaint::findOrFail($id);

        // Security Check: RT Pengurus can only update complaints in their RT
        if (in_array($user->role_id, [3, 6, 7]) && $complaint->rt_id != $user->rt_id) {
            return response()->json(['status' => 'error', 'message' => 'Unauthorized for this RT'], 403);
        }

        $complaint->update([
            'status' => $validated['status'],
            'response' => $validated['response'] ?? $complaint->response
        ]);

        return response()->json([
            'status' => 'success',
            'message' => 'Status pengaduan berhasil diperbarui.',
            'data' => $complaint
        ]);
    }

    public function destroy(Request $request, $id)
    {
        $user = $request->user();
        $complaint = Complaint::findOrFail($id);

        // Warga can delete their own pending complaint, Superadmin can delete anything
        if ($user->role_id == 8 && ($complaint->user_id != $user->id || $complaint->status != 'pending')) {
             return response()->json(['status' => 'error', 'message' => 'Cannot delete this complaint'], 403);
        }

        if ($complaint->image_path) {
            Storage::disk('public')->delete($complaint->image_path);
        }

        $complaint->delete();

        return response()->json([
            'status' => 'success',
            'message' => 'Pengaduan berhasil dihapus.'
        ]);
    }
}
