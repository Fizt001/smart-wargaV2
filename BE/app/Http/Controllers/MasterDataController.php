<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Role;
use App\Models\Block;
use App\Models\Religion;
use App\Models\MaritalStatus;
use App\Models\ProfessionCategory;

class MasterDataController extends Controller
{
    public function index()
    {
        return response()->json([
            'status' => 'success',
            'data' => [
                'roles' => Role::all(),
                'blocks' => Block::all(),
                'rts' => \App\Models\Rt::all(),
                'religions' => Religion::all(),
                'marital_statuses' => MaritalStatus::all(),
                'professions' => ProfessionCategory::all(),
                'family_relation_statuses' => \App\Models\FamilyRelationStatus::all(),
            ]
        ]);
    }
}
