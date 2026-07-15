<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();
echo json_encode(App\Models\User::where('role_id', 7)->get(['name', 'email', 'rt_id'])->toArray());
