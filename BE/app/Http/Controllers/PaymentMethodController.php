<?php

namespace App\Http\Controllers;

use App\Models\PaymentMethod;
use Illuminate\Http\Request;

class PaymentMethodController extends Controller
{
    public function index()
    {
        $user = auth()->user();
        $rtId = request('rt_id');

        if (in_array($user->role_id, [1, 2, 4, 5])) { // SA and RW
            $query = PaymentMethod::with('rt')->orderBy('id', 'desc');
            if ($rtId) $query->where('rt_id', $rtId);
            $methods = $query->get();
        } else {
            // RT and Warga see their RT's active methods, or global ones (rt_id null) if needed.
            $methods = PaymentMethod::with('rt')
                ->where('is_active', true)
                ->where(function ($q) use ($user) {
                    $q->where('rt_id', $user->rt_id)->orWhereNull('rt_id');
                })
                ->orderBy('id', 'desc')->get();
        }
        
        return response()->json(['data' => $methods]);
    }

    public function store(Request $request)
    {
        $user = auth()->user();
        // Only SA and RT can create
        if (!in_array($user->role_id, [1, 3, 6, 7])) {
            return response()->json(['message' => 'Hanya pengurus tingkat RT yang dapat membuat metode pembayaran.'], 403);
        }

        $validated = $request->validate([
            'bank_name' => 'required|string|max:255',
            'account_number' => 'required|string|max:255',
            'account_name' => 'required|string|max:255',
            'is_active' => 'boolean',
            'qr_image' => 'nullable|image|mimes:jpeg,png,jpg|max:5120',
            'rt_id' => $user->role_id == 1 ? 'nullable|exists:rts,id' : 'nullable'
        ]);

        if (in_array($user->role_id, [3, 6, 7])) {
            $validated['rt_id'] = $user->rt_id;
        }

        $validated['is_active'] = $request->has('is_active') ? filter_var($request->is_active, FILTER_VALIDATE_BOOLEAN) : true;

        if ($request->hasFile('qr_image')) {
            $path = $request->file('qr_image')->store('qr_images', 'public');
            $validated['qr_image_path'] = $path;
        }

        $method = PaymentMethod::create($validated);
        return response()->json(['message' => 'Payment method created successfully', 'data' => $method], 201);
    }

    public function show(string $id)
    {
        $method = PaymentMethod::findOrFail($id);
        return response()->json(['data' => $method]);
    }

    public function update(Request $request, string $id)
    {
        $user = auth()->user();
        $method = PaymentMethod::findOrFail($id);

        if (!in_array($user->role_id, [1, 3, 6, 7]) || (in_array($user->role_id, [3, 6, 7]) && $method->rt_id != $user->rt_id)) {
            return response()->json(['message' => 'Hanya Pengurus RT terkait yang dapat mengubah metode pembayaran.'], 403);
        }

        $validated = $request->validate([
            'bank_name' => 'sometimes|required|string|max:255',
            'account_number' => 'sometimes|required|string|max:255',
            'account_name' => 'sometimes|required|string|max:255',
            'is_active' => 'boolean',
            'qr_image' => 'nullable|image|mimes:jpeg,png,jpg|max:5120',
            'rt_id' => $user->role_id == 1 ? 'nullable|exists:rts,id' : 'nullable'
        ]);

        if ($request->has('is_active')) {
            $validated['is_active'] = filter_var($request->is_active, FILTER_VALIDATE_BOOLEAN);
        }

        if ($request->hasFile('qr_image')) {
            // Delete old QR if exists
            if ($method->qr_image_path) {
                \Illuminate\Support\Facades\Storage::disk('public')->delete($method->qr_image_path);
            }
            $path = $request->file('qr_image')->store('qr_images', 'public');
            $validated['qr_image_path'] = $path;
        }

        $method->update($validated);
        return response()->json(['message' => 'Payment method updated successfully', 'data' => $method]);
    }

    public function destroy(string $id)
    {
        $user = auth()->user();
        $method = PaymentMethod::findOrFail($id);

        if (!in_array($user->role_id, [1, 3, 6, 7]) || (in_array($user->role_id, [3, 6, 7]) && $method->rt_id != $user->rt_id)) {
            return response()->json(['message' => 'Hanya Pengurus RT terkait yang dapat menghapus metode pembayaran.'], 403);
        }

        $method->delete();

        return response()->json(['message' => 'Payment method deleted successfully']);
    }
}
