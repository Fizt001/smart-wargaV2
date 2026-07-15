<?php
$houses = App\Models\House::where('block_id', 1)->orderBy('id')->get();
$unique = [];
foreach($houses as $h) {
  if (isset($unique[$h->number])) {
    $masterId = $unique[$h->number];
    App\Models\User::where('house_id', $h->id)->update(['house_id' => $masterId]);
    $h->delete();
  } else {
    $unique[$h->number] = $h->id;
  }
}
echo 'Duplicates merged!';
