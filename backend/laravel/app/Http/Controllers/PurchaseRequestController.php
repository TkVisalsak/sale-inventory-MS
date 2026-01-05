<?php

namespace App\Http\Controllers;

use App\Models\PurchaseRequest;
use App\Models\PurchaseRequestItem;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class PurchaseRequestController extends Controller
{
    /**
     * List purchase requests with requester and items relations.
     */
    public function index(): JsonResponse
    {
        $requests = PurchaseRequest::with([
                'requester',
                'items.product',
                'items.supplier',
            ])
            ->orderByDesc('created_at')
            ->get();

        return response()->json($requests);
    }

    /**
     * Show a single purchase request with all related data.
     */
    public function show(int $id): JsonResponse
    {
        $request = PurchaseRequest::with([
                'requester',
                'items.product',
                'items.supplier',
            ])->findOrFail($id);

        return response()->json($request);
    }

    /**
     * Store a new purchase request with items.
     *
     * Expected payload:
     * {
     *   "requested_by": user_id,
     *   "status": "draft" | "submitted" | "approved" | "rejected",
     *   "note": "optional note",
     *   "items": [
     *     {
     *       "product_id": 1,
     *       "requested_qty": 10,
     *       "estimated_price": 12.5,
     *       "supplier_id": 3
     *     }
     *   ]
     * }
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'requested_by' => ['required', 'exists:users,id'],
            'status'       => ['nullable', 'in:draft,submitted,approved,rejected'],
            'note'         => ['nullable', 'string'],
            'items'        => ['required', 'array', 'min:1'],
            'items.*.product_id'      => ['required', 'exists:products,id'],
            'items.*.requested_qty'   => ['required', 'integer', 'min:1'],
            'items.*.estimated_price' => ['nullable', 'numeric', 'min:0'],
            'items.*.supplier_id'     => ['required', 'exists:supplier,id'],
        ]);

        return DB::transaction(function () use ($validated) {
            $nextNumber = $this->generatePrNumber();

            $purchaseRequest = PurchaseRequest::create([
                'pr_number'    => $nextNumber,
                'requested_by' => $validated['requested_by'],
                'status'       => $validated['status'] ?? 'draft',
                'note'         => $validated['note'] ?? null,
            ]);

            foreach ($validated['items'] as $item) {
                PurchaseRequestItem::create([
                    'pr_id'           => $purchaseRequest->id,
                    'product_id'      => $item['product_id'],
                    'requested_qty'   => $item['requested_qty'],
                    'estimated_price' => $item['estimated_price'] ?? null,
                    'supplier_id'     => $item['supplier_id'],
                ]);
            }

            return response()->json([
                'message' => 'Purchase request created successfully',
                'data'    => $purchaseRequest->load('items'),
            ], 201);
        });
    }

    /**
     * Simple PR number generator (PR-YYYYMMDD-XXXX).
     */
    protected function generatePrNumber(): string
    {
        $datePart = now()->format('Ymd');
        $randomPart = Str::upper(Str::random(4));

        return "PR-{$datePart}-{$randomPart}";
    }
}


