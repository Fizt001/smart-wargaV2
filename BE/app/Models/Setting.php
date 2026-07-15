<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Setting extends Model
{
    use HasFactory;

    protected $fillable = [
        'key',
        'value',
        'type',
        'group',
        'label',
    ];

    /**
     * Get a setting value by its key.
     * 
     * @param string $key
     * @param mixed $default
     * @return mixed
     */
    public static function getVal($key, $default = null)
    {
        $setting = self::where('key', $key)->first();
        if (!$setting) return $default;

        if ($setting->type === 'boolean') {
            return $setting->value === 'true' || $setting->value === '1';
        }
        if ($setting->type === 'integer') {
            return (int)$setting->value;
        }
        if ($setting->type === 'json') {
            return json_decode($setting->value, true);
        }
        return $setting->value;
    }
}
