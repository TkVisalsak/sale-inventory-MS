<?php

// legacy filename: sales.php
// Replaced by App\\Models\\Sale (file: Sale.php) to conform with PSR-4 autoloading.
// This file intentionally left blank.

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
