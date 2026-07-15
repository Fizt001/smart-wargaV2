<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();
$users = App\Models\User::whereIn('email', ['hafis@btr7.com', 'ipit@btr7.com'])->get(['name', 'email', 'rt_id']);
echo json_encode($users);
