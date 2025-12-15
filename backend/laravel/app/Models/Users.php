<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;

class Users extends Authenticatable
{
    use HasFactory;

    protected $fillable = [
        'username',
        'email',
        'password',
        'full_name',
        'role',
        'status',
        'last_login',
        'department',
    ];

    protected $hidden = ['password'];

    public function logs()
    {
        return $this->hasMany(UserLog::class);
    }
}
