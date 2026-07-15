<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();
App\Models\User::where('email', 'brt1@btr7.com')->update(['rt_id' => 1]);
echo "updated";
