<?php

namespace App\Http\Controllers;

use App\Models\Family;
use App\Models\FamilyMember;
use Illuminate\Http\Request;
use Carbon\Carbon;

class FamilyController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        
        $targetUserId = $user->id;
        if ($request->has('user_id') && $user->role_id !== 8) {
            $targetUserId = $request->user_id;
        }

        // Pastikan KK Inti sudah ada, jika belum buat otomatis
        $targetUser = \App\Models\User::find($targetUserId);
        if (!$targetUser) {
            return response()->json(['status' => 'error', 'message' => 'User not found'], 404);
        }

        $intiFamily = Family::firstOrCreate(
            ['user_id' => $targetUserId, 'type' => 'inti'],
            ['kk_number' => null]
        );

        if ($intiFamily->wasRecentlyCreated || $intiFamily->members()->count() === 0) {
            // Coba cari ID untuk Kepala Keluarga, fallback ke 1
            $kepalaKeluargaStatus = \App\Models\FamilyRelationStatus::where('name', 'like', '%Kepala%')->first();
            
            FamilyMember::create([
                'family_id' => $intiFamily->id,
                'name' => $targetUser->name,
                'nik' => $targetUser->nik,
                'birth_date' => null, // Biarkan kosong agar diisi secara manual nanti
                'relationship' => 'Kepala Keluarga',
                'family_relation_status_id' => $kepalaKeluargaStatus ? $kepalaKeluargaStatus->id : null
            ]);
        }

        $families = Family::with(['members.religion', 'members.familyRelationStatus'])->where('user_id', $targetUserId)->orderBy('type', 'asc')->get();

        // Hitung umur dinamis (frontend bisa hitung sendiri tapi kita sediakan juga field age)
        $families->each(function ($family) {
            $family->members->each(function ($member) {
                if ($member->birth_date) {
                    $member->age = Carbon::parse($member->birth_date)->age;
                } else {
                    $member->age = null;
                }
            });
        });

        return response()->json([
            'status' => 'success',
            'data' => $families
        ]);
    }

    public function storeFamily(Request $request)
    {
        $user = $request->user();
        
        $targetUserId = $user->id;
        if ($request->has('user_id') && $user->role_id !== 8) {
            $targetUserId = $request->user_id;
        }

        $familyId = null;
        if ($request->type === 'inti') {
            $exists = Family::where('user_id', $targetUserId)->where('type', 'inti')->first();
            if ($exists) $familyId = $exists->id;
        }

        $request->validate([
            'type' => 'required|in:inti,tambahan',
            'kk_number' => [
                'nullable', 'string',
                \Illuminate\Validation\Rule::unique('families')->ignore($familyId),
                function ($attribute, $value, $fail) {
                    if ($value && \App\Models\User::where('nik', $value)->exists()) {
                        $fail('Nomor KK ini sudah digunakan sebagai NIK akun warga lain.');
                    }
                    if ($value && FamilyMember::where('nik', $value)->exists()) {
                        $fail('Nomor KK ini sudah digunakan sebagai NIK anggota keluarga lain.');
                    }
                },
            ]
        ]);

        // Check logic moved up for validation

        if ($request->type === 'inti') {
            $exists = Family::where('user_id', $targetUserId)->where('type', 'inti')->first();
            if ($exists) {
                if ($request->filled('kk_number')) {
                    $exists->update(['kk_number' => $request->kk_number]);
                }
                return response()->json(['status' => 'success', 'data' => $exists]);
            }
        }

        $family = Family::create([
            'user_id' => $targetUserId,
            'type' => $request->type,
            'kk_number' => $request->kk_number
        ]);

        return response()->json([
            'status' => 'success',
            'message' => 'Kartu Keluarga berhasil ditambahkan',
            'data' => $family
        ]);
    }

    public function storeMember(Request $request, $familyId)
    {
        $request->validate([
            'nik' => [
                'nullable', 'string', 'max:16',
                'unique:family_members,nik',
                'unique:users,nik',
                function ($attribute, $value, $fail) {
                    if ($value && Family::where('kk_number', $value)->exists()) {
                        $fail('NIK ini sudah digunakan sebagai Nomor KK.');
                    }
                },
            ],
            'name' => 'required|string|max:255',
            'birth_date' => 'required|date',
            'family_relation_status_id' => 'required|exists:family_relation_statuses,id',
            'religion_id' => 'nullable|exists:religions,id'
        ]);

        $user = $request->user();
        $family = Family::where('user_id', $user->id)->findOrFail($familyId);

        $relationStatus = \App\Models\FamilyRelationStatus::find($request->family_relation_status_id);
        $enumValue = in_array($relationStatus->name, ['Kepala Keluarga', 'Istri', 'Anak', 'Lainnya']) ? $relationStatus->name : 'Lainnya';

        $member = FamilyMember::create([
            'family_id' => $family->id,
            'nik' => $request->nik,
            'name' => $request->name,
            'birth_date' => $request->birth_date,
            'relationship' => $enumValue,
            'family_relation_status_id' => $request->family_relation_status_id,
            'religion_id' => $request->religion_id
        ]);

        return response()->json([
            'status' => 'success',
            'message' => 'Anggota Keluarga berhasil ditambahkan',
            'data' => $member
        ]);
    }

    public function updateMember(Request $request, $familyId, $memberId)
    {
        $request->validate([
            'nik' => [
                'nullable', 'string', 'max:16',
                \Illuminate\Validation\Rule::unique('family_members')->ignore($memberId),
                \Illuminate\Validation\Rule::unique('users', 'nik'),
                function ($attribute, $value, $fail) {
                    if ($value && Family::where('kk_number', $value)->exists()) {
                        $fail('NIK ini sudah digunakan sebagai Nomor KK.');
                    }
                },
            ],
            'name' => 'required|string|max:255',
            'birth_date' => 'required|date',
            'family_relation_status_id' => 'required|exists:family_relation_statuses,id',
            'religion_id' => 'nullable|exists:religions,id'
        ]);

        $user = $request->user();
        $family = Family::where('user_id', $user->id)->findOrFail($familyId);
        $member = FamilyMember::where('family_id', $family->id)->findOrFail($memberId);

        $relationStatus = \App\Models\FamilyRelationStatus::find($request->family_relation_status_id);
        $enumValue = in_array($relationStatus->name, ['Kepala Keluarga', 'Istri', 'Anak', 'Lainnya']) ? $relationStatus->name : 'Lainnya';

        $member->update([
            'nik' => $request->nik,
            'name' => $request->name,
            'birth_date' => $request->birth_date,
            'relationship' => $enumValue,
            'family_relation_status_id' => $request->family_relation_status_id,
            'religion_id' => $request->religion_id
        ]);

        return response()->json([
            'status' => 'success',
            'message' => 'Anggota Keluarga berhasil diperbarui',
            'data' => $member
        ]);
    }
}
