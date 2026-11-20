<?php

declare(strict_types=1);

namespace App\Enums;

enum CreditPriceRetrievalStatus: string
{
    case FAILED = 'failed';

    case MIXED = 'mixed';

    case NO_TRADES = 'no_trades';

    case PENDING = 'pending';

    case RESOLVED = 'resolved';

    case UNRESOLVED = 'unresolved';
}
