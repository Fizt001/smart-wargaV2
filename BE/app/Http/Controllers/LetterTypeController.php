<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\LetterType;

class LetterTypeController extends Controller
{
    public function index()
    {
        return response()->json([
            'status' => 'success',
            'data' => LetterType::orderBy('id', 'desc')->get()
        ]);
    }

    public function show($id)
    {
        $letterType = LetterType::findOrFail($id);
        return response()->json([
            'status' => 'success',
            'data' => $letterType
        ]);
    }

    public function store(Request $request)
    {
        if (!in_array($request->user()->role_id, [1, 2, 4, 6])) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'requires_rw_approval' => 'boolean',
        ]);

        $letterType = LetterType::create([
            'name' => $validated['name'],
            'requires_rw_approval' => $request->has('requires_rw_approval') ? $validated['requires_rw_approval'] : false,
        ]);

        return response()->json([
            'status' => 'success',
            'message' => 'Tipe surat berhasil ditambahkan',
            'data' => $letterType
        ], 201);
    }

    public function update(Request $request, $id)
    {
        if (!in_array($request->user()->role_id, [1, 2, 4, 6])) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $letterType = LetterType::findOrFail($id);

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'requires_rw_approval' => 'boolean',
        ]);

        $letterType->update([
            'name' => $validated['name'],
            'requires_rw_approval' => $request->has('requires_rw_approval') ? $validated['requires_rw_approval'] : false,
        ]);

        return response()->json([
            'status' => 'success',
            'message' => 'Tipe surat berhasil diperbarui',
            'data' => $letterType
        ]);
    }

    public function updateTemplate(Request $request, $id)
    {
        if (!in_array($request->user()->role_id, [1, 2, 4, 6])) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $letterType = LetterType::findOrFail($id);

        $request->validate([
            'template_body' => 'nullable|string',
            'template_variables' => 'nullable|string',
        ]);

        $letterType->update([
            'template_body' => $request->template_body,
            'template_variables' => $request->template_variables,
        ]);

        return response()->json([
            'status' => 'success',
            'message' => 'Template surat berhasil disimpan',
            'data' => $letterType
        ]);
    }

    public function destroy(Request $request, $id)
    {
        if (!in_array($request->user()->role_id, [1, 2, 4, 6])) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $letterType = LetterType::findOrFail($id);
        
        // Cek apakah sudah ada surat yang menggunakan tipe ini
        $hasLetters = \App\Models\Letter::where('letter_type_id', $id)->exists();
        if ($hasLetters) {
            return response()->json([
                'status' => 'error',
                'message' => 'Tipe surat tidak bisa dihapus karena sudah ada surat yang dibuat dengan tipe ini.'
            ], 400);
        }

        $letterType->delete();

        return response()->json([
            'status' => 'success',
            'message' => 'Tipe surat berhasil dihapus'
        ]);
    }
}
