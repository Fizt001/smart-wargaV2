<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

class BillingComponentController extends Controller
{
    public function index()
    {
        $user = auth()->user();
        $rtId = request('rt_id');

        if ($user->role_id == 1 || in_array($user->role_id, [2, 4, 5])) {
            $query = \App\Models\BillingComponent::with('rt')->latest();
            if ($rtId) {
                $query->where(function ($q) use ($rtId) {
                    $q->where('rt_id', $rtId)->orWhereNull('rt_id');
                });
            }
            $components = $query->get();
        } elseif (in_array($user->role_id, [3, 6, 7])) {
            $components = \App\Models\BillingComponent::with('rt')->where(function ($q) use ($user) {
                $q->where('rt_id', $user->rt_id)->orWhereNull('rt_id');
            })->latest()->get();
        } else {
            $components = collect();
        }

        return response()->json(['status' => 'success', 'data' => $components]);
    }

    public function store(Request $request)
    {
        $user = auth()->user();
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'amount' => 'required|numeric|min:0',
            'is_active' => 'boolean'
        ]);

        $validated['is_active'] = $request->has('is_active') ? $request->is_active : true;

        if (in_array($user->role_id, [3, 6, 7])) {
            $validated['level'] = 'RT';
            $validated['rt_id'] = $user->rt_id;
        } elseif ($user->role_id == 1) {
            $saValidated = $request->validate([
                'level' => 'required|in:RW,RT',
                'rt_id' => 'nullable|exists:rts,id'
            ]);
            $validated['level'] = $saValidated['level'];
            $validated['rt_id'] = $saValidated['rt_id'] ?? null;
        } else {
            return response()->json(['message' => 'Hanya Pengurus RT yang dapat membuat komponen IPL'], 403);
        }

        $component = \App\Models\BillingComponent::create($validated);
        return response()->json(['status' => 'success', 'data' => $component], 201);
    }

    public function update(Request $request, $id)
    {
        $user = auth()->user();
        $component = \App\Models\BillingComponent::findOrFail($id);

        if ($user->role_id != 1) {
            if (in_array($user->role_id, [3, 6, 7]) && ($component->level != 'RT' || $component->rt_id != $user->rt_id)) {
                return response()->json(['message' => 'Hanya Pengurus RT terkait yang dapat mengubah komponen IPL'], 403);
            }
            if (!in_array($user->role_id, [3, 6, 7])) {
                return response()->json(['message' => 'Hanya Pengurus RT yang dapat mengubah komponen IPL'], 403);
            }
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'amount' => 'required|numeric|min:0',
            'is_active' => 'boolean'
        ]);

        if ($request->has('is_active')) {
            $validated['is_active'] = $request->is_active;
        }

        $component->update($validated);
        return response()->json(['status' => 'success', 'data' => $component]);
    }

    public function destroy($id)
    {
        $user = auth()->user();
        $component = \App\Models\BillingComponent::findOrFail($id);

        if ($user->role_id != 1) {
            if (in_array($user->role_id, [3, 6, 7]) && ($component->level != 'RT' || $component->rt_id != $user->rt_id)) {
                return response()->json(['message' => 'Hanya Pengurus RT terkait yang dapat menghapus komponen IPL'], 403);
            }
            if (!in_array($user->role_id, [3, 6, 7])) {
                return response()->json(['message' => 'Hanya Pengurus RT yang dapat menghapus komponen IPL'], 403);
            }
        }

        $component->delete();
        return response()->json(['status' => 'success', 'message' => 'Komponen berhasil dihapus']);
    }
}
