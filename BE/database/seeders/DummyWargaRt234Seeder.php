<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\House;
use App\Models\Family;
use App\Models\FamilyMember;
use App\Models\Block;
use App\Models\Rt;
use App\Models\Religion;
use App\Models\MaritalStatus;
use App\Models\ProfessionCategory;
use Faker\Factory as Faker;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class DummyWargaRt234Seeder extends Seeder
{
    /**
     * Run the database seeds.
     *
     * @return void
     */
    public function run()
    {
        $faker = Faker::create('id_ID');

        $religions = Religion::pluck('id')->toArray();
        $maritalStatuses = MaritalStatus::pluck('id')->toArray();
        $professions = ProfessionCategory::pluck('id')->toArray();

        // Ensure we have some master data
        if (empty($religions) || empty($maritalStatuses) || empty($professions)) {
            $this->command->error('Pastikan tabel Agama, Status Perkawinan, dan Kategori Profesi sudah terisi.');
            return;
        }

        $password = Hash::make('12345678');

        $this->command->info('Memulai pembuatan rumah dan warga dummy untuk RT 2, 3, dan 4...');

        $rtsConfig = [
            ['rt_id' => 2, 'block_id' => 2], // RT 2, Blok E2
            ['rt_id' => 3, 'block_id' => 3], // RT 3, Blok E3
            ['rt_id' => 4, 'block_id' => 4], // RT 4, Blok E4
        ];

        foreach ($rtsConfig as $config) {
            $rtId = $config['rt_id'];
            $blockId = $config['block_id'];
            
            $this->command->info("Generate untuk RT $rtId (Blok ID: $blockId)");

            // 50 rumah total, 48 dihuni
            // Pilih 2 nomor rumah secara acak yang akan dibiarkan kosong
            $emptyHouses = (array) array_rand(array_flip(range(1, 50)), 2);

            for ($i = 1; $i <= 50; $i++) {
                $houseNumber = str_pad($i, 2, '0', STR_PAD_LEFT);

                // Create House
                $house = House::create([
                    'block_id' => $blockId,
                    'number' => $houseNumber,
                ]);

                // Jika termasuk rumah kosong, lewati pembuatan keluarga
                if (in_array($i, $emptyHouses)) {
                    continue;
                }

                // Tentukan probabilitas struktur keluarga di rumah ini
                $rand = rand(1, 100);

                if ($rand <= 60) {
                    // 1. Keluarga Standar Lengkap (Ayah, Ibu, Anak)
                    $this->createKeluarga($faker, $house->id, $rtId, 'inti', true, true, rand(1, 3), 0, $password, $religions, $maritalStatuses, $professions);
                } elseif ($rand <= 75) {
                    // 2. Suami Istri Tanpa Anak
                    $this->createKeluarga($faker, $house->id, $rtId, 'inti', true, true, 0, 0, $password, $religions, $maritalStatuses, $professions);
                } elseif ($rand <= 85) {
                    // 3. Single / Janda / Duda
                    $this->createKeluarga($faker, $house->id, $rtId, 'inti', true, false, rand(0, 2), 0, $password, $religions, $maritalStatuses, $professions);
                } elseif ($rand <= 95) {
                    // 4. Keluarga Extended (Ada mertua / keponakan)
                    $this->createKeluarga($faker, $house->id, $rtId, 'inti', true, true, rand(1, 2), rand(1, 2), $password, $religions, $maritalStatuses, $professions);
                } else {
                    // 5. 1 Rumah ada 2 KK (Misal anak sudah berkeluarga tapi tinggal di rumah yang sama)
                    // KK Pertama (Ayah Ibu)
                    $this->createKeluarga($faker, $house->id, $rtId, 'inti', true, true, rand(0, 1), 0, $password, $religions, $maritalStatuses, $professions);
                    // KK Kedua (Anak)
                    $this->createKeluarga($faker, $house->id, $rtId, 'tambahan', true, true, rand(0, 1), 0, $password, $religions, $maritalStatuses, $professions);
                }
            }
        }

        $this->command->info('Berhasil membuat rumah dan data warga dummy di RT 2, 3, dan 4!');
    }

    private function createKeluarga($faker, $houseId, $rtId, $type, $hasAyah, $hasIbu, $jumlahAnak, $jumlahLainnya, $password, $religions, $maritalStatuses, $professions)
    {
        // Tentukan Kepala Keluarga (KK)
        $namaKk = '';
        $genderKk = '';
        
        if ($hasAyah) {
            $namaKk = $faker->name('male');
            $genderKk = 'Laki-laki';
        } else {
            // Jika single mother
            $namaKk = $faker->name('female');
            $genderKk = 'Perempuan';
        }

        // Format Email
        // hilangkan spasi dan gelar, lowercase
        $emailBase = strtolower(preg_replace('/[^a-zA-Z]/', '', explode(',', $namaKk)[0]));
        $email = $emailBase . rand(100, 9999) . '@sip.com'; // Tambahkan random agar pasti unik
        
        // Pastikan email unik (tambahkan random number jika sudah ada)
        while (User::where('email', $email)->exists()) {
            $email = $emailBase . rand(100, 99999) . '@sip.com';
        }

        // Create User (Kepala Keluarga)
        $user = User::create([
            'role_id' => 8, // Warga
            'rt_id' => $rtId,
            'house_id' => $houseId,
            'name' => $namaKk,
            'email' => $email,
            'phone_number' => $faker->numerify('08##########'),
            'password' => $password,
            'is_approved' => true,
            'registration_status' => 'approved',
            'religion_id' => $faker->randomElement($religions),
            'marital_status_id' => $hasIbu ? $maritalStatuses[1] ?? null : $maritalStatuses[2] ?? null,
            'profession_category_id' => $faker->randomElement($professions),
        ]);

        // Create Family
        $family = Family::create([
            'user_id' => $user->id,
            'type' => $type,
            'kk_number' => $faker->numerify('327#############'),
        ]);

        // Create Family Member (Kepala Keluarga itu sendiri)
        FamilyMember::create([
            'family_id' => $family->id,
            'nik' => $faker->numerify('327#############'),
            'name' => $namaKk,
            'birth_date' => $faker->dateTimeBetween('-60 years', '-30 years')->format('Y-m-d'),
            'relationship' => 'Kepala Keluarga',
            'religion_id' => $faker->randomElement($religions),
        ]);

        // Create Istri jika ada
        if ($hasAyah && $hasIbu) {
            FamilyMember::create([
                'family_id' => $family->id,
                'nik' => $faker->numerify('327#############'),
                'name' => $faker->name('female'),
                'birth_date' => $faker->dateTimeBetween('-55 years', '-25 years')->format('Y-m-d'),
                'relationship' => 'Istri',
                'religion_id' => $faker->randomElement($religions),
            ]);
        }

        // Create Anak
        for ($i = 0; $i < $jumlahAnak; $i++) {
            $isMale = $faker->boolean();
            FamilyMember::create([
                'family_id' => $family->id,
                'nik' => $faker->numerify('327#############'),
                'name' => $faker->name($isMale ? 'male' : 'female'),
                'birth_date' => $faker->dateTimeBetween('-25 years', '-1 years')->format('Y-m-d'),
                'relationship' => 'Anak',
                'religion_id' => $faker->randomElement($religions),
            ]);
        }

        // Create Lainnya (Mertua, Keponakan, dll)
        for ($i = 0; $i < $jumlahLainnya; $i++) {
            $isMale = $faker->boolean();
            FamilyMember::create([
                'family_id' => $family->id,
                'nik' => $faker->numerify('327#############'),
                'name' => $faker->name($isMale ? 'male' : 'female'),
                'birth_date' => $faker->dateTimeBetween('-80 years', '-10 years')->format('Y-m-d'),
                'relationship' => 'Lainnya',
                'religion_id' => $faker->randomElement($religions),
            ]);
        }
    }
}
