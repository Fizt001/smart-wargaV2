<?php

namespace Database\Seeders;

use App\Models\User;
// use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // 1. Seed Roles
        $roles = [
            'Superadmin',         // 1
            'Ketua RW',           // 2
            'Ketua RT',           // 3
            'Sekretaris RW',      // 4
            'Bendahara RW',       // 5
            'Sekretaris RT',      // 6
            'Bendahara RT',       // 7
            'Warga'               // 8
        ];

        foreach ($roles as $role) {
            \App\Models\Role::create(['name' => $role]);
        }

        // 2. Seed Master Wilayah (Contoh 3 RT dan 1 Blok)
        $rts = [
            \App\Models\Rt::create(['name' => 'RT 01']),
            \App\Models\Rt::create(['name' => 'RT 02']),
            \App\Models\Rt::create(['name' => 'RT 03']),
        ];

        $block = \App\Models\Block::create([
            'name' => 'Blok E1',
            'rt_id' => $rts[0]->id
        ]);

        // Seed Houses for Blok E1
        $house1 = \App\Models\House::create(['block_id' => $block->id, 'number' => '01']);
        $house2 = \App\Models\House::create(['block_id' => $block->id, 'number' => '02']);

        // 3. Seed Superadmin User
        \App\Models\User::create([
            'name' => 'Super Admin',
            'email' => 'admin@sip.com',
            'password' => Hash::make('password123'),
            'role_id' => 1,
            'is_approved' => true,
        ]);
        // 4. Seed Finance Categories
        $categories = [
            ['name' => 'Iuran Warga Bulanan', 'type' => 'income'],
            ['name' => 'Donasi / Sumbangan', 'type' => 'income'],
            ['name' => 'Biaya Kebersihan (Sampah)', 'type' => 'expense'],
            ['name' => 'Biaya Keamanan', 'type' => 'expense'],
            ['name' => 'Listrik Fasum', 'type' => 'expense'],
            ['name' => 'Konsumsi Rapat / Acara', 'type' => 'expense'],
        ];

        foreach ($categories as $cat) {
            \App\Models\FinanceCategory::create($cat);
        }

        // 5. Seed Letter Types
        $letterTypes = [
            ['name' => 'Surat Pengantar KTP', 'requires_rw_approval' => false],
            ['name' => 'Surat Pengantar Domisili', 'requires_rw_approval' => true],
            ['name' => 'Surat Pengantar SKCK', 'requires_rw_approval' => false],
            ['name' => 'Surat Keterangan Tidak Mampu', 'requires_rw_approval' => true],
            ['name' => 'Surat Pengantar Nikah', 'requires_rw_approval' => true],
        ];

        foreach ($letterTypes as $type) {
            \App\Models\LetterType::create($type);
        }

        // 6. Seed Master Data Warga
        $religions = ['Islam', 'Kristen', 'Katolik', 'Hindu', 'Buddha', 'Konghucu'];
        foreach ($religions as $rel) {
            \App\Models\Religion::create(['name' => $rel]);
        }

        $maritalStatuses = ['Belum Kawin', 'Kawin', 'Cerai Hidup', 'Cerai Mati'];
        foreach ($maritalStatuses as $ms) {
            \App\Models\MaritalStatus::create(['name' => $ms]);
        }

        $professions = ['Belum/Tidak Bekerja', 'Mengurus Rumah Tangga', 'Pelajar/Mahasiswa', 'Pensiunan', 'PNS', 'TNI/Polri', 'Karyawan Swasta', 'Wiraswasta', 'Buruh Harian Lepas', 'Lainnya'];
        foreach ($professions as $prof) {
            \App\Models\ProfessionCategory::create(['name' => $prof]);
        }
    }
}
